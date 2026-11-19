import React, { useState, useRef, useEffect } from 'react';
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
  const [bucketMenuOpen, setBucketMenuOpen] = useState(false);
  const [bucketSearch, setBucketSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.name || profile?.username || 'User';
  const initial = (profile?.name || profile?.username || 'U').charAt(0).toUpperCase();

  const currentBucketObj = buckets.find((b) => b.Name === currentBucket);
  const currentBucketLabel = currentBucketObj?.DisplayName || currentBucketObj?.Name || currentBucket || 'No Bucket';

  // Close bucket popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setBucketMenuOpen(false);
      }
    };
    if (bucketMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [bucketMenuOpen]);

  const filteredBuckets = buckets.filter((b) =>
    (b.DisplayName || b.Name).toLowerCase().includes(bucketSearch.toLowerCase())
  );

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

        {/* Custom Interactive Bucket Selector */}
        <div className="custom-bucket-wrap" ref={menuRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--faint)', textTransform: 'uppercase' }}>
              Active Partition
            </span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '0 4px', fontSize: '11px', color: 'var(--ac-hex)', height: 'auto' }}
              onClick={onOpenCreateBucket}
              title="Create new S3 bucket partition"
            >
              + New
            </button>
          </div>

          <div
            className="custom-bucket-card"
            onClick={() => setBucketMenuOpen(!bucketMenuOpen)}
            role="button"
            tabIndex={0}
            title="Click to switch bucket partition"
          >
            <div className="custom-bucket-card-info">
              <div className="custom-bucket-card-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div className="custom-bucket-card-text">
                <span className="custom-bucket-card-name">{currentBucketLabel}</span>
                <span className="custom-bucket-card-sub">
                  <span className="user-status-dot" style={{ width: '5px', height: '5px' }}></span>
                  NVMe Ready
                </span>
              </div>
            </div>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ color: 'var(--faint)', transition: 'transform 0.2s', transform: bucketMenuOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {bucketMenuOpen && (
            <div className="custom-bucket-popover" id="bucket-selector-popover">
              <input
                type="text"
                className="custom-bucket-search"
                placeholder="Search buckets..."
                value={bucketSearch}
                onChange={(e) => setBucketSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filteredBuckets.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No matching buckets
                  </div>
                ) : (
                  filteredBuckets.map((b) => {
                    const isSelected = b.Name === currentBucket;
                    return (
                      <button
                        key={b.Name}
                        className={`custom-bucket-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          onSelectBucket(b.Name);
                          setBucketMenuOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <svg width="13" height="13" fill="none" stroke={isSelected ? 'var(--ac-hex)' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                          </svg>
                          <span style={{ fontSize: '12.5px', color: isSelected ? 'var(--ink)' : 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.DisplayName || b.Name}
                          </span>
                        </div>
                        {isSelected && (
                          <svg width="14" height="14" fill="none" stroke="var(--ac-hex)" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  className="dropdown-item"
                  style={{ color: 'var(--ac-hex)', fontSize: '12px', justifyContent: 'center' }}
                  onClick={() => {
                    setBucketMenuOpen(false);
                    onOpenCreateBucket();
                  }}
                >
                  + Create New Bucket
                </button>
              </div>
            </div>
          )}
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

        {/* Visual Quick Bucket Switcher under Core Storage */}
        {buckets.length > 1 && (
          <div style={{ margin: '6px 0 10px', padding: '0 8px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px' }}>
              Partitions ({buckets.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {buckets.slice(0, 5).map((b) => {
                const isActive = b.Name === currentBucket;
                return (
                  <div
                    key={b.Name}
                    className={`sidebar-bucket-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectBucket(b.Name);
                      onSelectView('browser');
                    }}
                    title={`Switch to bucket ${b.DisplayName || b.Name}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <svg width="12" height="12" fill="none" stroke={isActive ? 'var(--ac-hex)' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.DisplayName || b.Name}
                      </span>
                    </div>
                    {isActive && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--ac-hex)', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
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

        <div className="nav-section-title">Configuration</div>
        <a
          href="#settings"
          className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('settings');
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span>Bucket Settings</span>
        </a>
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
          <span>Account &amp; Security</span>
        </a>
      </nav>

      {/* Sidebar Footer User Card */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card" onClick={onOpenProfile} role="button" tabIndex={0} title="Manage profile">
          <div className="sidebar-user-avatar" id="sidebar-user-avatar">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt="Avatar" />
            ) : (
              initial
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" id="sidebar-user-name">{displayName}</div>
            <div className="user-status-text">
              <span className="user-status-dot"></span>
              <span>Online • NVMe</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
