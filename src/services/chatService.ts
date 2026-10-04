import axios from 'axios';
import { refreshAccessToken } from '../lib/axios';
import type {
  ConversationResponse,
  ConversationDetailResponse,
  MessageResponse,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  MarkReadRequest,
  AddMemberRequest,
  PrepareAttachmentRequest,
  PrepareAttachmentResponse,
  MediaType,
} from '../types/chat';

const CHAT_REST_BASE_URL = import.meta.env.VITE_CHAT_REST_URL || '';

export const chatApi = axios.create({
  baseURL: CHAT_REST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT access token to every request
chatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh token on 401
chatApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return chatApi(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const chatService = {
  /**
   * Lấy danh sách cuộc trò chuyện của tôi
   * GET /api/v1/conversations
   */
  async getConversations(params?: { limit?: number; offset?: number }): Promise<ConversationResponse[]> {
    const response = await chatApi.get<ConversationResponse[]>('/api/v1/conversations', {
      params: {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      },
    });
    return response.data || [];
  },

  /**
   * Tạo hội thoại mới (DM hoặc GROUP)
   * POST /api/v1/conversations
   */
  async createConversation(data: CreateConversationRequest): Promise<ConversationResponse> {
    const response = await chatApi.post<ConversationResponse>('/api/v1/conversations', data);
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết hội thoại
   * GET /api/v1/conversations/{id}
   */
  async getConversation(id: string): Promise<ConversationDetailResponse> {
    const response = await chatApi.get<ConversationDetailResponse>(`/api/v1/conversations/${id}`);
    return response.data;
  },

  /**
   * Tải lịch sử tin nhắn / Sync tin
   * GET /api/v1/conversations/{id}/messages
   */
  async getMessages(
    conversationId: string,
    params?: { before_seq?: number; after_seq?: number; limit?: number }
  ): Promise<MessageResponse[]> {
    const query: Record<string, number> = {
      limit: params?.limit ?? 50,
    };
    if (params?.before_seq !== undefined && params.before_seq > 0) {
      query.before_seq = params.before_seq;
    }
    if (params?.after_seq !== undefined && params.after_seq >= 0) {
      query.after_seq = params.after_seq;
    }

    const response = await chatApi.get<MessageResponse[]>(
      `/api/v1/conversations/${conversationId}/messages`,
      { params: query }
    );
    return response.data || [];
  },

  /**
   * Gửi tin nhắn mới qua REST (Fallback khi WebSocket chưa kết nối)
   * POST /api/v1/conversations/{id}/messages
   */
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<MessageResponse> {
    const response = await chatApi.post<MessageResponse>(
      `/api/v1/conversations/${conversationId}/messages`,
      data
    );
    return response.data;
  },

  /**
   * Chỉnh sửa nội dung tin nhắn
   * PATCH /api/v1/messages/{id}
   */
  async editMessage(messageId: number, body: string): Promise<MessageResponse> {
    const payload: EditMessageRequest = { body };
    const response = await chatApi.patch<MessageResponse>(`/api/v1/messages/${messageId}`, payload);
    return response.data;
  },

  /**
   * Thu hồi tin nhắn (Soft Delete)
   * DELETE /api/v1/messages/{id}
   */
  async deleteMessage(messageId: number): Promise<void> {
    await chatApi.delete(`/api/v1/messages/${messageId}`);
  },

  /**
   * Đánh dấu đã đọc tới vị trí seq
   * PUT /api/v1/conversations/{id}/read
   */
  async markRead(conversationId: string, seq: number): Promise<{ last_read_seq: number }> {
    const payload: MarkReadRequest = { seq };
    const response = await chatApi.put<{ last_read_seq: number }>(
      `/api/v1/conversations/${conversationId}/read`,
      payload
    );
    return response.data;
  },

  /**
   * Xóa lịch sử trò chuyện phía tôi
   * POST /api/v1/conversations/{id}/clear
   */
  async clearHistory(conversationId: string): Promise<void> {
    await chatApi.post(`/api/v1/conversations/${conversationId}/clear`);
  },

  /**
   * Thêm thành viên vào nhóm (GROUP)
   * POST /api/v1/conversations/{id}/members
   */
  async addMember(conversationId: string, data: AddMemberRequest): Promise<void> {
    await chatApi.post(`/api/v1/conversations/${conversationId}/members`, data);
  },

  /**
   * Xóa thành viên / Tự rời nhóm
   * DELETE /api/v1/conversations/{id}/members/{userId}
   */
  async removeMember(conversationId: string, userId: string): Promise<void> {
    await chatApi.delete(`/api/v1/conversations/${conversationId}/members/${userId}`);
  },

  /**
   * Bước 1: Xin Presigned URL để upload file trực tiếp lên MinIO/S3
   * POST /api/v1/attachments/prepare
   */
  async prepareAttachment(data: PrepareAttachmentRequest): Promise<PrepareAttachmentResponse> {
    const response = await chatApi.post<PrepareAttachmentResponse>(
      '/api/v1/attachments/prepare',
      data
    );
    return response.data;
  },

  /**
   * Bước 2: Upload Binary trực tiếp lên MinIO/S3 bằng Presigned PUT URL
   * KHÔNG đính kèm header Authorization
   */
  async uploadAttachmentDirect(
    presignedUrl: string,
    file: File | Blob,
    contentType: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    let targetUrl = presignedUrl;
    if (typeof window !== 'undefined') {
      targetUrl = targetUrl.replace(/^https?:\/\/(minio|host\.docker\.internal|localhost|127\.0\.0\.1):9000/, window.location.origin);
    }
    // Dùng axios instance riêng không có default Authorization interceptor
    await axios.put(targetUrl, file, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * Helper quy trình hoàn chỉnh: Prepare -> Direct Upload -> Trả về metadata đính kèm
   */
  async uploadChatAttachment(
    conversationId: string,
    file: File | Blob,
    customFileName?: string,
    onProgress?: (percent: number) => void
  ): Promise<{
    id: string;
    objectKey: string;
    mediaUrl: string;
    mediaType: MediaType;
    fileName: string;
    fileSize: number;
  }> {
    const fileName =
      customFileName ||
      (file instanceof File ? file.name : `attachment_${Date.now()}`);
    const fileSize = file.size;
    const contentType = file.type || 'application/octet-stream';

    // 1. Determine media type
    let mediaType: MediaType = 'FILE';
    if (contentType.startsWith('image/')) {
      mediaType = 'IMAGE';
    } else if (contentType.startsWith('video/')) {
      mediaType = 'VIDEO';
    } else if (contentType.startsWith('audio/')) {
      mediaType = 'AUDIO';
    }

    // 2. Prepare Presigned URL
    const prep = await this.prepareAttachment({
      conversation_id: conversationId,
      file_name: fileName,
      file_size: fileSize,
      content_type: contentType,
    });

    // 3. Direct Binary PUT Upload to MinIO/S3
    await this.uploadAttachmentDirect(prep.presigned_url, file, contentType, onProgress);

    // Object key format standard in Go Switchboard
    const objectKey = `chat/attachments/${conversationId}/${prep.id}`;
    // Strip query parameters from presigned url and replace internal minio docker domains to get public media url
    let baseMediaUrl = prep.presigned_url.split('?')[0];
    if (typeof window !== 'undefined') {
      baseMediaUrl = baseMediaUrl.replace(/^https?:\/\/(minio|host\.docker\.internal|localhost|127\.0\.0\.1):9000/, '');
    }
    const cleanMediaUrl = `${baseMediaUrl}?type=${mediaType}&name=${encodeURIComponent(fileName)}`;

    return {
      id: prep.id,
      objectKey,
      mediaUrl: cleanMediaUrl,
      mediaType,
      fileName,
      fileSize,
    };
  },
};

export interface SharedMediaItem extends MessageResponse { media_type: MediaType; media_url: string; file_name: string; file_size: number }
export async function getSharedMedia(conversationId: string, category: 'media' | 'files', cursor = 0) {
  return (await chatApi.get<{ items: SharedMediaItem[]; next_cursor: number }>(`/api/v1/conversations/${conversationId}/media`, { params: { category, cursor, limit: 30 } })).data;
}

export default chatService;
