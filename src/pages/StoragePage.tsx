import React, { useState, useMemo } from 'react';
import {
  Cloud,
  FolderPlus,
  Upload,
  Search,
  Grid,
  List as ListIcon,
  Star,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Layers,
  Table,
  Download,
  Share2,
  Trash2,
  X,
  HardDrive,
  Folder,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  INITIAL_STORAGE_FILES,
  INITIAL_STORAGE_FOLDERS,
  INITIAL_STORAGE_METRICS,
  type StorageFile,
  type StorageFolder,
  type StorageFileType,
} from '../mocks/storageData';
import clsx from 'clsx';

type CategoryFilter = 'all' | 'recent' | 'media' | 'documents' | 'starred' | 'trash';

export const StoragePage: React.FC = () => {
  const { t } = useLanguage();

  const [files, setFiles] = useState<StorageFile[]>(INITIAL_STORAGE_FILES);
  const [folders, setFolders] = useState<StorageFolder[]>(INITIAL_STORAGE_FOLDERS);
  const [metrics] = useState(INITIAL_STORAGE_METRICS);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modals
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');
  const [activePreviewFile, setActivePreviewFile] = useState<StorageFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = file.name.toLowerCase().includes(q);
        const matchFolder = file.folderName?.toLowerCase().includes(q);
        if (!matchName && !matchFolder) return false;
      }

      // Folder filter
      if (selectedFolderId) {
        const targetFolder = folders.find((f) => f.id === selectedFolderId);
        if (targetFolder && file.folderName !== targetFolder.name) return false;
      }

      // Category
      if (selectedCategory === 'starred') return file.isStarred;
      if (selectedCategory === 'media') return file.fileType === 'IMAGE' || file.fileType === 'VIDEO';
      if (selectedCategory === 'documents') return file.fileType === 'DOCUMENT' || file.fileType === 'SPREADSHEET' || file.fileType === 'FIGMA';

      return true;
    });
  }, [files, searchQuery, selectedCategory, selectedFolderId, folders]);

  // File type icon renderer
  const renderFileIcon = (type: StorageFileType, className = 'w-6 h-6') => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className={clsx(className, 'text-blue-500')} />;
      case 'VIDEO':
        return <Video className={clsx(className, 'text-purple-500')} />;
      case 'DOCUMENT':
        return <FileText className={clsx(className, 'text-emerald-500')} />;
      case 'SPREADSHEET':
        return <Table className={clsx(className, 'text-green-600')} />;
      case 'AUDIO':
        return <Music className={clsx(className, 'text-amber-500')} />;
      case 'FIGMA':
        return <Layers className={clsx(className, 'text-pink-500')} />;
      case 'ARCHIVE':
      default:
        return <Archive className={clsx(className, 'text-indigo-500')} />;
    }
  };

  // Toggle Star
  const handleToggleStar = (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const next = !f.isStarred;
          toast.success(next ? `Đã gắn sao tệp ${f.name}` : `Đã bỏ gắn sao tệp ${f.name}`);
          return { ...f, isStarred: next };
        }
        return f;
      })
    );
  };

  // Delete file
  const handleDeleteFile = (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success(t('storage.deleteSuccess'));
    if (activePreviewFile?.id === fileId) {
      setActivePreviewFile(null);
    }
  };

  // Download simulation
  const handleDownloadFile = (file: StorageFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast.success(`${t('storage.downloadStarted')} (${file.name})`);
  };

  // Create folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: StorageFolder = {
      id: `f-${Date.now()}`,
      name: newFolderName.trim(),
      color: selectedColor,
      filesCount: 0,
      totalSize: '0 KB',
      updatedAt: 'Vừa tạo',
    };

    setFolders([newFolder, ...folders]);
    setNewFolderName('');
    setShowCreateFolderModal(false);
    toast.success(`Đã tạo thư mục "${newFolder.name}" thành công!`);
  };

  // Upload file simulation
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Đang tải lên ${file.name}...`);

    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'dat';
      let fType: StorageFileType = 'DOCUMENT';
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) fType = 'IMAGE';
      else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) fType = 'VIDEO';
      else if (['mp3', 'wav', 'aac'].includes(ext)) fType = 'AUDIO';
      else if (['zip', 'rar', 'tar', '7z'].includes(ext)) fType = 'ARCHIVE';
      else if (['fig'].includes(ext)) fType = 'FIGMA';
      else if (['xlsx', 'csv'].includes(ext)) fType = 'SPREADSHEET';

      const uploaded: StorageFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        extension: ext,
        fileType: fType,
        size: file.size,
        formattedSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        updatedAt: 'Vừa xong',
        isStarred: false,
        owner: {
          name: 'Bạn (Me)',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        },
      };

      setFiles([uploaded, ...files]);
      setIsUploading(false);
      toast.dismiss(toastId);
      toast.success(t('storage.uploadSuccess'));
    }, 1200);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Storage Quota Banner */}
      <div className="bg-gradient-to-r from-[#003A9F] to-[#0066FF] dark:from-[#081B4B] dark:to-[#0D3B8E] rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-blue-400/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('storage.title')}</h1>
              <p className="text-xs text-blue-100">{t('storage.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#003A9F] hover:bg-blue-50 rounded-2xl text-xs font-bold shadow-md cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>{t('storage.uploadFile')}</span>
              <input
                type="file"
                className="hidden"
                onChange={handleSimulateUpload}
                disabled={isUploading}
              />
            </label>
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{t('storage.newFolder')}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Breakdown */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span>
              {metrics.usedFormatted} / {metrics.totalFormatted} ({metrics.percentage}% đã dùng)
            </span>
            <button
              onClick={() => toast.success('Gói 50GB đang hoạt động. Nâng cấp lên 1TB sắp ra mắt!')}
              className="text-xs text-yellow-300 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('storage.upgradePlan')}
            </button>
          </div>

          {/* Multi-color segment bar */}
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${metrics.breakdown.images.percentage}%` }}
              className="bg-sky-400 h-full"
              title={`Ảnh: ${metrics.breakdown.images.sizeFormatted}`}
            />
            <div
              style={{ width: `${metrics.breakdown.videos.percentage}%` }}
              className="bg-purple-400 h-full"
              title={`Video: ${metrics.breakdown.videos.sizeFormatted}`}
            />
            <div
              style={{ width: `${metrics.breakdown.documents.percentage}%` }}
              className="bg-emerald-400 h-full"
              title={`Tài liệu: ${metrics.breakdown.documents.sizeFormatted}`}
            />
            <div
              style={{ width: `${metrics.breakdown.audio.percentage}%` }}
              className="bg-amber-400 h-full"
              title={`Âm thanh: ${metrics.breakdown.audio.sizeFormatted}`}
            />
          </div>

          {/* Legends */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-blue-100 mt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Ảnh ({metrics.breakdown.images.sizeFormatted})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Video ({metrics.breakdown.videos.sizeFormatted})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Tài liệu ({metrics.breakdown.documents.sizeFormatted})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Âm thanh ({metrics.breakdown.audio.sizeFormatted})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 border border-gray-100 dark:border-[#262626] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('storage.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6] transition"
          />
        </div>

        {/* View Switch */}
        <div className="flex items-center gap-1 self-end sm:self-center">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-xl transition cursor-pointer',
              viewMode === 'grid'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            )}
            title={t('storage.viewGrid')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-xl transition cursor-pointer',
              viewMode === 'list'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            )}
            title={t('storage.viewList')}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {(
          [
            { key: 'all', label: t('storage.categories.all') },
            { key: 'media', label: t('storage.categories.media') },
            { key: 'documents', label: t('storage.categories.documents') },
            { key: 'starred', label: t('storage.categories.starred') },
          ] as const
        ).map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={clsx(
                'px-4 py-2 rounded-2xl whitespace-nowrap transition cursor-pointer shadow-xs border',
                isActive
                  ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white border-transparent'
                  : 'bg-white dark:bg-[#121212] text-gray-700 dark:text-[#D4D4D4] border-gray-200/70 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. Folders Horizontal Cards */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider">
            {t('storage.foldersHeading')} ({folders.length})
          </h2>
          {selectedFolderId && (
            <button
              onClick={() => setSelectedFolderId(null)}
              className="text-xs text-[#004AC6] dark:text-[#0095F6] hover:underline font-semibold cursor-pointer"
            >
              Xem tất cả thư mục
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                className={clsx(
                  'p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group',
                  isSelected
                    ? 'border-[#004AC6] dark:border-[#0095F6] bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                    : 'border-gray-100 dark:border-[#262626] bg-gray-50/60 dark:bg-[#1A1A1A] hover:bg-white dark:hover:bg-[#202020] hover:shadow-xs'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs',
                      folder.color
                    )}
                  >
                    <Folder className="w-4 h-4 fill-white" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">{folder.totalSize}</span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate mb-0.5">
                    {folder.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-[#737373]">
                    {folder.filesCount} tệp
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Files Grid / List View */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider">
            {t('storage.filesHeading')} ({filteredFiles.length})
          </h2>
          <span className="text-xs text-gray-400">Nhấp vào tệp để xem chi tiết</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 flex items-center justify-center mx-auto mb-2">
              <HardDrive className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-[#D4D4D4]">
              {t('storage.emptyFiles')}
            </p>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
              {t('storage.emptyFilesDesc')}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setActivePreviewFile(file)}
                className="group relative bg-gray-50/70 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#262626] rounded-2xl p-3 flex flex-col justify-between hover:shadow-md hover:border-gray-200 dark:hover:border-[#363636] transition cursor-pointer"
              >
                {/* Preview Thumbnail or Icon Container */}
                <div className="w-full aspect-video bg-gray-200/60 dark:bg-[#262626] rounded-xl overflow-hidden mb-2.5 flex items-center justify-center relative">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    renderFileIcon(file.fileType, 'w-8 h-8')
                  )}

                  {/* Star Top-Right */}
                  <button
                    onClick={(e) => handleToggleStar(file.id, e)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition"
                  >
                    <Star
                      className={clsx(
                        'w-3.5 h-3.5',
                        file.isStarred ? 'fill-amber-400 text-amber-400' : 'text-white'
                      )}
                    />
                  </button>
                </div>

                {/* File info */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-[#A8A8A8]">
                    <span>{file.formattedSize}</span>
                    <span>{file.updatedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262626] text-gray-400 text-[11px]">
                  <th className="pb-2 font-semibold">{t('storage.fileName')}</th>
                  <th className="pb-2 font-semibold">{t('storage.fileSize')}</th>
                  <th className="pb-2 font-semibold">{t('storage.lastModified')}</th>
                  <th className="pb-2 font-semibold text-right">{t('storage.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262626]">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => setActivePreviewFile(file)}
                    className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer group"
                  >
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2.5">
                        {renderFileIcon(file.fileType, 'w-5 h-5 shrink-0')}
                        <span className="font-bold text-gray-900 dark:text-[#F5F5F5] truncate max-w-[200px] sm:max-w-[300px]">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-[#A8A8A8]">{file.formattedSize}</td>
                    <td className="py-3 text-gray-500 dark:text-[#A8A8A8]">{file.updatedAt}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleStar(file.id, e)}
                          className="p-1.5 text-gray-400 hover:text-amber-400 transition"
                        >
                          <Star
                            className={clsx(
                              'w-4 h-4',
                              file.isStarred ? 'fill-amber-400 text-amber-400' : ''
                            )}
                          />
                        </button>
                        <button
                          onClick={(e) => handleDownloadFile(file, e)}
                          className="p-1.5 text-gray-400 hover:text-[#004AC6] transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(file.id, e)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. Create Folder Modal */}
      {showCreateFolderModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCreateFolderModal(false)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-sm w-full p-5 border border-gray-100 dark:border-[#262626] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5]">
                {t('storage.createFolderModalTitle')}
              </h3>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1.5">
                  Tên thư mục
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={t('storage.folderNamePlaceholder')}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs text-gray-900 dark:text-[#F5F5F5] outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6]"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1.5">
                  Màu sắc đại diện
                </label>
                <div className="flex items-center gap-2">
                  {['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'].map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={clsx(
                          'w-7 h-7 rounded-full transition cursor-pointer border-2',
                          col,
                          selectedColor === col ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        )}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. File Preview Modal */}
      {activePreviewFile && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePreviewFile(null)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-md w-full p-5 border border-gray-100 dark:border-[#262626] shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#262626]">
              <div className="flex items-center gap-2 truncate">
                {renderFileIcon(activePreviewFile.fileType, 'w-5 h-5 shrink-0')}
                <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5] truncate">
                  {activePreviewFile.name}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewFile(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Image / Icon Display */}
            <div className="w-full h-48 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center overflow-hidden">
              {activePreviewFile.previewUrl ? (
                <img
                  src={activePreviewFile.previewUrl}
                  alt={activePreviewFile.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  {renderFileIcon(activePreviewFile.fileType, 'w-12 h-12 mx-auto mb-2')}
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Tệp {activePreviewFile.extension}
                  </span>
                </div>
              )}
            </div>

            {/* Metadata list */}
            <div className="bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('storage.fileSize')}:</span>
                <span className="font-bold text-gray-900 dark:text-[#F5F5F5]">
                  {activePreviewFile.formattedSize}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('storage.lastModified')}:</span>
                <span className="font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {activePreviewFile.updatedAt}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chủ sở hữu:</span>
                <span className="font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {activePreviewFile.owner.name}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDeleteFile(activePreviewFile.id)}
                className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('storage.delete')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                    toast.success('Đã sao chép liên kết chia sẻ tệp');
                  }}
                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 cursor-pointer"
                  title="Chia sẻ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadFile(activePreviewFile)}
                  className="px-4 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('storage.download')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoragePage;
