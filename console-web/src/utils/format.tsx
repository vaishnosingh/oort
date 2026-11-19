import React from 'react';
import { CategoryFilter } from '../types';

export function fmtBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
}

export function formatDate(isoStr: string): string {
  if (!isoStr || isoStr.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export function getFileCategory(name: string): CategoryFilter {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv'].includes(ext)) return 'documents';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'tiff'].includes(ext)) return 'image';
  if (['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (['zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'iso'].includes(ext)) return 'archives';
  if (['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'rs', 'c', 'cpp', 'html', 'css', 'json', 'yaml', 'yml', 'sh', 'sql'].includes(ext)) return 'code';
  return 'documents';
}

export function renderFileIcon(name: string, isDir: boolean): React.ReactNode {
  if (isDir) {
    return (
      <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" fill="rgba(245,158,11,0.12)" />
      </svg>
    );
  }
  const cat = getFileCategory(name);
  if (cat === 'image') {
    return (
      <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (cat === 'audio') {
    return (
      <svg width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }
  if (cat === 'code') {
    return (
      <svg width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }
  if (cat === 'archives') {
    return (
      <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
