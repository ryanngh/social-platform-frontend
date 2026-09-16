import api from '../lib/axios';
import axios from 'axios';
import type { PostMediaRequest } from '../types';

export interface PresignFileItem {
  fileName: string;
  contentType: string;
}

export interface PresignBatchRequest {
  folder: 'POSTS' | 'COMMENTS' | 'MESSAGES';
  files: PresignFileItem[];
}

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
}

export interface PresignBatchResponse {
  uploads: PresignResponse[];
}

export const mediaService = {
  /**
   * Yêu cầu Presigned URL cho 1 file duy nhất
   */
  async getPresignedUrl(
    fileName: string,
    contentType: string,
    folder: 'POSTS' | 'COMMENTS' | 'MESSAGES' = 'POSTS'
  ): Promise<PresignResponse> {
    const response = await api.post<PresignResponse>('/media/presign', {
      fileName,
      contentType,
      folder,
    });
    return response.data;
  },

  /**
   * Yêu cầu Presigned URLs cho nhiều file cùng lúc (batch)
   */
  async getPresignedBatch(
    files: PresignFileItem[],
    folder: 'POSTS' | 'COMMENTS' | 'MESSAGES' = 'POSTS'
  ): Promise<PresignBatchResponse> {
    const response = await api.post<PresignBatchResponse>('/media/presign/batch', {
      folder,
      files,
    });
    return response.data;
  },

  /**
   * Upload trực tiếp file binary lên MinIO thông qua Presigned PUT URL.
   * Dùng axios riêng (không mang Authorization Bearer header) vì S3 Presigned URL đã có credentials.
   */
  async uploadDirectToStorage(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * Upload nhiều file đính kèm cho bài viết và trả về danh sách PostMediaRequest
   */
  async uploadPostMediaBatch(
    files: File[],
    folder: 'POSTS' | 'COMMENTS' | 'MESSAGES' = 'POSTS',
    onProgressItem?: (index: number, progress: number) => void
  ): Promise<PostMediaRequest[]> {
    if (files.length === 0) return [];

    const fileItems: PresignFileItem[] = files.map((file) => ({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }));

    // 1. Lấy danh sách presigned PUT URLs từ MediaController
    const { uploads } = await this.getPresignedBatch(fileItems, folder);

    // 2. Upload song song tất cả các file trực tiếp lên MinIO
    const uploadTasks = files.map(async (file, idx) => {
      const presign = uploads[idx];
      await this.uploadDirectToStorage(presign.uploadUrl, file, (percent) => {
        onProgressItem?.(idx, percent);
      });

      const isVideo = file.type.startsWith('video/');
      const mediaItem: PostMediaRequest = {
        mediaUrl: presign.publicUrl, // objectKey: "posts/{userId}/{uuid}.ext"
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        thumbnailUrl: null,
      };
      return mediaItem;
    });

    return Promise.all(uploadTasks);
  },
};
