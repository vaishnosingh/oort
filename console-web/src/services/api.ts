import { BucketInfo, S3Object, UserProfile, NasInfo, CustomDomain } from '../types';

declare global {
  interface Window {
    __OORT_CONFIG__?: {
      sid: string;
      username: string;
    };
  }
}

export function getSessionId(): string {
  if (typeof window !== 'undefined' && window.__OORT_CONFIG__?.sid) {
    return window.__OORT_CONFIG__.sid;
  }
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)oort_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
    const matchCosmos = document.cookie.match(/(?:^|;\s*)cosmos_sid=([^;]+)/);
    if (matchCosmos) return decodeURIComponent(matchCosmos[1]);
  }
  return '';
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const sid = getSessionId();
  const url = new URL(path, window.location.origin);
  const headers = new Headers(options.headers || {});
  if (sid) {
    headers.set('X-Session-Id', sid);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url.toString(), {
      ...options,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    console.error(`API Error [${path}]:`, err);
    throw err;
  }
}

// ─── BUCKETS ───
export async function listBuckets(): Promise<{ buckets: BucketInfo[] }> {
  return (await apiFetch<{ buckets: BucketInfo[] }>('/oort/api/buckets')) || { buckets: [] };
}

export async function createBucket(bucket_name: string): Promise<any> {
  return apiFetch('/oort/api/buckets', {
    method: 'POST',
    body: JSON.stringify({ bucket_name }),
  });
}

export async function deleteBucket(bucket_name: string): Promise<any> {
  return apiFetch('/oort/api/buckets', {
    method: 'DELETE',
    body: JSON.stringify({ bucket_name }),
  });
}

export async function renameBucket(old_bucket: string, new_name: string): Promise<any> {
  return apiFetch('/oort/api/buckets/rename', {
    method: 'POST',
    body: JSON.stringify({ old_bucket, new_name }),
  });
}

export async function emptyBucket(bucket: string): Promise<any> {
  return apiFetch('/oort/api/bucket/empty', {
    method: 'POST',
    body: JSON.stringify({ bucket }),
  });
}

// ─── OBJECTS ───
export async function listObjects(bucket: string, prefix = '', recursive = false): Promise<{ objects: S3Object[] }> {
  const params = new URLSearchParams({ bucket, prefix, recursive: String(recursive) });
  return (await apiFetch<{ objects: S3Object[] }>(`/oort/api/objects?${params.toString()}`)) || { objects: [] };
}

export async function mkdir(bucket: string, prefix: string): Promise<any> {
  return apiFetch('/oort/api/mkdir', {
    method: 'POST',
    body: JSON.stringify({ bucket, prefix }),
  });
}

export async function deleteObject(bucket: string, key: string): Promise<any> {
  return apiFetch('/oort/api/delete', {
    method: 'POST',
    body: JSON.stringify({ bucket, key }),
  });
}

export async function moveObject(bucket: string, old_key: string, new_key: string): Promise<any> {
  return apiFetch('/oort/api/objects/move', {
    method: 'POST',
    body: JSON.stringify({ bucket, old_key, new_key }),
  });
}

export async function getPresignedUrl(bucket: string, key: string, expires = 3600): Promise<{ url: string } | null> {
  const params = new URLSearchParams({ bucket, key, expires: String(expires) });
  return apiFetch<{ url: string }>(`/oort/api/presign?${params.toString()}`);
}

// ─── USER PROFILE & AUTH ───
export async function getProfile(): Promise<UserProfile | null> {
  return apiFetch<UserProfile>('/oort/api/profile');
}

export async function updateProfile(name: string, username: string): Promise<any> {
  return apiFetch('/oort/api/profile/update', {
    method: 'POST',
    body: JSON.stringify({ name, username }),
  });
}

export async function updatePassword(current_password: string, new_password: string): Promise<any> {
  return apiFetch('/oort/api/password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function uploadProfileImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('profile_image', file);
  return apiFetch('/oort/api/profile/image', {
    method: 'POST',
    body: formData,
  });
}

export async function requestQuota(amount: number): Promise<any> {
  return apiFetch('/oort/api/quota', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

// ─── STATS & BREAKDOWN ───
export async function getStats(bucket = ''): Promise<any> {
  return apiFetch(`/oort/api/stats?bucket=${encodeURIComponent(bucket)}`);
}

export async function getStorageBreakdown(bucket = ''): Promise<any> {
  return apiFetch(`/oort/api/storage/breakdown?bucket=${encodeURIComponent(bucket)}`);
}

// ─── NAS ───
export async function getNasInfo(bucket: string): Promise<NasInfo | null> {
  return apiFetch<NasInfo>(`/oort/api/nas/info?bucket=${encodeURIComponent(bucket)}`);
}

export async function enableNasStreaming(bucket: string): Promise<any> {
  return apiFetch('/oort/api/nas/enable-streaming', {
    method: 'POST',
    body: JSON.stringify({ bucket }),
  });
}

// ─── DOMAINS ───
export async function listDomains(bucket: string): Promise<{ domains: CustomDomain[] }> {
  return (await apiFetch<{ domains: CustomDomain[] }>(`/oort/api/bucket/domains?bucket=${encodeURIComponent(bucket)}`)) || { domains: [] };
}

export async function addDomain(bucket: string, domain: string): Promise<any> {
  return apiFetch('/oort/api/bucket/domain/add', {
    method: 'POST',
    body: JSON.stringify({ bucket, domain }),
  });
}

export async function removeDomain(domain: string): Promise<any> {
  return apiFetch('/oort/api/bucket/domain/remove', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}
