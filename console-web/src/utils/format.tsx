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
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'tiff', 'bmp', 'avif'].includes(ext)) return 'image';
  if (['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'mkv', 'webm', 'mov'].includes(ext)) return 'audio';
  if (['zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'iso', 'xz'].includes(ext)) return 'archives';
  if (['js', 'ts', 'jsx', 'tsx', 'go', 'py', 'rs', 'c', 'cpp', 'html', 'css', 'json', 'yaml', 'yml', 'sh', 'sql', 'md'].includes(ext)) return 'code';
  return 'documents';
}

export function getFileExtension(name: string): string {
  if (!name || name.endsWith('/')) return 'DIR';
  const parts = name.split('.');
  if (parts.length > 1) {
    return (parts.pop() || '').toUpperCase();
  }
  return 'FILE';
}

export function renderFileIcon(name: string, isDir: boolean, size: number = 18): React.ReactNode {
  if (isDir) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C10.1162 5 10.6249 5.21071 11 5.58579L12.4142 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
          fill="rgba(245, 158, 11, 0.22)"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M3 10H21"
          stroke="#fbbf24"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const cat = getFileCategory(name);

  if (cat === 'image') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(52, 211, 153, 0.18)" stroke="#34d399" strokeWidth="1.8" />
        <circle cx="8.5" cy="8.5" r="2" fill="#34d399" />
        <path d="M21 15L16 10L5 21" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 14L17 11L21 15" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (cat === 'audio') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(251, 191, 36, 0.16)" stroke="#fbbf24" strokeWidth="1.8" />
        <path d="M9 17V7L17 5V15" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="17" r="2" fill="#fbbf24" />
        <circle cx="15" cy="15" r="2" fill="#fbbf24" />
      </svg>
    );
  }

  if (cat === 'code') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="1.8" />
        <path d="M9 9L6 12L9 15" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 9L18 12L15 15" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="13" y1="8" x2="11" y2="16" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (cat === 'archives') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(167, 139, 250, 0.18)" stroke="#a78bfa" strokeWidth="1.8" />
        <rect x="7" y="3" width="10" height="18" stroke="#c4b5fd" strokeWidth="1.2" strokeDasharray="2 2" />
        <rect x="10" y="11" width="4" height="4" rx="1" fill="#a78bfa" stroke="#fff" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="rgba(148, 163, 184, 0.16)"
        stroke="#94a3b8"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke="#cbd5e1" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="8" y1="13" x2="16" y2="13" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="17" x2="13" y2="17" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
