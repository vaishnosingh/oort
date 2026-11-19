import React from 'react';
import { ActiveView, BucketInfo, UserProfile } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  buckets: BucketInfo[];
  currentBucket: string;
  onSelectBucket: (name: string) => void;
  onOpenCreateBucket: () => void;
  profile: UserProfile | null;
  onOpenProfile: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  buckets,
  currentBucket,
  onSelectBucket,
  onOpenCreateBucket,
  profile,
  onOpenProfile,
  mobileOpen,
}) => {
  const displayName = profile?.name || profile?.username || 'User';
  const initial = (profile?.name || profile?.username || 'U').charAt(0).toUpperCase();

  const getBucketLabel = (b: BucketInfo) => b.DisplayName || b.Name;

  return (
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`} id="app-sidebar">
      <div className="sidebar-header">
        <a href="/oort" className="brand-link" title="OORT Sovereign S3 Storage">
          <svg className="brand-logo-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="6" fill="#eef3f8" />
            <ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="#38bdf8" strokeWidth="1.8" transform="rotate(-24 16 16)" />
          </svg>
          <div className="brand-text-group">
            <span className="brand-title">OORT</span>
            <span className="brand-badge">SOVEREIGN S3</span>
          </div>
        </a>
        <div className="bucket-card">
          <div className="bucket-card-label">
            <span>Active Bucket</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '0 4px', fontSize: '11px', color: 'var(--ac-hex)' }}
              onClick={onOpenCreateBucket}
            >
              + New
            </button>
          </div>
          <select
            id="sidebar-bucket-select"
            className="bucket-select-custom"
            value={currentBucket}
            onChange={(e) => onSelectBucket(e.target.value)}
          >
            {buckets.map((b) => (
              <option key={b.Name} value={b.Name}>
                {getBucketLabel(b)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Storage</div>
        <a
          href="#browser"
          className={`nav-link ${activeView === 'browser' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('browser');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span>Buckets &amp; Objects</span>
        </a>
        <a
          href="#dashboard"
          className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('dashboard');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Storage Overview</span>
        </a>

        <div className="nav-section-title">Access &amp; Protocols</div>
        <a
          href="#api"
          className={`nav-link ${activeView === 'api' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('api');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 2l-2 2m-1-1l-3 3m5 0l-3-3m-6 8a5 5 0 11-7-7 5 5 0 017 7zm0 0l7 7" />
          </svg>
          <span>S3 API &amp; Credentials</span>
        </a>
        <a
          href="#domains"
          className={`nav-link ${activeView === 'domains' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('domains');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span>Custom Domains &amp; CDN</span>
        </a>

        <div className="nav-section-title">Services</div>
        <a
          href="#nas"
          className={`nav-link ${activeView === 'nas' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('nas');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <span>Network Storage (NAS)</span>
        </a>
        <a
          href="#settings"
          className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('settings');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>Bucket Configuration</span>
        </a>

        <div className="nav-section-title">Administration</div>
        <a
          href="#account"
          className={`nav-link ${activeView === 'account' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('account');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Access &amp; Security</span>
        </a>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div className="user-profile-badge" onClick={onOpenProfile} role="button" tabIndex={0} title="Click to open your Profile">
          <div className="user-avatar-circle" id="sidebar-user-avatar">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt="Avatar" />
            ) : (
              initial
            )}
          </div>
          <div className="user-details">
            <div className="user-name-text" id="sidebar-user-name">{displayName}</div>
            <div className="user-status-text">
              <span className="user-status-dot"></span> Cluster Online
            </div>
          </div>
        </div>
        <a href="/oort/logout" className="btn btn-ghost btn-sm" style={{ padding: '8px', borderRadius: '8px' }} title="Sign Out">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </a>
      </div>
    </aside>
  );
};
