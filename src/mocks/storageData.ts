export interface StorageFolder {
  id: string;
  name: string;
  color: string;
  filesCount: number;
  totalSize: string;
  updatedAt: string;
}

export type StorageFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'ARCHIVE' | 'FIGMA' | 'SPREADSHEET';

export interface StorageFile {
  id: string;
  name: string;
  extension: string;
  fileType: StorageFileType;
  size: number;
  formattedSize: string;
  folderId?: string;
  folderName?: string;
  previewUrl?: string;
  updatedAt: string;
  isStarred?: boolean;
  isShared?: boolean;
  owner: {
    name: string;
    avatarUrl: string;
  };
}

export interface StorageMetrics {
  usedBytes: number;
  totalBytes: number;
  usedFormatted: string;
  totalFormatted: string;
  percentage: number;
  breakdown: {
    images: { sizeFormatted: string; percentage: number };
    videos: { sizeFormatted: string; percentage: number };
    documents: { sizeFormatted: string; percentage: number };
    audio: { sizeFormatted: string; percentage: number };
    archives: { sizeFormatted: string; percentage: number };
  };
}

export const INITIAL_STORAGE_METRICS: StorageMetrics = {
  usedBytes: 19756849152, // 18.4 GB
  totalBytes: 53687091200, // 50.0 GB
  usedFormatted: '18.4 GB',
  totalFormatted: '50 GB',
  percentage: 36.8,
  breakdown: {
    images: { sizeFormatted: '8.2 GB', percentage: 44.5 },
    videos: { sizeFormatted: '5.1 GB', percentage: 27.7 },
    documents: { sizeFormatted: '3.4 GB', percentage: 18.5 },
    audio: { sizeFormatted: '1.2 GB', percentage: 6.5 },
    archives: { sizeFormatted: '0.5 GB', percentage: 2.8 },
  },
};

export const INITIAL_STORAGE_FOLDERS: StorageFolder[] = [
  {
    id: 'f-1',
    name: 'Dự án RySocial 2026',
    color: 'bg-blue-500',
    filesCount: 38,
    totalSize: '4.8 GB',
    updatedAt: 'Hôm nay lúc 14:10',
  },
  {
    id: 'f-2',
    name: 'Ảnh sự kiện & Kỷ niệm',
    color: 'bg-emerald-500',
    filesCount: 114,
    totalSize: '6.2 GB',
    updatedAt: 'Hôm qua',
  },
  {
    id: 'f-3',
    name: 'Tài liệu & Hợp đồng đối tác',
    color: 'bg-amber-500',
    filesCount: 16,
    totalSize: '1.4 GB',
    updatedAt: '3 ngày trước',
  },
  {
    id: 'f-4',
    name: 'UI/UX Design Tokens & Figmas',
    color: 'bg-purple-500',
    filesCount: 42,
    totalSize: '2.9 GB',
    updatedAt: '5 ngày trước',
  },
  {
    id: 'f-5',
    name: 'Video Clip & Livestream Backups',
    color: 'bg-rose-500',
    filesCount: 8,
    totalSize: '3.1 GB',
    updatedAt: '1 tuần trước',
  },
];

export const INITIAL_STORAGE_FILES: StorageFile[] = [
  {
    id: 'file-1',
    name: 'Design-System-RySocial-v2.4.fig',
    extension: 'fig',
    fileType: 'FIGMA',
    size: 28400000,
    formattedSize: '28.4 MB',
    folderName: 'UI/UX Design Tokens & Figmas',
    updatedAt: '14:20 hôm nay',
    isStarred: true,
    isShared: true,
    owner: {
      name: 'Sarah Nguyen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-2',
    name: 'Bao-cao-tai-chinh-Q3-2026.pdf',
    extension: 'pdf',
    fileType: 'DOCUMENT',
    size: 4200000,
    formattedSize: '4.2 MB',
    folderName: 'Tài liệu & Hợp đồng đối tác',
    updatedAt: 'Hôm qua',
    isStarred: true,
    owner: {
      name: 'Bạn (Me)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-3',
    name: 'Hero-Banner-4K-DarkTheme.png',
    extension: 'png',
    fileType: 'IMAGE',
    size: 5800000,
    formattedSize: '5.8 MB',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    folderName: 'Dự án RySocial 2026',
    updatedAt: '2 ngày trước',
    isStarred: false,
    owner: {
      name: 'Alex Nguyen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-4',
    name: 'Demo-RySocial-Feature-Tour.mp4',
    extension: 'mp4',
    fileType: 'VIDEO',
    size: 52400000,
    formattedSize: '52.4 MB',
    previewUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    folderName: 'Video Clip & Livestream Backups',
    updatedAt: '3 ngày trước',
    isStarred: true,
    owner: {
      name: 'David Tran',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-5',
    name: 'Sprint-Planning-Backlog-2026.xlsx',
    extension: 'xlsx',
    fileType: 'SPREADSHEET',
    size: 1400000,
    formattedSize: '1.4 MB',
    folderName: 'Dự án RySocial 2026',
    updatedAt: '4 ngày trước',
    isStarred: false,
    owner: {
      name: 'Quốc Bảo',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-6',
    name: 'Audio-Podcast-EP12-TechReview.mp3',
    extension: 'mp3',
    fileType: 'AUDIO',
    size: 16800000,
    formattedSize: '16.8 MB',
    updatedAt: '5 ngày trước',
    isStarred: false,
    owner: {
      name: 'David Tran',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-7',
    name: 'Source-Release-v2.0-Production.zip',
    extension: 'zip',
    fileType: 'ARCHIVE',
    size: 98500000,
    formattedSize: '98.5 MB',
    folderName: 'Dự án RySocial 2026',
    updatedAt: '1 tuần trước',
    isStarred: false,
    owner: {
      name: 'Bạn (Me)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'file-8',
    name: 'Da-Nang-Sunset-GoldenHour.jpg',
    extension: 'jpg',
    fileType: 'IMAGE',
    size: 6700000,
    formattedSize: '6.7 MB',
    previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    folderName: 'Ảnh sự kiện & Kỷ niệm',
    updatedAt: '1 tuần trước',
    isStarred: true,
    owner: {
      name: 'Thu Hà',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  },
];
