import React from 'react';
import { UploadItem } from '../types';

interface UploadDrawerProps {
  uploadQueue: UploadItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const UploadDrawer: React.FC<UploadDrawerProps> = ({
  uploadQueue,
  isOpen,
  onClose,
}) => {
  if (!isOpen || uploadQueue.length === 0) return null;

  return (
    <div className="upload-drawer show" id="upload-drawer">
      <div className="upload-drawer-header">
        <span>Upload Activity</span>
        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="upload-list-body" id="upload-items-container">
        {uploadQueue.map((item) => (
          <div key={item.id} className="upload-item-row">
            <div className="upload-item-info">
              <span className="upload-item-name">{item.file.name}</span>
              <span className="mono-cell" style={{ color: 'var(--text-muted)' }}>
                {item.status === 'uploading' ? `${item.progress}%` : item.status}
              </span>
            </div>
            <div style={{ height: '3px', background: 'var(--bg-card-hover)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${item.progress}%`,
                  background: item.status === 'error' ? 'var(--accent-danger)' : 'var(--accent-primary)',
                  borderRadius: '99px',
                  transition: 'width 0.15s',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
