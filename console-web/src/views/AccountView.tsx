import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface AccountViewProps {
  profile: UserProfile | null;
  onUpdateProfile: (name: string, username: string) => void;
  onUpdatePassword: (oldP: string, newP: string) => void;
  onUploadAvatar: (file: File) => void;
  onOpenProfileModal: () => void;
  onOpenQuotaModal: () => void;
  sessionId: string;
}

export const AccountView: React.FC<AccountViewProps> = ({
  profile,
  onUpdateProfile,
  onUpdatePassword,
  onUploadAvatar,
  onOpenProfileModal,
  onOpenQuotaModal,
  sessionId,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  const initial = (profile?.name || profile?.username || 'U').charAt(0).toUpperCase();

  const handleProfileSubmit = () => {
    onUpdateProfile(name, username);
  };

  const handlePasswordSubmit = () => {
    onUpdatePassword(oldPassword, newPassword);
    setOldPassword('');
    setNewPassword('');
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadAvatar(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="view-panel active" id="view-account">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>Account &amp; Security Settings</h1>
          <p>Cryptographic identity, secure profile credentials, hashed passwords, and NVMe cluster quota.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* User Profile Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">User Profile &amp; Identity</div>
              <div className="card-subtitle">Saved securely in ScyllaDB cluster</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onOpenProfileModal}>
              Open Modal
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="user-avatar-circle" id="acc-avatar-preview" style={{ width: '52px', height: '52px', fontSize: '20px' }}>
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="Avatar" />
                ) : (
                  initial
                )}
              </div>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  Change Avatar
                </button>
                <div style={{ fontSize: '11.5px', color: 'var(--faint)', marginTop: '4px' }}>
                  Supports PNG, JPG or WebP (max 10MB)
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFile}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                id="acc-name-input"
                className="form-input"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                id="acc-username-input"
                className="form-input mono-cell"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Registered Email</label>
              <input
                type="text"
                id="acc-email-input"
                className="form-input"
                readOnly
                value={profile?.email || profile?.access_key || 'user@oort.space'}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={handleProfileSubmit}>
                Save Profile Details
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Password &amp; Encryption</div>
              <div className="card-subtitle">Hashed with bcrypt (cost 10) before saving to DB</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                id="acc-pwd-old"
                className="form-input"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password (minimum 8 characters)</label>
              <input
                type="password"
                id="acc-pwd-new"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Active Cryptographic Session Token</label>
              <input
                type="text"
                id="acc-session-input"
                className="form-input mono-cell"
                readOnly
                value={sessionId}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={handlePasswordSubmit}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Quota Allocation Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Storage Quota Allocation</div>
            <div className="card-subtitle">Zero-tax bare-metal NVMe persistent block volume</div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>
              Allocated Capacity: <span id="acc-quota-display" style={{ color: 'var(--ac-hex)' }}>10.0 GB</span>
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--dim)', marginTop: '4px' }}>
              Request additional NVMe capacity expansion directly from the cluster administrator.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onOpenQuotaModal}>
            Request Expansion
          </button>
        </div>
      </div>
    </div>
  );
};
