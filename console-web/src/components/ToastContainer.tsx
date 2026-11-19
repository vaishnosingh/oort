import React from 'react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((t) => {
        let icon = '✓';
        if (t.type === 'error') icon = '✕';
        if (t.type === 'info') icon = 'ℹ';

        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <span style={{ fontWeight: 700 }}>{icon}</span>
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
