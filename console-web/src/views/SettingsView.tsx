import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
  currentBucket: string;
  bucketDisplayName: string;
  onRenameBucket: (newName: string) => void;
  onBrowseBucket: () => void;
  onEmptyBucket: () => void;
  onDeleteBucket: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  bucketDisplayName,
  onRenameBucket,
  onBrowseBucket,
  onEmptyBucket,
  onDeleteBucket,
  onToast,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [indexDoc, setIndexDoc] = useState('index.html');
  const [versioning, setVersioning] = useState(false);
  const [corsOrigins, setCorsOrigins] = useState('*');

  useEffect(() => {
    setNameInput(bucketDisplayName);
  }, [bucketDisplayName]);

  const handleRenameSubmit = () => {
    if (!nameInput.trim()) {
      onToast('Bucket name cannot be empty', 'error');
      return;
    }
    onRenameBucket(nameInput.trim());
  };

  return (
    <div className="view-panel active" id="view-settings">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            Bucket Settings
            <span className="badge badge-info" id="settings-bucket-name-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {bucketDisplayName || '—'}
            </span>
          </h1>
          <p>Partition identity, versioning, static hosting configuration, and administrative bucket operations.</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-secondary btn-sm" onClick={onBrowseBucket}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Browse Bucket
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Partition Identity</div></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Bucket Display Name</label>
              <input
                type="text"
                id="settings-bucket-name-input"
                className="form-input"
                style={{ marginBottom: '8px' }}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRenameSubmit();
                  }
                }}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleRenameSubmit}>
                Save Rename
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Static Website Hosting</div></div>
          <div className="card-body">
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Serve static HTML, CSS, and JS assets directly from this bucket root.
            </p>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">Index Document</label>
              <input
                type="text"
                id="settings-website-index-input"
                className="form-input"
                value={indexDoc}
                onChange={(e) => setIndexDoc(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onToast('Static website hosting configuration saved.')}>
              Save Hosting Config
            </button>
          </div>
        </div>

        {/* Versioning Card */}
        <div className="card">
          <div className="card-header"><div className="card-title">Object Versioning</div></div>
          <div className="card-body">
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Enable versioning to preserve, retrieve, and restore every version of every object in this bucket.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--dim)' }}>
                <input
                  type="checkbox"
                  id="settings-versioning-toggle"
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  checked={versioning}
                  onChange={(e) => {
                    setVersioning(e.target.checked);
                    onToast(e.target.checked ? 'Versioning enabled for bucket.' : 'Versioning disabled.');
                  }}
                />
                Enable Versioning
              </label>
            </div>
          </div>
        </div>

        {/* CORS Card */}
        <div className="card">
          <div className="card-header"><div className="card-title">CORS Configuration</div></div>
          <div className="card-body">
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Configure allowed origins for cross-origin requests (CDN, web apps, APIs).
            </p>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">Allowed Origins</label>
              <input
                type="text"
                id="settings-cors-origins"
                className="form-input mono-cell"
                placeholder="* or https://yourdomain.com"
                value={corsOrigins}
                onChange={(e) => setCorsOrigins(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onToast('CORS configuration saved.', 'info')}>
              Save CORS
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: '16px' }}>
        <div className="card-header" style={{ background: 'rgba(239,68,68,0.06)' }}>
          <div className="card-title" style={{ color: 'var(--accent-danger)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Danger Zone
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Empty Bucket Contents</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Permanently delete all objects and prefixes while keeping the bucket partition intact.
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onEmptyBucket}>
            Empty Bucket
          </button>
        </div>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-danger)' }}>Delete Bucket Permanently</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Delete this bucket, its configuration, and all stored metadata. Bucket must be empty first.
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onDeleteBucket}>
            Delete Bucket
          </button>
        </div>
      </div>
    </div>
  );
};
