import React, { useState, useEffect, useRef } from 'react';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (domain: string) => void;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [domain, setDomain] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDomain('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const clean = domain.trim().toLowerCase();
    if (!clean) return;
    onSubmit(clean);
  };

  return (
    <div className="modal-backdrop show" id="modal-domain" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Map Custom Domain</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Domain Name (FQDN)</label>
            <input
              type="text"
              id="domain-name-input"
              ref={inputRef}
              className="form-input mono-cell"
              placeholder="e.g. assets.example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Configure a CNAME record pointing to <code style={{ color: '#60a5fa' }}>oort.linuxguy.space</code> at your DNS provider.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Map Domain</button>
        </div>
      </div>
    </div>
  );
};
