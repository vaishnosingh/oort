export interface BucketInfo {
  Name: string;
  DisplayName?: string;
  is_public?: boolean;
  owner_email?: string;
}

export interface S3Object {
  key: string;
  name?: string;
  size: number;
  last_modified: string;
  is_dir: boolean;
  content_type?: string;
  etag?: string;
}

export interface UserProfile {
  email?: string;
  username: string;
  name?: string;
  access_key?: string;
  secret_key?: string;
  profile_image?: string;
  bucket?: string;
  bucket_display_name?: string;
}

export interface StorageBreakdown {
  categories: Record<string, number>;
  total_bytes: number;
}

export interface CustomDomain {
  domain: string;
  bucket: string;
  verified?: boolean;
  created_at?: string;
}

export interface NasInfo {
  track_count: number;
  music_bytes: number;
  tracks: Array<{ key: string; size: number }>;
}

export interface UploadItem {
  id: string;
  file: File;
  key: string;
  progress: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export type ActiveView = 'browser' | 'dashboard' | 'nas' | 'api' | 'domains' | 'settings' | 'account';

export type CategoryFilter = 'all' | 'documents' | 'image' | 'audio' | 'archives' | 'code';
