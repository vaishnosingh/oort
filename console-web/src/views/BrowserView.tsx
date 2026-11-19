import React, { useState, useEffect, useRef } from 'react';
import { S3Object, CategoryFilter } from '../types';
import { fmtBytes, formatDate, renderFileIcon, getFileCategory } from '../utils/format';

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
}

export const BrowserView: React.FC<BrowserViewProps> = ({
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

  const allSelected = filtered.length > 0 && filtered.every((o) => selectedKeys.has(o.key));

  return (
    <div className="view-panel active" id="view-browser">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            <span id="browser-current-bucket-title">{bucketDisplayName || 'Bucket Objects'}</span>
            <span className="badge badge-info" id="browser-objects-count-badge">
              {filtered.length} items
            </span>
          </h1>
          <p>Inspect, manage, and distribute objects within this S3 bucket partition.</p>
        </div>
        <div className="view-actions">
          {/* Bucket-level Actions Dropdown */}
          <div className="dropdown-wrap" style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
              className="btn btn-secondary btn-sm"
              id="bucket-actions-btn"
              onClick={() => setBucketDropdownOpen(!bucketDropdownOpen)}
              title="Bucket Settings & Actions"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Bucket
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
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  minWidth: '200px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 200,
                  overflow: 'hidden',
                  padding: '4px',
                }}
              >
                <div style={{ padding: '8px 12px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Bucket Operations
                </div>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onOpenRenameBucket();
                  }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename Bucket
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onSwitchView('settings');
                  }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                  Custom Domains
                </button>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                <div style={{ padding: '4px 12px 2px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-danger)', textTransform: 'uppercase', opacity: 0.8 }}>
                  Danger Zone
                </div>
                <button
                  className="dropdown-item dropdown-danger"
                  onClick={() => {
                    setBucketDropdownOpen(false);
                    onEmptyBucket();
                  }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  Delete Bucket
                </button>
              </div>
            )}
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setExplorerMode(explorerMode === 'table' ? 'grid' : 'table')}
            id="btn-toggle-view"
            title="Toggle Table/Grid View"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            View
          </button>
        </div>
      </div>

      {/* Filter Pills Bar */}
      <div className="table-container" style={{ borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="filter-pills-bar">
          <button className={`filter-pill ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
            All Objects
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
                <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="browser-objects-tbody">
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                    Loading cluster objects...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                      <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>This location is empty</div>
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>Upload files or create folders to get started.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const isChecked = selectedKeys.has(o.key);
                  const cleanName = o.is_dir
                    ? o.key.replace(currentPrefix, '').replace(/\/$/, '')
                    : o.key.split('/').pop() || o.key;

                  if (o.is_dir) {
                    return (
                      <tr key={o.key} className="obj-row" data-key={o.key} data-isdir="1">
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onToggleSelectKey(o.key, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="table-file-cell" onClick={() => onNavigatePrefix(o.key)}>
                            <div className="file-icon-box">{renderFileIcon(o.key, true)}</div>
                            <span style={{ fontWeight: 500 }}>{cleanName}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '9px' }}>
                              folder
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>PREFIX</td>
                        <td className="mono-cell" style={{ color: 'var(--text-muted)' }}>—</td>
                        <td style={{ color: 'var(--text-muted)' }}>—</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px' }}>
                            <button className="btn btn-ghost btn-sm" title="Open folder" onClick={() => onNavigatePrefix(o.key)}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                              Open
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Rename folder"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRenameFolder(o.key);
                              }}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Delete folder"
                              style={{ color: 'var(--accent-danger)' }}
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
                        <div className="table-file-cell" onClick={() => onOpenPreview(o.key)}>
                          <div className="file-icon-box">{renderFileIcon(o.key, false)}</div>
                          <span>{cleanName}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>STANDARD</td>
                      <td className="mono-cell">{fmtBytes(o.size)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(o.last_modified)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Preview"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPreview(o.key);
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Download"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(o.key);
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Move / Rename"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMove(o.key);
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Share Link"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenShare(o.key);
                            }}
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
                            title="Delete permanently"
                            style={{ color: 'var(--accent-danger)' }}
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View (Toggleable) */}
      {explorerMode === 'grid' && (
        <div
          id="explorer-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {filtered.map((o) => {
            const cleanName = o.is_dir
              ? o.key.replace(currentPrefix, '').replace(/\/$/, '')
              : o.key.split('/').pop() || o.key;

            return (
              <div
                key={o.key}
                className="card"
                style={{ padding: '14px', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
                onClick={() => (o.is_dir ? onNavigatePrefix(o.key) : onOpenPreview(o.key))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div className="file-icon-box">{renderFileIcon(o.key, o.is_dir)}</div>
                  <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cleanName}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {o.is_dir ? 'Folder' : fmtBytes(o.size)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
