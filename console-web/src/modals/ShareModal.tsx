import React, { useState, useEffect } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  objectKey: string;
  onClose: () => void;
  onGenerate: (key: string, hours: number) => Promise<string | null>;
  onCopy: (text: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  objectKey,
  onClose,
  onGenerate,
  onCopy,
}) => {
  const [duration, setDuration] = useState('24');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    const url = await onGenerate(objectKey, parseInt(duration) || 24);
    if (url) {
      setGeneratedUrl(url);
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop show" id="modal-share" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">Generate Presigned Share Link</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Object</label>
            <input type="text" id="share-key-display" className="form-input mono-cell" readOnly value={objectKey} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiration Period</label>
            <select
              id="share-duration-select"
              className="form-select"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="1">1 Hour</option>
              <option value="6">6 Hours</option>
              <option value="24">24 Hours (1 Day)</option>
              <option value="168">7 Days</option>
            </select>
          </div>
          {generatedUrl && (
            <div className="form-group" id="share-result-group" style={{ display: 'flex' }}>
              <label className="form-label">Generated Public URL</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" id="share-url-input" className="form-input mono-cell" readOnly value={generatedUrl} />
                <button className="btn btn-secondary btn-sm" onClick={() => onCopy(generatedUrl)}>
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" id="btn-generate-share" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
