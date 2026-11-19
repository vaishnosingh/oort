package main

import (
	"bytes"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gocql/gocql"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

//go:embed templates/*
var templatesFS embed.FS

var tmpl *template.Template
var scyllaSession *gocql.Session

func initDB() {
	cluster := gocql.NewCluster("127.0.0.1")
	cluster.Keyspace = "system"
	cluster.Timeout = 10 * time.Second

	var sys *gocql.Session
	var err error
	for i := 0; i < 60; i++ {
		sys, err = cluster.CreateSession()
		if err == nil {
			break
		}
		log.Printf("[DB] Waiting for ScyllaDB (%d/60): %v", i+1, err)
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		log.Fatalf("[DB] Failed to connect: %v", err)
	}

	err = sys.Query("CREATE KEYSPACE IF NOT EXISTS oort WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': 1}").Exec()
	if err != nil {
		log.Fatalf("[DB] Failed to create keyspace: %v", err)
	}
	sys.Close()

	kCluster := gocql.NewCluster("127.0.0.1")
	kCluster.Keyspace = "oort"
	kCluster.Timeout = 10 * time.Second
	scyllaSession, err = kCluster.CreateSession()
	if err != nil {
		log.Fatalf("[DB] Failed to connect to oort keyspace: %v", err)
	}

	scyllaSession.Query(`CREATE TABLE IF NOT EXISTS oort.users (
		email               text PRIMARY KEY,
		name                text,
		password_hash       text,
		access_key          text,
		secret_key          text,
		bucket              text,
		session_id          text,
		username            text,
		profile_image       text,
		bucket_display_name text,
		created_at          bigint,
		session_created_at  bigint
	)`).Exec()

	// Ensure session_created_at column exists for schema evolution
	scyllaSession.Query(`ALTER TABLE oort.users ADD session_created_at bigint`).Exec()
	scyllaSession.Query(`CREATE INDEX IF NOT EXISTS oort_users_session ON oort.users (session_id)`).Exec()
	scyllaSession.Query(`CREATE INDEX IF NOT EXISTS oort_users_username ON oort.users (username)`).Exec()

	scyllaSession.Query(`CREATE TABLE IF NOT EXISTS oort.pending (
		reg_token     text PRIMARY KEY,
		session_id    text,
		name          text,
		email         text,
		password_hash text,
		username      text,
		profile_image text
	)`).Exec()

	scyllaSession.Query(`CREATE TABLE IF NOT EXISTS oort.password_reset_tokens (
		reset_token text PRIMARY KEY,
		email       text,
		expires_at  bigint
	)`).Exec()

	InitExpansionSchema()

	log.Println("[DB] Oort ScyllaDB ready")
}

func init() {
	tmpl = template.Must(template.ParseFS(templatesFS, "templates/*.html"))
}

func generateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", n.Int64())
}

func sendVerificationEmail(email, token string) {
	msg := fmt.Sprintf("From: noreply@oort.linuxguy.space\r\nTo: %s\r\nSubject: Verify your Oort S3 Account\r\n\r\nYour verification code is: %s\r\n\r\nEnter this 6-digit code in the portal to verify your account.\r\n",
		email, token)
	cmd := exec.Command("msmtp", "-t")
	cmd.Stdin = bytes.NewBufferString(msg)
	if err := cmd.Run(); err != nil {
		log.Printf("[MAIL] Failed: %v", err)
	}
}

// generateSecureSessionID generates a cryptographically secure 256-bit session token.
func generateSecureSessionID() string {
	b := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return strings.ReplaceAll(uuid.New().String(), "-", "") + strings.ReplaceAll(uuid.New().String(), "-", "")
	}
	return hex.EncodeToString(b)
}

const sessionMaxAge = 14 * 24 * time.Hour // 14-day rolling session validity

func lookupBySession(sid string) (name, ak, sk, bucket string, err error) {
	if sid == "" {
		return "", "", "", "", fmt.Errorf("empty session")
	}
	var sessionCreatedAt int64
	var userEmail string
	err = scyllaSession.Query(
		`SELECT email, name, access_key, secret_key, bucket, session_created_at FROM oort.users WHERE session_id = ? ALLOW FILTERING`,
		sid).Scan(&userEmail, &name, &ak, &sk, &bucket, &sessionCreatedAt)
	if err != nil {
		return
	}
	if sessionCreatedAt > 0 && time.Since(time.Unix(sessionCreatedAt, 0)) > sessionMaxAge {
		// Session expired: revoke from database using primary key (email)
		if userEmail != "" {
			scyllaSession.Query(`UPDATE oort.users SET session_id = '', session_created_at = 0 WHERE email = ?`, userEmail).Exec()
		}
		err = fmt.Errorf("session expired")
		name, ak, sk, bucket = "", "", "", ""
	}
	return
}

func handleLanding(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/oort" && r.URL.Path != "/oort/" {
		// Fall through to public proxy if it matches pattern
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) >= 3 {
			handleS3PublicProxy(w, r, parts[0], strings.Join(parts[1:], "/"))
			return
		}
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl.ExecuteTemplate(w, "index.html", nil)
}

func getTurnstileSiteKey() string {
	if k := os.Getenv("CF_TURNSTILE_SITEKEY"); k != "" {
		return k
	}
	return "0x4AAAAAAF_flMp-6vS8-3h7"
}

func getTurnstileSecret() string {
	return os.Getenv("CF_TURNSTILE_SECRET")
}

type turnstileVerifyResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

func verifyTurnstile(r *http.Request) bool {
	response := r.FormValue("cf-turnstile-response")
	if response == "" {
		log.Printf("[TURNSTILE] Missing cf-turnstile-response token")
		return false
	}
	secret := getTurnstileSecret()

	remoteIP := r.Header.Get("CF-Connecting-IP")
	if remoteIP == "" {
		remoteIP = r.Header.Get("X-Forwarded-For")
	}
	if remoteIP == "" {
		remoteIP = r.RemoteAddr
		if colon := strings.LastIndex(remoteIP, ":"); colon != -1 {
			remoteIP = remoteIP[:colon]
		}
	}

	data := url.Values{
		"secret":   {secret},
		"response": {response},
	}
	if remoteIP != "" {
		data.Set("remoteip", remoteIP)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", data)
	if err != nil {
		log.Printf("[TURNSTILE] Request error: %v", err)
		return false
	}
	defer resp.Body.Close()

	var result turnstileVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("[TURNSTILE] JSON decode error: %v", err)
		return false
	}

	if !result.Success {
		log.Printf("[TURNSTILE] Verification failed: %v", result.ErrorCodes)
	}
	return result.Success
}

func handleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" || r.Method == "HEAD" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "signup.html", map[string]string{
			"Service":          "oort",
			"TurnstileSiteKey": getTurnstileSiteKey(),
		})
		return
	}
	r.ParseMultipartForm(10 << 20)
	if !verifyTurnstile(r) {
		log.Printf("[SIGNUP] Turnstile security check failed")
		http.Error(w, "Security verification (CAPTCHA) failed. Please try again.", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	username := strings.ToLower(strings.TrimSpace(r.FormValue("username")))
	email := strings.ToLower(strings.TrimSpace(r.FormValue("email")))
	password := r.FormValue("password")
	confirm := r.FormValue("confirm_password")

	if email == "" || password == "" || name == "" || username == "" {
		http.Error(w, "All fields required", http.StatusBadRequest)
		return
	}
	if password != confirm {
		http.Error(w, "Passwords do not match", http.StatusBadRequest)
		return
	}

	var profileImageBase64 string
	file, _, err := r.FormFile("profile_image")
	if err == nil {
		defer file.Close()
		b, err := io.ReadAll(file)
		if err == nil && len(b) > 0 {
			profileImageBase64 = "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(b)
		}
	}

	var ex string
	if scyllaSession.Query(`SELECT email FROM oort.users WHERE email = ? ALLOW FILTERING`, email).Scan(&ex) == nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}
	if scyllaSession.Query(`SELECT email FROM oort.users WHERE username = ? ALLOW FILTERING`, username).Scan(&ex) == nil {
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	regToken := generateOTP()
	sessionID := uuid.New().String()

	if err := scyllaSession.Query(`INSERT INTO oort.pending (reg_token, session_id, name, email, password_hash, username, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		regToken, sessionID, name, email, string(hash), username, profileImageBase64).Exec(); err != nil {
		log.Printf("[SIGNUP] DB: %v", err)
		http.Error(w, "Database error", 500)
		return
	}

	go sendVerificationEmail(email, regToken)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verify Email – Oort S3</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#000;color:#fff;font-family:-apple-system,sans-serif;text-align:center;padding:120px 20px}.sp{border:3px solid rgba(255,255,255,0.1);width:40px;height:40px;border-radius:50%;border-left-color:#2997ff;animation:spin 1s linear infinite;margin:0 auto 32px;display:none}@keyframes spin{to{transform:rotate(360deg)}}h2{font-size:32px;margin-bottom:12px}p{color:#86868b;font-size:17px;line-height:1.5;margin-bottom:30px}input{background:#111;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:24px;padding:16px;border-radius:12px;width:200px;text-align:center;letter-spacing:4px;outline:none}input:focus{border-color:#2997ff}button{background:#fff;color:#000;border:none;padding:16px 32px;font-size:17px;font-weight:600;border-radius:12px;cursor:pointer;margin-top:20px;transition:.2s}button:hover{background:#f5f5f7}button:active{transform:scale(0.98)}</style></head><body><div id="sp" class="sp"></div><h2 id="hd">Check your email</h2><p id="sb">We sent a 6-digit verification code to ` + email + `.<br>It may take a moment to arrive.</p><form id="fm" onsubmit="event.preventDefault(); verify()"><input type="text" id="code" maxlength="6" pattern="[0-9]{6}" autocomplete="off" autofocus required placeholder="000000"><br><button type="submit">Verify Email</button></form><script>async function verify(){document.getElementById('sp').style.display='block';document.getElementById('fm').style.display='none';document.getElementById('hd').innerText='Verifying...';document.getElementById('sb').innerText='Please wait while we set up your account.';const r=await fetch('/verify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'code='+document.getElementById('code').value});if(r.ok){const data=await r.json();location.href=data.redirect;}else{document.getElementById('sp').style.display='none';document.getElementById('fm').style.display='block';document.getElementById('hd').innerText='Verification Failed';document.getElementById('sb').innerText='The code was incorrect. Please try again.';}}</script></body></html>`))
}

func handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		r.ParseForm()
	}
	token := r.FormValue("code")
	if token == "" {
		token = r.FormValue("token")
	}
	if token == "" {
		token = r.URL.Query().Get("token")
	}
	if token == "" {
		http.Error(w, "Missing token", 400)
		return
	}

	var sessionID, name, email, passwordHash, username, profileImage string
	err := scyllaSession.Query(`SELECT session_id, name, email, password_hash, username, profile_image FROM oort.pending WHERE reg_token = ?`,
		token).Scan(&sessionID, &name, &email, &passwordHash, &username, &profileImage)
	if err != nil {
		if r.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
			http.Error(w, "Invalid token", 400)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprint(w, `<html><body style="background:#0a0a0b;color:#fafafa;font-family:sans-serif;text-align:center;padding:100px"><h2>Invalid or expired code.</h2></body></html>`)
		return
	}

	accessKey := email
	secretKey := strings.ReplaceAll(uuid.New().String(), "-", "") + strings.ReplaceAll(uuid.New().String(), "-", "")[:8]
	bucket := "unity-" + strings.ReplaceAll(uuid.New().String(), "-", "")[:8]
	createdAt := time.Now().Unix()
	if sessionID == "" {
		sessionID = generateSecureSessionID()
	}

	if err = scyllaSession.Query(`INSERT INTO oort.users (email, name, password_hash, access_key, secret_key, bucket, bucket_display_name, session_id, username, profile_image, created_at, session_created_at) VALUES (?, ?, ?, ?, ?, ?, 'mybucket', ?, ?, ?, ?, ?)`,
		email, name, passwordHash, accessKey, secretKey, bucket, sessionID, username, profileImage, createdAt, createdAt).Exec(); err != nil {
		log.Printf("[VERIFY] Insert failed: %v", err)
		http.Error(w, "Failed to create account", 500)
		return
	}
	scyllaSession.Query(`DELETE FROM oort.pending WHERE reg_token = ?`, token).Exec()

	go provisionMinIO(accessKey, secretKey, bucket)

	if r.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"redirect": "/login?verified=1"}`)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verified – Oort S3</title><style>
body{background:#0a0a0b;color:#fafafa;font-family:-apple-system,sans-serif;text-align:center;padding:120px 20px}
.ck{width:64px;height:64px;border-radius:16px;background:rgba(34,197,94,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px}
h2{font-size:32px;margin-bottom:12px}p{color:#a1a1aa;font-size:15px;line-height:1.6;margin-bottom:40px}
a{background:#fafafa;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600}
</style></head><body>
<div class="ck"><svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22c55e" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
<h2>Email Verified!</h2>
<p>Your Oort S3 workspace is provisioned.<br>You can now sign in.</p>
<a href="/login">Continue to Login</a>
</body></html>`)
}

func handlePoll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	sid := r.URL.Query().Get("sid")
	if sid == "" {
		w.Write([]byte(`{"ok": false}`))
		return
	}
	var email string
	if scyllaSession.Query(`SELECT email FROM oort.users WHERE session_id = ? ALLOW FILTERING`, sid).Scan(&email) == nil {
		w.Write([]byte(`{"ok": true}`))
	} else {
		w.Write([]byte(`{"ok": false}`))
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" || r.Method == "HEAD" {
		// If user already authenticated, redirect directly to console
		if _, _, _, ok := authS3Console(r); ok {
			http.Redirect(w, r, "/console", http.StatusFound)
			return
		}

		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		data := map[string]string{
			"Service":          "oort",
			"TurnstileSiteKey": getTurnstileSiteKey(),
		}
		if r.URL.Query().Get("error") == "captcha" {
			data["Error"] = "Security verification (CAPTCHA) failed. Please try again."
		} else if r.URL.Query().Get("error") != "" {
			data["Error"] = "Invalid credentials."
		}
		tmpl.ExecuteTemplate(w, "login.html", data)
		return
	}
	r.ParseForm()

	if !verifyTurnstile(r) {
		log.Printf("[LOGIN] Turnstile verification failed for login attempt")
		http.Redirect(w, r, "/login?error=captcha", http.StatusFound)
		return
	}

	ident := strings.ToLower(strings.TrimSpace(r.FormValue("email")))
	password := r.FormValue("password")

	var passwordHash, userEmail string
	var err error

	if strings.Contains(ident, "@") {
		err = scyllaSession.Query(
			`SELECT password_hash, email FROM oort.users WHERE email = ? ALLOW FILTERING`,
			ident,
		).Scan(&passwordHash, &userEmail)
	} else {
		err = scyllaSession.Query(
			`SELECT password_hash, email FROM oort.users WHERE username = ? ALLOW FILTERING`,
			ident,
		).Scan(&passwordHash, &userEmail)
	}

	if err != nil || userEmail == "" {
		log.Printf("[LOGIN] User not found for '%s': %v", ident, err)
		http.Redirect(w, r, "/login?error=1", http.StatusFound)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)) != nil {
		log.Printf("[LOGIN] Password mismatch for '%s'", ident)
		http.Redirect(w, r, "/login?error=1", http.StatusFound)
		return
	}

	// ROTATE SESSION: Generate fresh cryptographic session ID upon every successful login
	newSessionID := generateSecureSessionID()
	now := time.Now().Unix()

	if err := scyllaSession.Query(
		`UPDATE oort.users SET session_id = ?, session_created_at = ? WHERE email = ?`,
		newSessionID, now, userEmail,
	).Exec(); err != nil {
		log.Printf("[LOGIN] Failed to update session in DB: %v", err)
		http.Redirect(w, r, "/login?error=internal", http.StatusFound)
		return
	}

	isSecure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
	http.SetCookie(w, &http.Cookie{
		Name:     "oort_session",
		Value:    newSessionID,
		Path:     "/",
		MaxAge:   86400 * 14,
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "cosmos_sid",
		Value:    newSessionID,
		Path:     "/",
		MaxAge:   86400 * 14,
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, "/console", http.StatusFound)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	var sid string
	if c, err := r.Cookie("oort_session"); err == nil && c.Value != "" {
		sid = c.Value
	} else if c, err := r.Cookie("cosmos_sid"); err == nil && c.Value != "" {
		sid = c.Value
	}

	if sid != "" {
		// Server-side session invalidation: look up user by sid and revoke via primary key
		var email string
		if scyllaSession.Query(`SELECT email FROM oort.users WHERE session_id = ? ALLOW FILTERING`, sid).Scan(&email) == nil && email != "" {
			scyllaSession.Query(`UPDATE oort.users SET session_id = '', session_created_at = 0 WHERE email = ?`, email).Exec()
		}
	}

	http.SetCookie(w, &http.Cookie{Name: "oort_session", Value: "", Path: "/", MaxAge: -1, HttpOnly: true})
	http.SetCookie(w, &http.Cookie{Name: "cosmos_sid", Value: "", Path: "/", MaxAge: -1, HttpOnly: true})
	http.Redirect(w, r, "/", http.StatusFound)
}

func handleDashboard(w http.ResponseWriter, r *http.Request) {
	sid := r.URL.Query().Get("sid")
	if sid == "" {
		if c, err := r.Cookie("cosmos_sid"); err == nil {
			sid = c.Value
		}
	}
	if sid == "" {
		if c, err := r.Cookie("oort_session"); err == nil {
			sid = c.Value
		}
	}
	if sid == "" {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}
	name, ak, sk, bucket, err := lookupBySession(sid)
	if err != nil || ak == "" {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Oort S3 Storage Dashboard</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#000;color:#fff;font-family:-apple-system,sans-serif;min-height:100vh}
nav{position:fixed;top:0;width:100%%;height:44px;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;z-index:999}
.ni{max-width:980px;width:100%%;display:flex;justify-content:space-between;padding:0 22px;font-size:12px}
nav a{color:rgba(255,255,255,0.8);text-decoration:none}
.main{max-width:680px;margin:0 auto;padding:100px 22px 60px}
h1{font-size:48px;font-weight:700;margin-bottom:8px}
.sub{color:#86868b;font-size:19px;margin-bottom:48px}
.card{background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;margin-bottom:16px}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#86868b;font-weight:600;margin-bottom:6px}
.val{font-family:monospace;font-size:15px;color:#2997ff;word-break:break-all}
.btn{display:inline-block;margin-top:40px;background:#fff;color:#000;padding:16px 36px;border-radius:980px;text-decoration:none;font-size:17px;font-weight:500}
</style></head><body>
<nav><div class="ni"><a href="/">Oort</a><a href="/console" style="color:#fff;font-weight:600">Console</a><a href="/logout" style="color:#ff3b30;margin-left:24px;font-weight:600">Sign Out</a></div></nav>
<div class="main">
<h1>Welcome, %s.</h1><p class="sub">Your S3 workspace is provisioned.</p>
<div class="card"><div class="lbl">Access Key ID</div><div class="val">%s</div></div>
<div class="card"><div class="lbl">Secret Access Key</div><div class="val">%s</div></div>
<div class="card"><div class="lbl">Private Bucket</div><div class="val">%s</div></div>
<div class="card"><div class="lbl">S3 Endpoint</div><div class="val">https://oort.linuxguy.space</div></div>
<a href="/console" class="btn">Open Storage Console →</a>
</div></body></html>`, name, ak, sk, bucket)
}

const resetTokenMaxAge = 1 * time.Hour

func sendPasswordResetEmail(toEmail, token string) {
	link := fmt.Sprintf("https://oort.linuxguy.space/reset-password?token=%s", token)
	msg := fmt.Sprintf(
		"From: noreply@oort.linuxguy.space\r\nTo: %s\r\nSubject: Reset your Oort S3 password\r\n\r\n"+
			"Hello,\r\n\r\n"+
			"A password reset was requested for your Oort S3 account.\r\n"+
			"Click the link below to set a new password:\r\n\r\n"+
			"%s\r\n\r\n"+
			"This link will expire in 1 hour.\r\n"+
			"If you did not request this reset, you can safely ignore this email.\r\n\r\n"+
			"— The Oort Team\r\n",
		toEmail, link,
	)
	cmd := exec.Command("msmtp", "-t")
	cmd.Stdin = bytes.NewBufferString(msg)
	if err := cmd.Run(); err != nil {
		log.Printf("[MAIL] Failed to send password reset: %v", err)
	}
}

func handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" || r.Method == "HEAD" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
			"Service":          "oort",
			"Step":             "request",
			"Sent":             r.URL.Query().Get("sent") == "1",
			"TurnstileSiteKey": getTurnstileSiteKey(),
		})
		return
	}

	r.ParseForm()
	if !verifyTurnstile(r) {
		log.Printf("[RESET] Turnstile verification failed for password reset")
		http.Redirect(w, r, "/forgot-password?error=captcha", http.StatusFound)
		return
	}
	email := strings.ToLower(strings.TrimSpace(r.FormValue("email")))
	if email == "" {
		http.Redirect(w, r, "/forgot-password", http.StatusFound)
		return
	}

	go func() {
		var name string
		err := scyllaSession.Query(
			`SELECT name FROM oort.users WHERE email = ?`, email,
		).Scan(&name)
		if err != nil {
			log.Printf("[RESET] Email not found: %s", email)
			return
		}
		token := uuid.New().String()
		expiresAt := time.Now().Add(resetTokenMaxAge).Unix()

		scyllaSession.Query(`DELETE FROM oort.password_reset_tokens WHERE reset_token = ?`, token).Exec()
		if err := scyllaSession.Query(
			`INSERT INTO oort.password_reset_tokens (reset_token, email, expires_at) VALUES (?, ?, ?)`,
			token, email, expiresAt,
		).Exec(); err != nil {
			log.Printf("[RESET] DB insert failed: %v", err)
			return
		}
		sendPasswordResetEmail(email, token)
	}()

	http.Redirect(w, r, "/forgot-password?sent=1", http.StatusFound)
}

func handleResetPassword(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if r.Method == "POST" {
		r.ParseForm()
		token = r.FormValue("token")
	}

	renderError := func(msg string) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
			"Service": "oort",
			"Step":    "reset",
			"Token":   token,
			"Error":   msg,
		})
	}

	if token == "" {
		http.Redirect(w, r, "/forgot-password", http.StatusFound)
		return
	}

	var email string
	var expiresAt int64
	err := scyllaSession.Query(
		`SELECT email, expires_at FROM oort.password_reset_tokens WHERE reset_token = ?`, token,
	).Scan(&email, &expiresAt)
	if err != nil {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
			"Service": "oort",
			"Step":    "invalid",
		})
		return
	}

	if time.Now().Unix() > expiresAt {
		scyllaSession.Query(`DELETE FROM oort.password_reset_tokens WHERE reset_token = ?`, token).Exec()
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
			"Service": "oort",
			"Step":    "expired",
		})
		return
	}

	if r.Method == "GET" || r.Method == "HEAD" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
			"Service": "oort",
			"Step":    "reset",
			"Token":   token,
			"Email":   email,
		})
		return
	}

	newPassword := r.FormValue("password")
	confirmPassword := r.FormValue("confirm_password")

	if len(newPassword) < 8 {
		renderError("Password must be at least 8 characters.")
		return
	}
	if newPassword != confirmPassword {
		renderError("Passwords do not match.")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		renderError("Internal error. Please try again.")
		return
	}

	// Invalidate all existing sessions upon password reset (forced re-login)
	if err := scyllaSession.Query(
		`UPDATE oort.users SET password_hash = ?, session_id = '', session_created_at = 0 WHERE email = ?`,
		string(hash), email,
	).Exec(); err != nil {
		log.Printf("[RESET] Password update failed for %s: %v", email, err)
		renderError("Failed to update password. Please try again.")
		return
	}

	scyllaSession.Query(`DELETE FROM oort.password_reset_tokens WHERE reset_token = ?`, token).Exec()
	log.Printf("[RESET] Password successfully reset for %s", email)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl.ExecuteTemplate(w, "forgot-password.html", map[string]any{
		"Service": "oort",
		"Step":    "done",
	})
}

func provisionMinIO(ak, sk, bucket string) {
	log.Printf("[MinIO] Provisioning %s", ak)
	exec.Command("mc", "alias", "set", "cosmos", "http://127.0.0.1:9010", "unityadmin", "UnityAdmin2026!").Run()
	exec.Command("mc", "admin", "user", "add", "cosmos", ak, sk).Run()
	exec.Command("mc", "mb", "--ignore-existing", "cosmos/"+bucket).Run()
	exec.Command("mc", "version", "enable", "cosmos/"+bucket).Run()

	policyStr := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:*"],"Resource":["arn:aws:s3:::%s","arn:aws:s3:::%s/*"]}]}`, bucket, bucket)
	policyFile := "/tmp/policy_" + bucket + ".json"
	os.WriteFile(policyFile, []byte(policyStr), 0644)
	exec.Command("mc", "admin", "policy", "create", "cosmos", "policy_"+bucket, policyFile).Run()
	exec.Command("mc", "admin", "policy", "attach", "cosmos", "policy_"+bucket, "--user", ak).Run()

	exec.Command("mc", "quota", "set", "cosmos/"+bucket, "--size", "10G").Run()
	log.Printf("[MinIO] Done: %s, bucket %s (10GB Quota)", ak, bucket)
}

func syncAllUsersToMinIO() {
	if scyllaSession == nil {
		return
	}
	exec.Command("mc", "alias", "set", "cosmos", "http://127.0.0.1:9010", "unityadmin", "UnityAdmin2026!").Run()
	iter := scyllaSession.Query(`SELECT access_key, secret_key, bucket FROM oort.users`).Iter()
	var ak, sk, bucket string
	count := 0
	for iter.Scan(&ak, &sk, &bucket) {
		if ak != "" && sk != "" {
			exec.Command("mc", "admin", "user", "add", "cosmos", ak, sk).Run()
			exec.Command("mc", "admin", "policy", "attach", "cosmos", "readwrite", "--user", ak).Run()
			if bucket != "" {
				exec.Command("mc", "mb", "--ignore-existing", "cosmos/"+bucket).Run()
			}
			count++
		}
	}
	iter.Close()
	log.Printf("[MinIO] Verified and synced %d user credentials to MinIO", count)
}

func main() {
	initDB()
	go syncAllUsersToMinIO()
	mux := http.NewServeMux()

	// Static assets
	mux.HandleFunc("/tailwind.css", func(w http.ResponseWriter, r *http.Request) {
		data, _ := templatesFS.ReadFile("templates/tailwind.css")
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
		w.Write(data)
	})
	mux.HandleFunc("/tailwind.js", func(w http.ResponseWriter, r *http.Request) {
		data, _ := templatesFS.ReadFile("templates/tailwind.js")
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		w.Write(data)
	})
	mux.HandleFunc("/three.min.js", func(w http.ResponseWriter, r *http.Request) {
		data, _ := templatesFS.ReadFile("templates/three.min.js")
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		w.Write(data)
	})

	// S3 Console & API routes (Registers both /api/* and /oort/api/*)
	RegisterS3ConsoleRoutes(mux)

	// Auth routes
	mux.HandleFunc("/signup", handleSignup)
	mux.HandleFunc("/login", handleLogin)
	mux.HandleFunc("/verify", handleVerify)
	mux.HandleFunc("/logout", handleLogout)
	mux.HandleFunc("/dashboard", handleDashboard)
	mux.HandleFunc("/forgot-password", handleForgotPassword)
	mux.HandleFunc("/reset-password", handleResetPassword)
	mux.HandleFunc("/api/poll", handlePoll)

	// Backwards compatibility routes (/oort/...)
	mux.HandleFunc("/oort", handleLanding)
	mux.HandleFunc("/oort/", func(w http.ResponseWriter, r *http.Request) {
		sub := strings.TrimPrefix(r.URL.Path, "/oort")
		switch {
		case sub == "" || sub == "/":
			handleLanding(w, r)
		case sub == "/signup":
			handleSignup(w, r)
		case sub == "/login":
			handleLogin(w, r)
		case sub == "/verify":
			handleVerify(w, r)
		case sub == "/logout":
			handleLogout(w, r)
		case sub == "/dashboard":
			handleDashboard(w, r)
		case sub == "/console":
			handleS3ConsolePage(w, r)
		case sub == "/forgot-password":
			handleForgotPassword(w, r)
		case sub == "/reset-password":
			handleResetPassword(w, r)
		case sub == "/api/poll":
			handlePoll(w, r)
		default:
			// Public proxy: /oort/{username}/{bucket}/{key}
			parts := strings.Split(strings.Trim(sub, "/"), "/")
			if len(parts) >= 2 {
				handleS3PublicProxy(w, r, parts[0], strings.Join(parts[1:], "/"))
				return
			}
			http.NotFound(w, r)
		}
	})

	// Root landing
	mux.HandleFunc("/", handleLanding)

	log.Println("[SERVER] Starting Oort S3 Storage Service on 127.0.0.1:8000")
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
