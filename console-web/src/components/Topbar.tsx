import React, { useRef } from 'react';
import { UserProfile } from '../types';

interface TopbarProps {
  currentBucket: string;
  bucketDisplayName: string;
  currentPrefix: string;
  onNavigatePrefix: (prefix: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMkdir: () => void;
  onFilesSelected: (files: FileList) => void;
  onRefresh: () => void;
  profile: UserProfile | null;
  onOpenProfile: () => void;
  onToggleMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  bucketDisplayName,
  currentPrefix,
  onNavigatePrefix,
  searchQuery,
  onSearchChange,
  onOpenMkdir,
  onFilesSelected,
  onRefresh,
  profile,
  onOpenProfile,
  onToggleMobileSidebar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prefixParts = currentPrefix.split('/').filter(Boolean);
  const displayName = profile?.username || profile?.name || 'User';
  const initial = (profile?.name || profile?.username || 'U').charAt(0).toUpperCase();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="btn btn-secondary btn-icon btn-sm mobile-menu-btn"
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          title="Toggle Navigation Menu"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="topbar-breadcrumbs" id="topbar-breadcrumbs">
          <span className="crumb-link" onClick={() => onNavigatePrefix('')}>
            {bucketDisplayName || 'root'}
          </span>
          {prefixParts.map((part, idx) => {
            const subPrefix = prefixParts.slice(0, idx + 1).join('/') + '/';
            return (
              <React.Fragment key={subPrefix}>
                <span className="crumb-sep">/</span>
                <span className="crumb-link" onClick={() => onNavigatePrefix(subPrefix)}>
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-box-wrap">
          <svg className="search-box-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            id="global-search-input"
            placeholder="Search objects in bucket..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onOpenMkdir} title="Create Folder">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          New Folder
        </button>

        <button className="btn btn-primary btn-sm" onClick={handleUploadClick} title="Upload Files">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        <button className="btn btn-secondary btn-icon btn-sm" onClick={onRefresh} title="Refresh Bucket">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>

        {/* Topbar Profile Pill */}
        <div className="topbar-user-pill" onClick={onOpenProfile} role="button" tabIndex={0} title="Click to view and manage your profile">
          <div className="topbar-user-avatar" id="topbar-user-avatar">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt="Avatar" />
            ) : (
              initial
            )}
          </div>
          <span className="topbar-user-name" id="topbar-user-name">{displayName}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
};
