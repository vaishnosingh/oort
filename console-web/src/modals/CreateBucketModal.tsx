import React, { useState, useEffect, useRef } from 'react';

interface CreateBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bucketName: string) => void;
}

export const CreateBucketModal: React.FC<CreateBucketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!clean) return;
    onSubmit(clean);
  };

  return (
    <div className="modal-backdrop show" id="modal-create-bucket" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Create S3 Bucket Partition</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Bucket Name</label>
            <input
              type="text"
              id="create-bucket-name-input"
              ref={inputRef}
              className="form-input"
              placeholder="e.g. archive-2026, media-store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Must consist of lowercase letters, numbers, and hyphens.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Create Bucket</button>
        </div>
      </div>
    </div>
  );
};
