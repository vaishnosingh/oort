import React from 'react';

interface BatchToolbarProps {
  selectedCount: number;
  onDownloadZip: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  selectedCount,
  onDownloadZip,
  onDeleteSelected,
  onClearSelection,
}) => {
  return (
    <div className={`batch-toolbar ${selectedCount > 0 ? 'show' : ''}`} id="batch-bar">
      <span className="batch-count-text">
        <span id="batch-selected-count">{selectedCount}</span> items selected
      </span>
      <button className="btn btn-secondary btn-sm" onClick={onDownloadZip}>
        Download ZIP
      </button>
      <button className="btn btn-danger btn-sm" onClick={onDeleteSelected}>
        Delete Selected
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClearSelection}>
        Cancel
      </button>
    </div>
  );
};
