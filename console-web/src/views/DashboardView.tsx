import React from 'react';
import { S3Object, BucketInfo } from '../types';
import { fmtBytes, formatDate, renderFileIcon } from '../utils/format';

interface DashboardViewProps {
  objects: S3Object[];
  buckets: BucketInfo[];
  currentBucket: string;
  bucketDisplayName: string;
  onOpenCreateBucket: () => void;
  onBrowseObjects: () => void;
  onOpenPreview: (key: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  objects,
  buckets,
  bucketDisplayName,
  onOpenCreateBucket,
  onBrowseObjects,
  onOpenPreview,
}) => {
  const fileObjects = objects.filter((o) => !o.is_dir);
  const totalBytes = fileObjects.reduce((acc, o) => acc + (o.size || 0), 0);
  const quotaBytes = 10 * 1024 * 1024 * 1024; // 10 GB
  const quotaPercent = Math.min(100, Math.round((totalBytes / quotaBytes) * 100));

  const recentObjects = [...fileObjects].slice(0, 5);

  return (
    <div className="view-panel active" id="view-dashboard">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            <span>Infrastructure Overview</span>
            <span className="badge badge-success">Nominal</span>
          </h1>
          <p>Real-time cluster capacity telemetry, partition metrics, and cluster node inventory.</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-secondary btn-sm" onClick={onOpenCreateBucket}>
            New Bucket
          </button>
          <button className="btn btn-primary btn-sm" onClick={onBrowseObjects}>
            Browse Objects
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Storage Consumed</span>
            <div className="kpi-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
          </div>
          <div className="kpi-val" id="metric-storage-used">
            {fmtBytes(totalBytes)}
          </div>
          <div className="kpi-sub" id="metric-storage-sub">
            Allocated Quota: 10.0 GB
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" id="metric-storage-progress" style={{ width: `${quotaPercent}%` }} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Objects</span>
            <div className="kpi-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
          <div className="kpi-val" id="metric-objects-count">
            {objects.length}
          </div>
          <div className="kpi-sub">Across active partitions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Partitions</span>
            <div className="kpi-icon">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </div>
          </div>
          <div className="kpi-val" id="metric-buckets-count">
            {buckets.length}
          </div>
          <div className="kpi-sub" id="metric-default-bucket-name">
            Active: {bucketDisplayName || 'mybucket'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Cluster Status</span>
            <div className="kpi-icon" style={{ color: 'var(--accent-success)' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
          </div>
          <div className="kpi-val" style={{ fontSize: '16px', color: 'var(--accent-success)' }}>
            Operational
          </div>
          <div className="kpi-sub">MinIO Engine &amp; ScyllaDB Online</div>
        </div>
      </div>

      {/* Capacity Breakdown & Cluster Topology */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0110 10H12V2z" />
              </svg>
              Storage Categorization
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }} id="breakdown-total-size">
              {fmtBytes(totalBytes)} total
            </span>
          </div>
          <div className="card-body">
            <div id="storage-breakdown-bars" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Raw Cluster Volume</span>
                  <span className="mono-cell">{fmtBytes(totalBytes)}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-card-hover)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(4, quotaPercent)}%`, background: 'var(--accent-primary)', borderRadius: '99px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              Cluster Specs
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>S3 Ingress</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>127.0.0.1:9010</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Default Region</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>us-east-1</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Protocol</span>
              <span style={{ color: 'var(--accent-info)' }}>AWS S3 SigV4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Persistence</span>
              <span style={{ color: 'var(--accent-success)' }}>Airgapped NVMe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Objects Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Recent Cluster Objects
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onBrowseObjects}>
            View All Objects &rarr;
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Object Key</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="dashboard-recent-objects-body">
              {recentObjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
                    No recent objects recorded in this partition.
                  </td>
                </tr>
              ) : (
                recentObjects.map((o) => (
                  <tr key={o.key}>
                    <td>
                      <div className="table-file-cell" onClick={() => onOpenPreview(o.key)}>
                        <div className="file-icon-box">{renderFileIcon(o.key, false)}</div>
                        <span>{o.key}</span>
                      </div>
                    </td>
                    <td className="mono-cell">{fmtBytes(o.size)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(o.last_modified)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onOpenPreview(o.key)}>
                        Inspect
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
