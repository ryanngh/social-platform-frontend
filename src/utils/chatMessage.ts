import type { ChatMessage, MediaType, MessageResponse } from '../types/chat';
import { getMediaUrl } from './media';

export const inferMediaTypeAndUrl = (body?: string) => {
  if (!body) return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: '', fileName: undefined };
  const trimmed = body.trim();
  if (!trimmed) return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: '', fileName: undefined };

  // Check if body starts with a media URL or contains a media URL on the first line with caption after
  const newlineIdx = trimmed.indexOf('\n');
  const firstLine = newlineIdx !== -1 ? trimmed.slice(0, newlineIdx).trim() : trimmed;
  const caption = newlineIdx !== -1 ? trimmed.slice(newlineIdx + 1).trim() : '';

  const isUrlLike =
    firstLine.startsWith('http://') ||
    firstLine.startsWith('https://') ||
    firstLine.startsWith('blob:') ||
    firstLine.startsWith('/social-media/') ||
    firstLine.startsWith('chat/attachments/');

  if (isUrlLike) {
    const resolvedUrl = getMediaUrl(firstLine);
    const cleanUrl = firstLine.split('?')[0].toLowerCase();

    // 1. Inspect query parameters if present (e.g., ?type=IMAGE&name=foo.jpg)
    let explicitType: MediaType | null = null;
    let explicitName: string | null = null;
    if (firstLine.includes('?')) {
      try {
        const queryStr = firstLine.split('?')[1];
        const params = new URLSearchParams(queryStr);
        const tParam = params.get('type')?.toUpperCase();
        if (tParam === 'IMAGE' || tParam === 'VIDEO' || tParam === 'AUDIO' || tParam === 'FILE') {
          explicitType = tParam as MediaType;
        }
        const nParam = params.get('name');
        if (nParam) {
          explicitName = decodeURIComponent(nParam);
        }
      } catch { /* Malformed optional URL metadata falls back to file inference. */ }
    }

    if (explicitType) {
      return {
        mediaType: explicitType,
        mediaUrl: resolvedUrl,
        cleanBody: caption,
        fileName: explicitName || (explicitType === 'FILE' ? 'attachment' : undefined),
      };
    }

    // 2. Infer by filename extension if explicitName exists or from cleanUrl
    const testString = explicitName ? explicitName.toLowerCase() : cleanUrl;

    if (
      testString.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|jfif|pjpeg|pjp|avif)$/i) ||
      cleanUrl.includes('/images/')
    ) {
      return { mediaType: 'IMAGE' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(mp4|webm|mov|mkv|ogg|avi|wmv|3gp|flv)$/i) ||
      cleanUrl.includes('/videos/')
    ) {
      return { mediaType: 'VIDEO' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(mp3|wav|ogg|m4a|aac|weba|flac|wma)$/i) ||
      cleanUrl.includes('/audios/') ||
      cleanUrl.includes('voice_')
    ) {
      return { mediaType: 'AUDIO' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|txt|csv|json|xml|html|js|ts)$/i) ||
      cleanUrl.includes('chat/attachments/')
    ) {
      const urlSegments = cleanUrl.split('/');
      const rawName = urlSegments[urlSegments.length - 1] || 'attachment';
      const extractedFileName = explicitName || decodeURIComponent(rawName);
      return {
        mediaType: 'FILE' as MediaType,
        mediaUrl: resolvedUrl,
        cleanBody: caption,
        fileName: extractedFileName,
      };
    }
  }

  return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: body, fileName: undefined };
};

export const formatChatMessage = (m: Partial<MessageResponse> & Pick<MessageResponse, 'conversation_id' | 'sender_id' | 'body' | 'created_at'>, currentUserId: string): ChatMessage => {
  const mediaInfo = inferMediaTypeAndUrl(m.body);
  return {
    kind: m.kind, call: m.call,
    id: m.id,
    conversationId: m.conversation_id,
    seq: m.seq,
    senderId: m.sender_id,
    clientMsgId: m.client_msg_id || `srv-${m.id || m.seq}`,
    body: mediaInfo.cleanBody,
    replyToId: m.reply_to_id,
    createdAt: m.created_at,
    editedAt: m.edited_at,
    isDeleted: m.is_deleted || false,
    status: 'SENT',
    isMine: m.sender_id === currentUserId,
    mediaType: mediaInfo.mediaType,
    mediaUrl: mediaInfo.mediaUrl,
    fileName: mediaInfo.fileName,
  };
};

