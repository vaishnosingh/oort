import React, { useState, useEffect } from 'react';
import { getPresignedUrl } from '../services/api';

interface PreviewModalProps {
  isOpen: boolean;
  objectKey: string;
  currentBucket: string;
  onClose: () => void;
  onSaveContent?: (key: string, content: string) => void;
  onDownload: (key: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  objectKey,
  currentBucket,
  onClose,
  onSaveContent,
  onDownload,
}) => {
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'text' | 'binary'>('binary');
  const [textContent, setTextContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !objectKey) return;
    setLoading(true);
    const ext = objectKey.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      setFileType('image');
    } else if (['mp4', 'webm'].includes(ext)) {
      setFileType('video');
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      setFileType('audio');
    } else if (['txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'go', 'py', 'sh', 'md', 'yaml', 'yml', 'xml', 'csv'].includes(ext)) {
      setFileType('text');
    } else {
      setFileType('binary');
    }

    getPresignedUrl(currentBucket, objectKey, 3600)
      .then(async (res) => {
        if (res && res.url) {
          setUrl(res.url);
          if (['txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'go', 'py', 'sh', 'md', 'yaml', 'yml', 'xml', 'csv'].includes(ext)) {
            try {
              const resp = await fetch(res.url);
              const txt = await resp.text();
              setTextContent(txt);
            } catch {
              setFileType('binary');
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen, objectKey, currentBucket]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!onSaveContent) return;
    setSaving(true);
    await onSaveContent(objectKey, textContent);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop show" id="modal-preview" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: '760px', maxHeight: '85vh' }}>
        <div className="modal-header">
          <div className="modal-title" id="preview-modal-title">
            Inspect: {objectKey}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" id="preview-modal-body" style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Loading object preview...
            </div>
          ) : !url ? (
            <div style={{ color: 'var(--accent-danger)', textAlign: 'center', padding: '20px' }}>
              Failed to generate presigned URL for preview.
            </div>
          ) : fileType === 'image' ? (
            <div style={{ textAlign: 'center' }}>
              <img src={url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '6px', border: '1px solid var(--border-default)' }} />
            </div>
          ) : fileType === 'video' ? (
            <video controls style={{ width: '100%', maxHeight: '480px', borderRadius: '6px' }} src={url} />
          ) : fileType === 'audio' ? (
            <audio controls style={{ width: '100%', margin: '24px 0' }} src={url} />
          ) : fileType === 'text' ? (
            <textarea
              id="preview-editor-textarea"
              className="form-textarea mono-cell"
              style={{ height: '360px', fontSize: '12px', lineHeight: 1.4 }}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Binary or non-previewable file.
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => onDownload(objectKey)}>
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer" id="preview-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          {fileType === 'text' && onSaveContent && (
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
