import React from 'react';
import { NasInfo, UserProfile } from '../types';
import { fmtBytes, renderFileIcon } from '../utils/format';

interface NasViewProps {
  currentBucket: string;
  nasInfo: NasInfo | null;
  profile: UserProfile | null;
  onUploadMedia: () => void;
  onEnableStreaming: () => void;
  onOpenPreview: (key: string) => void;
  onDownload: (key: string) => void;
  onCopy: (text: string) => void;
}

export const NasView: React.FC<NasViewProps> = ({
  currentBucket,
  nasInfo,
  profile,
  onUploadMedia,
  onEnableStreaming,
  onOpenPreview,
  onDownload,
  onCopy,
}) => {
  const username = profile?.username || 'username';
  const webdavUrl = `https://oort.linuxguy.space/${username}/${currentBucket}/`;
  const playlistUrl = `https://oort.linuxguy.space/${username}/${currentBucket}/playlist.m3u`;

  return (
    <div className="view-panel active" id="view-nas">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            <span>Network Attached Storage (NAS)</span>
            <span className="badge badge-success" id="nas-status-badge">WebDAV Active</span>
          </h1>
          <p>Mount S3 storage buckets as high-performance local network volumes and stream byte-range audio files.</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-secondary btn-sm" onClick={onUploadMedia}>
            Upload Media
          </button>
          <button className="btn btn-primary btn-sm" id="btn-nas-enable-streaming" onClick={onEnableStreaming}>
            Enable Streaming
          </button>
        </div>
      </div>

      {/* Connection Endpoints Grid */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Protocol Endpoints
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">WebDAV Network Drive URL</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" id="nas-input-webdav" className="form-input mono-cell" readOnly value={webdavUrl} />
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy(webdavUrl)}>
                Copy
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Compatible with Windows Map Network Drive, macOS Finder, and Linux davfs2.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Master M3U Streaming Playlist</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" id="nas-input-playlist" className="form-input mono-cell" readOnly value={playlistUrl} />
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy(playlistUrl)}>
                Copy
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Synchronized byte-range playlist for VLC, Audirvana, and native media players.
            </span>
          </div>
        </div>
      </div>

      {/* Mount Instructions Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">Windows Drive Mapping</div></div>
          <div className="card-body" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Open Command Prompt:
            <pre style={{ background: '#0a0e17', padding: '8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px', color: '#60a5fa', overflowX: 'auto' }}>
              net use Z: https://oort.linuxguy.space/{username}/{currentBucket} /user:{username} PASSWORD
            </pre>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">macOS Finder Mount</div></div>
          <div className="card-body" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            In Finder, press <kbd style={{ background: '#1e293b', padding: '2px 4px', borderRadius: '3px' }}>Cmd+K</kbd> and enter:
            <pre style={{ background: '#0a0e17', padding: '8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px', color: '#60a5fa', overflowX: 'auto' }}>
              https://oort.linuxguy.space/{username}/{currentBucket}/
            </pre>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">Linux davfs2 Mount</div></div>
          <div className="card-body" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Mount via davfs2 filesystem:
            <pre style={{ background: '#0a0e17', padding: '8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px', color: '#60a5fa', overflowX: 'auto' }}>
              mount -t davfs https://oort.linuxguy.space/{username}/{currentBucket}/ /mnt/oort
            </pre>
          </div>
        </div>
      </div>

      {/* Indexed Audio/Media Volume Inventory */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Indexed Volume Media ({nasInfo?.track_count || 0} files · {fmtBytes(nasInfo?.music_bytes || 0)})
          </div>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>File Path</th>
                <th>Format</th>
                <th>File Size</th>
                <th>Direct Stream URL</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="nas-tracks-tbody">
              {!nasInfo?.tracks || nasInfo.tracks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No indexed media files found in this bucket partition.
                  </td>
                </tr>
              ) : (
                nasInfo.tracks.map((t) => (
                  <tr key={t.key}>
                    <td>
                      <div className="table-file-cell" onClick={() => onOpenPreview(t.key)}>
                        <div className="file-icon-box">{renderFileIcon(t.key, false)}</div>
                        <span>{t.key}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {t.key.split('.').pop()}
                    </td>
                    <td className="mono-cell">{fmtBytes(t.size)}</td>
                    <td>
                      <input
                        type="text"
                        className="form-input mono-cell"
                        readOnly
                        style={{ fontSize: '11px', padding: '3px 6px' }}
                        value={`https://oort.linuxguy.space/${username}/${currentBucket}/${encodeURIComponent(t.key)}`}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onDownload(t.key)}>
                        Stream
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
