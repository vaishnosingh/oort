import React, { useState, useEffect, useRef } from 'react';

interface MoveModalProps {
  isOpen: boolean;
  sourceKey: string;
  onClose: () => void;
  onSubmit: (oldKey: string, newKey: string) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  sourceKey,
  onClose,
  onSubmit,
}) => {
  const [destKey, setDestKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDestKey(sourceKey);
      setTimeout(() => inputRef.current?.select(), 80);
    }
  }, [isOpen, sourceKey]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!destKey.trim() || destKey.trim() === sourceKey) return;
    onSubmit(sourceKey, destKey.trim());
  };

  return (
    <div className="modal-backdrop show" id="modal-move" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Move / Rename Object</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Current Key</label>
            <input type="text" id="move-source-input" className="form-input mono-cell" readOnly value={sourceKey} />
          </div>
          <div className="form-group">
            <label className="form-label">Destination Key</label>
            <input
              type="text"
              id="move-dest-input"
              ref={inputRef}
              className="form-input mono-cell"
              value={destKey}
              onChange={(e) => setDestKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Enter the full destination path including prefix.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Move Object</button>
        </div>
      </div>
    </div>
  );
};
