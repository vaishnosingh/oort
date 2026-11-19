import React, { useState, useEffect, useRef } from 'react';
import { S3Object, CategoryFilter } from '../types';
import { fmtBytes, formatDate, renderFileIcon, getFileCategory, getFileExtension } from '../utils/format';

interface BrowserViewProps {
  currentBucket: string;
  bucketDisplayName: string;
  currentPrefix: string;
  objects: S3Object[];
  loading: boolean;
  searchQuery: string;
  selectedKeys: Set<string>;
  onToggleSelectKey: (key: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onNavigatePrefix: (prefix: string) => void;
  onOpenPreview: (key: string) => void;
  onDownload: (key: string) => void;
  onOpenMove: (key: string) => void;
  onOpenShare: (key: string) => void;
  onDeleteObject: (key: string) => void;
  onOpenRenameFolder: (key: string) => void;
  onDeleteFolder: (key: string) => void;
  onOpenRenameBucket: () => void;
  onSwitchView: (view: any) => void;
  onEmptyBucket: () => void;
  onDeleteBucket: () => void;
  onOpenMkdir?: () => void;
  onCopyText?: (text: string) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  currentBucket,
  bucketDisplayName,
  currentPrefix,
  objects,
  loading,
  searchQuery,
  selectedKeys,
  onToggleSelectKey,
  onToggleSelectAll,
  onNavigatePrefix,
  onOpenPreview,
  onDownload,
  onOpenMove,
  onOpenShare,
  onDeleteObject,
  onOpenRenameFolder,
  onDeleteFolder,
  onOpenRenameBucket,
  onSwitchView,
  onEmptyBucket,
  onDeleteBucket,
  onOpenMkdir,
  onCopyText,
}) => {
  const [explorerMode, setExplorerMode] = useState<'table' | 'grid'>('table');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [bucketDropdownOpen, setBucketDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBucketDropdownOpen(false);
      }
    };
    if (bucketDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [bucketDropdownOpen]);

  // Filtering
  let filtered = objects;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((o) => o.is_dir || getFileCategory(o.key) === categoryFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((o) => o.key.toLowerCase().includes(q));
  }

  // Sort folders first, then alphabetically by name
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_dir && !b.is_dir) return -1;
    if (!a.is_dir && b.is_dir) return 1;
    return a.key.localeCompare(b.key);
  });

  const allSelected = sorted.length > 0 && sorted.every((o) => selectedKeys.has(o.key));

  // Compute parent prefix for "Up one level" navigation
  const prefixParts = currentPrefix.split('/').filter(Boolean);
  const parentPrefix = prefixParts.length > 1
    ? prefixParts.slice(0, -1).join('/') + '/'
    : '';

  const s3Uri = `s3://${currentBucket}/${currentPrefix}`;

  const handleCopyUri = () => {
    if (onCopyText) {
      onCopyText(`s3://${currentBucket}`);
    } else {
      navigator.clipboard.writeText(`s3://${currentBucket}`);
    }
  };

  const handleCopyCurrentPath = () => {
    if (onCopyText) {
      onCopyText(s3Uri);
    } else {
      navigator.clipboard.writeText(s3Uri);
    }
  };

  const dirCount = sorted.filter((o) => o.is_dir).length;
  const fileCount = sorted.filter((o) => !o.is_dir).length;
  const totalBytes = sorted.filter((o) => !o.is_dir).reduce((acc, o) => acc + (o.size || 0), 0);

  return (
    <div className="view-panel active" id="view-browser">
      {/* Enterprise Sovereign Bucket Hero Banner */}
      <div className="bucket-hero-banner">
        <div className="bucket-hero-main">
          <div className="bucket-hero-icon" title="Sovereign S3 Bucket Partition">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div className="bucket-hero-content">
            <div className="bucket-hero-title-row">
              <h1 className="bucket-hero-name" id="browser-current-bucket-title">
                {bucketDisplayName || currentBucket || 'Bucket Objects'}
              </h1>
              <button
                className="bucket-uri-pill"
                onClick={handleCopyUri}
                title="Click to copy S3 URI"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>s3://{currentBucket}</span>
              </button>
            </div>
            <div className="bucket-badges-row">
              <span className="bucket-meta-pill highlight">
                <span className="user-status-dot" style={{ width: '5px', height: '5px' }}></span>
                NVMe Sovereign Cluster
              </span>
              <span className="bucket-meta-pill secure">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                AES-256 Encrypted
              </span>
              <span className="bucket-meta-pill">
                {dirCount} {dirCount === 1 ? 'folder' : 'folders'} • {fileCount} {fileCount === 1 ? 'file' : 'files'}
                {fileCount > 0 ? ` (${fmtBytes(totalBytes)})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Bucket-level Actions Dropdown */}
          <div className="dropdown-wrap" style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
              className="btn btn-secondary btn-sm"
              id="bucket-actions-btn"
              onClick={() => setBucketDropdownOpen(!bucketDropdownOpen)}
              title="Bucket Settings & Configuration"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Bucket Options
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {bucketDropdownOpen && (
              <div
                className="bucket-dropdown-menu"
                id="bucket-dropdown-menu"
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#090e1a',
                  border: '1px solid var(--line-bright)',
                  borderRadius: '12px',
                  minWidth: '220px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  zIndex: 200,
                  overflow: 'hidden',
                  padding: '6px',
                }}
              >
                <div style={{ padding: '8px 12px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--faint)', textTransform: 'uppercase' }}>
                  Bucket Operations
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onOpenRenameBucket();
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename Bucket Partition
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onSwitchView('settings');
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Bucket Settings &amp; Policies
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onSwitchView('domains');
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                  Custom Domains &amp; CDN
                </button>
                <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />
                <div style={{ padding: '4px 12px 2px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--danger)', textTransform: 'uppercase', opacity: 0.85 }}>
                  Danger Zone
                </div>
                <button
                  className="dropdown-item dropdown-danger"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onEmptyBucket();
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Empty Bucket
                </button>
                <button
                  className="dropdown-item dropdown-danger"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onDeleteBucket();
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  Delete Bucket
                </button>
              </div>
            )}
          </div>

          {/* Toggle Table / Grid Mode */}
          <div style={{ display: 'inline-flex', background: 'rgba(226, 234, 242, 0.04)', border: '1px solid var(--line)', borderRadius: '9px', padding: '2px' }}>
            <button
              className={`btn btn-sm ${explorerMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 9px', height: 'auto', borderRadius: '7px' }}
              onClick={() => setExplorerMode('table')}
              title="Table View"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              className={`btn btn-sm ${explorerMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 9px', height: 'auto', borderRadius: '7px' }}
              onClick={() => setExplorerMode('grid')}
              title="Grid View"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills Bar */}
      <div className="table-container" style={{ borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="filter-pills-bar">
          <button className={`filter-pill ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
            All Objects ({objects.length})
          </button>
          <button className={`filter-pill ${categoryFilter === 'documents' ? 'active' : ''}`} onClick={() => setCategoryFilter('documents')}>
            Documents
          </button>
          <button className={`filter-pill ${categoryFilter === 'image' ? 'active' : ''}`} onClick={() => setCategoryFilter('image')}>
            Images
          </button>
          <button className={`filter-pill ${categoryFilter === 'audio' ? 'active' : ''}`} onClick={() => setCategoryFilter('audio')}>
            Media &amp; Audio
          </button>
          <button className={`filter-pill ${categoryFilter === 'archives' ? 'active' : ''}`} onClick={() => setCategoryFilter('archives')}>
            Archives
          </button>
          <button className={`filter-pill ${categoryFilter === 'code' ? 'active' : ''}`} onClick={() => setCategoryFilter('code')}>
            Source Code
          </button>
        </div>
      </div>

      {/* Parent Folder Bar (When deep inside folders) */}
      {currentPrefix !== '' && (
        <div className="parent-folder-bar" onClick={() => onNavigatePrefix(parentPrefix)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" fill="none" stroke="var(--ac-hex)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>.. Back to parent folder</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--faint)' }}>
              ({parentPrefix || 'root'})
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', color: 'var(--dim)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCurrentPath();
            }}
            title="Copy path"
          >
            Copy S3 Path
          </button>
        </div>
      )}

      {/* Main Objects Data Table */}
      {explorerMode === 'table' && (
        <div className="table-container" id="explorer-table-container" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    id="master-select-checkbox"
                    checked={allSelected}
                    onChange={(e) => onToggleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Name</th>
                <th>Storage Class</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="browser-objects-tbody">
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--faint)', padding: '48px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div className="user-status-dot" style={{ width: '10px', height: '10px' }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>Syncing cluster storage state...</span>
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px' }}>
                    <div className="empty-dropzone">
                      <div className="empty-dropzone-icon">
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                          This directory is empty
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--faint)', maxWidth: '360px', margin: '0 auto' }}>
                          Drag and drop files here, or use the actions to create folders and upload assets.
                        </div>
                      </div>
                      {onOpenMkdir && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={onOpenMkdir}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                              <line x1="12" y1="11" x2="12" y2="17" />
                              <line x1="9" y1="14" x2="15" y2="14" />
                            </svg>
                            Create Folder
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((o) => {
                  const isChecked = selectedKeys.has(o.key);
                  const cleanName = o.is_dir
                    ? o.key.replace(currentPrefix, '').replace(/\/$/, '')
                    : o.key.split('/').pop() || o.key;

                  if (o.is_dir) {
                    return (
                      <tr key={o.key} className="obj-row folder-row" data-key={o.key} data-isdir="1">
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onToggleSelectKey(o.key, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div
                            className="table-file-cell"
                            onClick={() => onNavigatePrefix(o.key)}
                            style={{ cursor: 'pointer' }}
                            title={`Open folder ${cleanName}`}
                          >
                            <div className="folder-icon-box">{renderFileIcon(o.key, true, 20)}</div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span className="folder-title-text">{cleanName}</span>
                              <span className="folder-badge">DIRECTORY</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#fbbf24', opacity: 0.9 }}>
                            S3_PREFIX
                          </span>
                        </td>
                        <td className="mono-cell" style={{ color: 'var(--faint)' }}>—</td>
                        <td style={{ color: 'var(--faint)', fontSize: '12px' }}>—</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              className="btn btn-sm btn-open-folder"
                              title="Open folder"
                              onClick={() => onNavigatePrefix(o.key)}
                              style={{ padding: '3px 8px', fontSize: '11.5px', height: 'auto' }}
                            >
                              Open
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Rename folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRenameFolder(o.key);
                              }}
                              style={{ padding: '4px', height: 'auto' }}
                            >
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Delete folder and contents"
                              style={{ color: 'var(--danger)', padding: '4px', height: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFolder(o.key);
                              }}
                            >
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={o.key} className="obj-row" data-key={o.key}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => onToggleSelectKey(o.key, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <div
                          className="table-file-cell"
                          onClick={() => onOpenPreview(o.key)}
                          style={{ cursor: 'pointer' }}
                          title={`Preview ${cleanName}`}
                        >
                          <div className="file-icon-box">{renderFileIcon(o.key, false, 18)}</div>
                          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{cleanName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                          STANDARD
                        </span>
                      </td>
                      <td className="mono-cell">{fmtBytes(o.size)}</td>
                      <td style={{ color: 'var(--faint)', fontSize: '12.5px' }}>{formatDate(o.last_modified)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Preview file"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPreview(o.key);
                            }}
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Download object"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(o.key);
                            }}
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Move or Rename"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMove(o.key);
                            }}
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Share Presigned URL"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenShare(o.key);
                            }}
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Delete permanently"
                            style={{ color: 'var(--danger)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteObject(o.key);
                            }}
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View (Modern Cards) */}
      {explorerMode === 'grid' && (
        <div className="grid-container-modern" id="explorer-grid-container">
          {sorted.map((o) => {
            const cleanName = o.is_dir
              ? o.key.replace(currentPrefix, '').replace(/\/$/, '')
              : o.key.split('/').pop() || o.key;

            if (o.is_dir) {
              return (
                <div
                  key={o.key}
                  className="grid-card-folder"
                  onClick={() => onNavigatePrefix(o.key)}
                  title={`Open folder ${cleanName}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="folder-icon-box">{renderFileIcon(o.key, true, 22)}</div>
                    <span className="folder-badge">DIR</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cleanName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>
                      Folder prefix
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '8px', marginTop: 'auto' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRenameFolder(o.key);
                      }}
                      style={{ padding: '3px 6px', height: 'auto' }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Delete"
                      style={{ color: 'var(--danger)', padding: '3px 6px', height: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(o.key);
                      }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            }

            const ext = getFileExtension(cleanName);

            return (
              <div
                key={o.key}
                className="grid-card-file"
                onClick={() => onOpenPreview(o.key)}
                title={`Preview ${cleanName}`}
              >
                <div className="grid-card-file-preview">
                  {renderFileIcon(o.key, false, 32)}
                  <span className="grid-card-ext-badge">{ext}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cleanName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--faint)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
                    <span>{fmtBytes(o.size)}</span>
                    <span>{formatDate(o.last_modified).split(',')[0]}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px', borderTop: '1px solid var(--line)', paddingTop: '6px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(o.key);
                    }}
                    style={{ padding: '3px 5px', height: 'auto' }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Share"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShare(o.key);
                    }}
                    style={{ padding: '3px 5px', height: 'auto' }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Delete"
                    style={{ color: 'var(--danger)', padding: '3px 5px', height: 'auto' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteObject(o.key);
                    }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
