import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onUpdateInfo: (name: string, username: string) => void;
  onUpdatePassword: (oldP: string, newP: string) => void;
  onUploadAvatar: (file: File) => void;
  onGoToAccountTab: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateInfo,
  onUpdatePassword,
  onUploadAvatar,
  onGoToAccountTab,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const displayName = profile?.name || profile?.username || 'User';
  const initial = (profile?.name || profile?.username || 'U').charAt(0).toUpperCase();

  const handleInfoSubmit = () => {
    onUpdateInfo(name, username);
  };

  const handlePasswordSubmit = () => {
    onUpdatePassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadAvatar(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="modal-backdrop show" id="modal-profile" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" fill="none" stroke="#38bdf8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>User Profile &amp; Security</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Header Card with Avatar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(226, 234, 242, 0.03)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div className="user-avatar-circle" id="profile-modal-avatar-preview" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="Avatar" />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload new avatar image"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--ac-gradient)',
                  border: '2px solid #020308',
                  color: '#020308',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }} id="profile-modal-display-name">
                {displayName}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ac-hex)' }} id="profile-modal-username-tag">
                @{profile?.username || 'username'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} id="profile-modal-email-tag">
                {profile?.email || profile?.access_key || 'email@domain.com'}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Personal Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  id="profile-modal-input-name"
                  className="form-input"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInfoSubmit();
                    }
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  id="profile-modal-input-username"
                  className="form-input mono-cell"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInfoSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleInfoSubmit}>
                Save Information
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Change Password (Hashed with bcrypt in DB)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  id="profile-modal-pwd-current"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password (min 8 chars)</label>
                <input
                  type="password"
                  id="profile-modal-pwd-new"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePasswordSubmit();
                    }
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handlePasswordSubmit}>
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <a href="/oort/logout" className="btn btn-danger btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </a>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onGoToAccountTab();
              }}
            >
              Full Account Tab
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
