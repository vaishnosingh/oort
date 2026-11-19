import React, { useState, useEffect, useRef } from 'react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState('25');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('25');
      setTimeout(() => inputRef.current?.select(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const val = parseInt(amount, 10);
    if (!val || val <= 0) return;
    onSubmit(val);
  };

  return (
    <div className="modal-backdrop show" id="modal-quota" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Request Storage Quota Expansion</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Requested Additional Capacity (GB)</label>
            <input
              type="number"
              id="quota-amount-input"
              ref={inputRef}
              className="form-input"
              min="1"
              max="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Submit Request</button>
        </div>
      </div>
    </div>
  );
};
