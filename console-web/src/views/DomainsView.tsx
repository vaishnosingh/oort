import React from 'react';
import { CustomDomain } from '../types';

interface DomainsViewProps {
  currentBucket: string;
  domains: CustomDomain[];
  onOpenAddDomain: () => void;
  onRemoveDomain: (domain: string) => void;
}

export const DomainsView: React.FC<DomainsViewProps> = ({
  currentBucket,
  domains,
  onOpenAddDomain,
  onRemoveDomain,
}) => {
  return (
    <div className="view-panel active" id="view-domains">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            <span>Custom Domains &amp; Public CDN</span>
            <span className="badge badge-info">Edge Proxy</span>
          </h1>
          <p>Map fully qualified domain names directly to this S3 bucket partition.</p>
        </div>
        <div className="view-actions">
          <button className="btn btn-primary btn-sm" onClick={onOpenAddDomain}>
            Add Domain
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Custom Domain Name</th>
                <th>Target Bucket</th>
                <th>SSL Status</th>
                <th>Verification Record</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="domains-tbody">
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No custom domains mapped yet.
                  </td>
                </tr>
              ) : (
                domains.map((d) => (
                  <tr key={d.domain}>
                    <td className="mono-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.domain}
                    </td>
                    <td className="mono-cell" style={{ color: 'var(--text-muted)' }}>
                      {currentBucket}
                    </td>
                    <td>
                      <span className="badge badge-success">SSL Active</span>
                    </td>
                    <td className="mono-cell" style={{ fontSize: '11px' }}>
                      CNAME &rarr; oort.linuxguy.space
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent-danger)' }}
                        onClick={() => onRemoveDomain(d.domain)}
                      >
                        Remove
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
