import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActiveView,
  BucketInfo,
  S3Object,
  UserProfile,
  NasInfo,
  CustomDomain,
  ToastMessage,
  UploadItem,
} from './types';
import * as api from './services/api';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BatchToolbar } from './components/BatchToolbar';
import { UploadDrawer } from './components/UploadDrawer';
import { ToastContainer } from './components/ToastContainer';

// Views
import { BrowserView } from './views/BrowserView';
import { DashboardView } from './views/DashboardView';
import { NasView } from './views/NasView';
import { ApiCredentialsView } from './views/ApiCredentialsView';
import { DomainsView } from './views/DomainsView';
import { SettingsView } from './views/SettingsView';
import { AccountView } from './views/AccountView';

// Modals
import { CreateFolderModal } from './modals/CreateFolderModal';
import { CreateBucketModal } from './modals/CreateBucketModal';
import { RenameFolderModal } from './modals/RenameFolderModal';
import { RenameBucketModal } from './modals/RenameBucketModal';
import { MoveModal } from './modals/MoveModal';
import { ShareModal } from './modals/ShareModal';
import { PreviewModal } from './modals/PreviewModal';
import { AddDomainModal } from './modals/AddDomainModal';
import { QuotaModal } from './modals/QuotaModal';
import { ProfileModal } from './modals/ProfileModal';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('browser');
  const [currentBucket, setCurrentBucket] = useState<string>('');
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nasInfo, setNasInfo] = useState<NasInfo | null>(null);
  const [domains, setDomains] = useState<CustomDomain[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Uploads
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState<boolean>(false);
  const isUploadingRef = useRef(false);

  // Modals
  const [isMkdirOpen, setIsMkdirOpen] = useState(false);
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderKey, setRenameFolderKey] = useState('');
  const [isRenameBucketOpen, setIsRenameBucketOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveSourceKey, setMoveSourceKey] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareObjectKey, setShareObjectKey] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewObjectKey, setPreviewObjectKey] = useState('');
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Copied to clipboard.');
    });
  }, [addToast]);

  const currentBucketObj = buckets.find((b) => b.Name === currentBucket);
  const bucketDisplayName = currentBucketObj?.DisplayName || currentBucketObj?.Name || currentBucket;

  // ─── LOAD DATA ───
  const loadObjects = useCallback(async (bucketName?: string, prefix?: string) => {
    const b = bucketName ?? currentBucket;
    const p = prefix ?? currentPrefix;
    if (!b) return;
    setLoading(true);
    try {
      const res = await api.listObjects(b, p, false);
      setObjects(res.objects || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to list objects', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentBucket, currentPrefix, addToast]);

  const loadBuckets = useCallback(async () => {
    try {
      const res = await api.listBuckets();
      setBuckets(res.buckets || []);
      if (res.buckets && res.buckets.length > 0 && !currentBucket) {
        const first = res.buckets[0].Name;
        setCurrentBucket(first);
        loadObjects(first, '');
      }
    } catch (err: any) {
      addToast('Failed to load bucket partitions', 'error');
    }
  }, [currentBucket, loadObjects, addToast]);

  const loadProfile = useCallback(async () => {
    try {
      const p = await api.getProfile();
      if (p) setProfile(p);
    } catch (err: any) {
      console.error('Failed to load profile', err);
    }
  }, []);

  const loadNasInfo = useCallback(async () => {
    if (!currentBucket) return;
    try {
      const info = await api.getNasInfo(currentBucket);
      setNasInfo(info);
    } catch (err: any) {
      console.error('Failed to load NAS info', err);
    }
  }, [currentBucket]);

  const loadDomains = useCallback(async () => {
    if (!currentBucket) return;
    try {
      const res = await api.listDomains(currentBucket);
      setDomains(res.domains || []);
    } catch (err: any) {
      console.error('Failed to load custom domains', err);
    }
  }, [currentBucket]);

  // Initial mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as ActiveView;
    if (['browser', 'dashboard', 'nas', 'api', 'domains', 'settings', 'account'].includes(hash)) {
      setActiveView(hash);
    }
    loadBuckets();
    loadProfile();
  }, [loadBuckets, loadProfile]);

  // View switches
  const handleSelectView = (view: ActiveView) => {
    setActiveView(view);
    window.location.hash = view;
    if (window.innerWidth <= 768) setMobileSidebarOpen(false);

    if (view === 'browser') loadObjects();
    if (view === 'nas') loadNasInfo();
    if (view === 'domains') loadDomains();
    if (view === 'account') loadProfile();
  };

  const handleSelectBucket = (name: string) => {
    setCurrentBucket(name);
    setCurrentPrefix('');
    setSelectedKeys(new Set());
    loadObjects(name, '');
    if (activeView === 'nas') loadNasInfo();
    if (activeView === 'domains') loadDomains();
  };

  // Navigate Prefix
  const handleNavigatePrefix = (prefix: string) => {
    setCurrentPrefix(prefix);
    setSelectedKeys(new Set());
    loadObjects(currentBucket, prefix);
  };

  // ─── BUCKET ACTIONS ───
  const handleCreateBucket = async (bucketName: string) => {
    try {
      await api.createBucket(bucketName);
      addToast(`Bucket "${bucketName}" created.`);
      setIsCreateBucketOpen(false);
      await loadBuckets();
      handleSelectBucket(bucketName);
    } catch (err: any) {
      addToast(err.message || 'Failed to create bucket', 'error');
    }
  };

  const handleDeleteBucket = async () => {
    if (!window.confirm(`Delete bucket "${currentBucket}" permanently? The bucket must be empty.`)) return;
    try {
      await api.deleteBucket(currentBucket);
      addToast(`Bucket "${currentBucket}" deleted.`);
      const res = await api.listBuckets();
      setBuckets(res.buckets || []);
      if (res.buckets && res.buckets.length > 0) {
        handleSelectBucket(res.buckets[0].Name);
      } else {
        handleSelectView('dashboard');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete bucket', 'error');
    }
  };

  const handleRenameBucket = async (newName: string) => {
    try {
      await api.renameBucket(currentBucket, newName);
      addToast(`Bucket renamed to "${newName}".`);
      setIsRenameBucketOpen(false);
      await loadBuckets();
    } catch (err: any) {
      addToast(err.message || 'Failed to rename bucket', 'error');
    }
  };

  const handleEmptyBucket = async () => {
    if (!window.confirm(`Are you SURE you want to delete all objects in bucket "${currentBucket}"? This action CANNOT be undone.`)) return;
    try {
      await api.emptyBucket(currentBucket);
      addToast(`Bucket "${currentBucket}" emptied.`);
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to empty bucket', 'error');
    }
  };

  // ─── OBJECT & FOLDER ACTIONS ───
  const handleCreateFolder = async (folderName: string) => {
    try {
      let name = folderName.trim();
      if (!name.endsWith('/')) name += '/';
      const fullPrefix = (currentPrefix + name).replace(/^\/+/, '');
      await api.mkdir(currentBucket, fullPrefix);
      addToast(`Created folder: ${folderName}`);
      setIsMkdirOpen(false);
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to create folder', 'error');
    }
  };

  const handleDeleteFolder = async (folderKey: string) => {
    const cleanName = folderKey.replace(currentPrefix, '').replace(/\/$/, '');
    if (!window.confirm(`Delete folder "${cleanName}" and ALL its contents permanently?\n\nThis action cannot be undone.`)) return;
    try {
      const key = folderKey.endsWith('/') ? folderKey : folderKey + '/';
      await api.deleteObject(currentBucket, key);
      addToast(`Folder "${cleanName}" deleted.`);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(folderKey);
        return next;
      });
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete folder', 'error');
    }
  };

  const handleRenameFolder = async (oldKey: string, newName: string) => {
    try {
      addToast('Renaming folder and updating contents...', 'info');
      const folderKey = oldKey.endsWith('/') ? oldKey : oldKey + '/';
      const parentPrefix = folderKey.substring(0, folderKey.lastIndexOf('/', folderKey.length - 2) + 1);
      const newKey = parentPrefix + newName.replace(/\/$/, '') + '/';

      const listData = await api.listObjects(currentBucket, folderKey, true);
      const objs = (listData.objects || []).filter((o) => !o.is_dir);

      for (const obj of objs) {
        const relPath = obj.key.substring(folderKey.length);
        const destKey = newKey + relPath;
        await api.moveObject(currentBucket, obj.key, destKey);
      }
      await api.deleteObject(currentBucket, folderKey);

      addToast(`Folder renamed to "${newName}".`);
      setIsRenameFolderOpen(false);
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to rename folder', 'error');
    }
  };

  const handleDeleteObject = async (key: string) => {
    if (!window.confirm(`Delete object "${key}" permanently?`)) return;
    try {
      await api.deleteObject(currentBucket, key);
      addToast(`Deleted: ${key}`);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete object', 'error');
    }
  };

  const handleMoveObject = async (oldKey: string, newKey: string) => {
    try {
      await api.moveObject(currentBucket, oldKey, newKey);
      addToast('Object moved successfully.');
      setIsMoveOpen(false);
      loadObjects();
    } catch (err: any) {
      addToast(err.message || 'Failed to move object', 'error');
    }
  };

  const handleDownloadObject = async (key: string) => {
    try {
      const data = await api.getPresignedUrl(currentBucket, key, 300);
      if (data && data.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = key.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err: any) {
      addToast('Failed to generate download link', 'error');
    }
  };

  // Batch actions
  const handleToggleSelectKey = (key: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const all = new Set(objects.map((o) => o.key));
      setSelectedKeys(all);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleBatchDelete = async () => {
    const count = selectedKeys.size;
    if (!window.confirm(`Permanently delete ${count} selected items (files and folders)?\n\nFolders and all nested objects will be deleted. This cannot be undone.`)) return;

    let deleted = 0;
    for (const key of Array.from(selectedKeys)) {
      try {
        await api.deleteObject(currentBucket, key);
        deleted++;
      } catch (e) {
        console.error('Delete item failed', key, e);
      }
    }
    addToast(`Deleted ${deleted} of ${count} items.`);
    setSelectedKeys(new Set());
    loadObjects();
  };

  const handleBatchDownloadZip = async () => {
    addToast('Downloading selected items...', 'info');
    for (const key of Array.from(selectedKeys)) {
      handleDownloadObject(key);
    }
  };

  // ─── UPLOADS ───
  const processUploadQueue = useCallback(async () => {
    if (isUploadingRef.current) return;
    const item = uploadQueue.find((i) => i.status === 'queued');
    if (!item) return;

    isUploadingRef.current = true;
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
    );

    try {
      const form = new FormData();
      form.append('file', item.file);
      form.append('bucket', currentBucket);
      form.append('key', item.key);

      const sid = api.getSessionId();
      const res = await fetch('/oort/api/upload/init', {
        method: 'POST',
        headers: sid ? { 'X-Session-Id': sid } : {},
        body: form,
      });
      if (!res.ok) throw new Error('Direct upload failed');

      setUploadQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'complete', progress: 100 } : i))
      );
      addToast(`Uploaded: ${item.file.name}`);
      loadObjects();
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error' } : i))
      );
      addToast(`Upload failed: ${item.file.name}`, 'error');
    } finally {
      isUploadingRef.current = false;
    }
  }, [uploadQueue, currentBucket, addToast, loadObjects]);

  useEffect(() => {
    if (uploadQueue.some((i) => i.status === 'queued') && !isUploadingRef.current) {
      processUploadQueue();
    }
  }, [uploadQueue, processUploadQueue]);

  const handleFilesSelected = (files: FileList) => {
    const items: UploadItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      key: (currentPrefix + file.name).replace(/^\/+/, ''),
      progress: 0,
      status: 'queued',
    }));
    setUploadQueue((prev) => [...prev, ...items]);
    setIsUploadDrawerOpen(true);
  };

  // ─── PROFILE & PASSWORD ───
  const handleUpdateProfile = async (name: string, username: string) => {
    if (!name || !username) {
      addToast('Name and username are required', 'error');
      return;
    }
    try {
      await api.updateProfile(name, username);
      addToast('Profile information saved safely to ScyllaDB!');
      loadProfile();
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const handleUpdatePassword = async (oldP: string, newP: string) => {
    if (!newP) {
      addToast('Please enter a new password', 'error');
      return;
    }
    if (newP.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    try {
      await api.updatePassword(oldP, newP);
      addToast('Password securely hashed with bcrypt and updated in ScyllaDB!');
    } catch (err: any) {
      addToast(err.message || 'Failed to update password', 'error');
    }
  };

  const handleUploadAvatar = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image too large. Max 10MB.', 'error');
      return;
    }
    try {
      addToast('Uploading avatar to database...');
      await api.uploadProfileImage(file);
      addToast('Profile avatar updated successfully!');
      loadProfile();
    } catch (err: any) {
      addToast(err.message || 'Failed to upload avatar', 'error');
    }
  };

  const handleQuotaRequest = async (amount: number) => {
    try {
      await api.requestQuota(amount);
      addToast(`Requested ${amount} GB storage quota expansion.`);
      setIsQuotaOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to submit quota request', 'error');
    }
  };

  const handleAddDomain = async (domain: string) => {
    try {
      await api.addDomain(currentBucket, domain);
      addToast(`Domain mapped: ${domain}`);
      setIsAddDomainOpen(false);
      loadDomains();
    } catch (err: any) {
      addToast(err.message || 'Failed to map domain', 'error');
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (!window.confirm(`Unmap custom domain "${domain}"?`)) return;
    try {
      await api.removeDomain(domain);
      addToast(`Domain unmapped: ${domain}`);
      loadDomains();
    } catch (err: any) {
      addToast(err.message || 'Failed to unmap domain', 'error');
    }
  };

  const handleEnableNasStreaming = async () => {
    try {
      await api.enableNasStreaming(currentBucket);
      addToast('NAS streaming volume synchronized.');
      loadNasInfo();
    } catch (err: any) {
      addToast(err.message || 'Failed to synchronize NAS streaming', 'error');
    }
  };

  // Keyboard shortcut listener (Escape to close modals or batch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMkdirOpen) setIsMkdirOpen(false);
        else if (isCreateBucketOpen) setIsCreateBucketOpen(false);
        else if (isRenameFolderOpen) setIsRenameFolderOpen(false);
        else if (isRenameBucketOpen) setIsRenameBucketOpen(false);
        else if (isMoveOpen) setIsMoveOpen(false);
        else if (isShareOpen) setIsShareOpen(false);
        else if (isPreviewOpen) setIsPreviewOpen(false);
        else if (isAddDomainOpen) setIsAddDomainOpen(false);
        else if (isQuotaOpen) setIsQuotaOpen(false);
        else if (isProfileOpen) setIsProfileOpen(false);
        else if (selectedKeys.size > 0) setSelectedKeys(new Set());
        else if (searchQuery) setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMkdirOpen,
    isCreateBucketOpen,
    isRenameFolderOpen,
    isRenameBucketOpen,
    isMoveOpen,
    isShareOpen,
    isPreviewOpen,
    isAddDomainOpen,
    isQuotaOpen,
    isProfileOpen,
    selectedKeys.size,
    searchQuery,
  ]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        buckets={buckets}
        currentBucket={currentBucket}
        onSelectBucket={handleSelectBucket}
        onOpenCreateBucket={() => setIsCreateBucketOpen(true)}
        profile={profile}
        onOpenProfile={() => setIsProfileOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile Backdrop */}
      <div
        className={`mobile-sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`}
        id="mobile-sidebar-overlay"
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Main Shell */}
      <main className="app-main">
        <Topbar
          currentBucket={currentBucket}
          bucketDisplayName={bucketDisplayName}
          currentPrefix={currentPrefix}
          onNavigatePrefix={handleNavigatePrefix}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMkdir={() => setIsMkdirOpen(true)}
          onFilesSelected={handleFilesSelected}
          onRefresh={() => loadObjects()}
          profile={profile}
          onOpenProfile={() => setIsProfileOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* View Routing */}
        {activeView === 'browser' && (
          <BrowserView
            currentBucket={currentBucket}
            bucketDisplayName={bucketDisplayName}
            currentPrefix={currentPrefix}
            objects={objects}
            loading={loading}
            searchQuery={searchQuery}
            selectedKeys={selectedKeys}
            onToggleSelectKey={handleToggleSelectKey}
            onToggleSelectAll={handleToggleSelectAll}
            onNavigatePrefix={handleNavigatePrefix}
            onOpenPreview={(key) => {
              setPreviewObjectKey(key);
              setIsPreviewOpen(true);
            }}
            onDownload={handleDownloadObject}
            onOpenMove={(key) => {
              setMoveSourceKey(key);
              setIsMoveOpen(true);
            }}
            onOpenShare={(key) => {
              setShareObjectKey(key);
              setIsShareOpen(true);
            }}
            onDeleteObject={handleDeleteObject}
            onOpenRenameFolder={(key) => {
              setRenameFolderKey(key);
              setIsRenameFolderOpen(true);
            }}
            onDeleteFolder={handleDeleteFolder}
            onOpenRenameBucket={() => setIsRenameBucketOpen(true)}
            onSwitchView={handleSelectView}
            onEmptyBucket={handleEmptyBucket}
            onDeleteBucket={handleDeleteBucket}
            onOpenMkdir={() => setIsMkdirOpen(true)}
            onCopyText={copyText}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            objects={objects}
            buckets={buckets}
            currentBucket={currentBucket}
            bucketDisplayName={bucketDisplayName}
            onOpenCreateBucket={() => setIsCreateBucketOpen(true)}
            onBrowseObjects={() => handleSelectView('browser')}
            onOpenPreview={(key) => {
              setPreviewObjectKey(key);
              setIsPreviewOpen(true);
            }}
          />
        )}

        {activeView === 'nas' && (
          <NasView
            currentBucket={currentBucket}
            nasInfo={nasInfo}
            profile={profile}
            onUploadMedia={() => setIsUploadDrawerOpen(true)}
            onEnableStreaming={handleEnableNasStreaming}
            onOpenPreview={(key) => {
              setPreviewObjectKey(key);
              setIsPreviewOpen(true);
            }}
            onDownload={handleDownloadObject}
            onCopy={copyText}
          />
        )}

        {activeView === 'api' && (
          <ApiCredentialsView
            profile={profile}
            currentBucket={currentBucket}
            onCopy={copyText}
          />
        )}

        {activeView === 'domains' && (
          <DomainsView
            currentBucket={currentBucket}
            domains={domains}
            onOpenAddDomain={() => setIsAddDomainOpen(true)}
            onRemoveDomain={handleRemoveDomain}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            currentBucket={currentBucket}
            bucketDisplayName={bucketDisplayName}
            onRenameBucket={handleRenameBucket}
            onBrowseBucket={() => handleSelectView('browser')}
            onEmptyBucket={handleEmptyBucket}
            onDeleteBucket={handleDeleteBucket}
            onToast={addToast}
          />
        )}

        {activeView === 'account' && (
          <AccountView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onUpdatePassword={handleUpdatePassword}
            onUploadAvatar={handleUploadAvatar}
            onOpenProfileModal={() => setIsProfileOpen(true)}
            onOpenQuotaModal={() => setIsQuotaOpen(true)}
            sessionId={api.getSessionId()}
          />
        )}
      </main>

      {/* Floating Batch Bar */}
      <BatchToolbar
        selectedCount={selectedKeys.size}
        onDownloadZip={handleBatchDownloadZip}
        onDeleteSelected={handleBatchDelete}
        onClearSelection={() => setSelectedKeys(new Set())}
      />

      {/* Floating Upload Drawer */}
      <UploadDrawer
        uploadQueue={uploadQueue}
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Modals */}
      <CreateFolderModal
        isOpen={isMkdirOpen}
        onClose={() => setIsMkdirOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <CreateBucketModal
        isOpen={isCreateBucketOpen}
        onClose={() => setIsCreateBucketOpen(false)}
        onSubmit={handleCreateBucket}
      />

      <RenameFolderModal
        isOpen={isRenameFolderOpen}
        folderKey={renameFolderKey}
        onClose={() => setIsRenameFolderOpen(false)}
        onSubmit={handleRenameFolder}
      />

      <RenameBucketModal
        isOpen={isRenameBucketOpen}
        currentDisplayName={bucketDisplayName}
        onClose={() => setIsRenameBucketOpen(false)}
        onSubmit={handleRenameBucket}
      />

      <MoveModal
        isOpen={isMoveOpen}
        sourceKey={moveSourceKey}
        onClose={() => setIsMoveOpen(false)}
        onSubmit={handleMoveObject}
      />

      <ShareModal
        isOpen={isShareOpen}
        objectKey={shareObjectKey}
        onClose={() => setIsShareOpen(false)}
        onGenerate={async (key, hours) => {
          const res = await api.getPresignedUrl(currentBucket, key, hours * 3600);
          return res?.url || null;
        }}
        onCopy={copyText}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        objectKey={previewObjectKey}
        currentBucket={currentBucket}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownloadObject}
      />

      <AddDomainModal
        isOpen={isAddDomainOpen}
        onClose={() => setIsAddDomainOpen(false)}
        onSubmit={handleAddDomain}
      />

      <QuotaModal
        isOpen={isQuotaOpen}
        onClose={() => setIsQuotaOpen(false)}
        onSubmit={handleQuotaRequest}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onClose={() => setIsProfileOpen(false)}
        onUpdateInfo={handleUpdateProfile}
        onUpdatePassword={handleUpdatePassword}
        onUploadAvatar={handleUploadAvatar}
        onGoToAccountTab={() => handleSelectView('account')}
      />
    </div>
  );
};
