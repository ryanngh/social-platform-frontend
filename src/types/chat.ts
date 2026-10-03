/**
 * Chat MVP TypeScript Definitions
 * Compatible with Go Switchboard & Spring Boot HQ Module Chat MVP
 */

import type { UserSummary } from './index';

// ==========================================
// REST REQUEST TYPES
// ==========================================

export type ConversationType = 'DM' | 'GROUP';

export interface CreateConversationRequest {
  type: ConversationType;
  member_ids: string[];
  title?: string | null;
}

export interface SendMessageRequest {
  client_msg_id: string;
  body: string;
  reply_to_id?: number | null;
}

export interface EditMessageRequest {
  body: string;
}

export interface MarkReadRequest {
  seq: number;
}

export interface AddMemberRequest {
  user_id: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface PrepareAttachmentRequest {
  conversation_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
}

export interface PrepareAttachmentResponse {
  id: string;
  presigned_url: string;
}

// ==========================================
// REST RESPONSE TYPES
// ==========================================

export interface ConversationResponse {
  last_message?: MessageResponse;
  id: string;
  type: ConversationType;
  dm_key?: string | null;
  title?: string | null;
  created_by: string;
  created_at: string;
  last_seq: number;
  last_message_at?: string | null;
  unread_seq_distance: number;
  last_read_seq: number;
  cleared_before_seq: number;
}

export interface MessageResponse {
  kind?: 'TEXT' | 'CALL';
  call?: import('./call').CallSummary;
  id: number;
  conversation_id: string;
  seq: number;
  sender_id: string;
  client_msg_id: string;
  body: string;
  reply_to_id?: number | null;
  created_at: string;
  edited_at?: string | null;
  is_deleted: boolean;
}

export interface ConversationMemberResponse {
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joined_at: string;
  user?: UserSummary;
}

export interface ConversationDetailResponse extends ConversationResponse {
  members?: ConversationMemberResponse[];
}

// ==========================================
// WEBSOCKET FRAME CONTRACTS
// ==========================================

export type WSClientFrame = import('./call').CallClientFrame
  | {
      type: 'message.send';
      payload: {
        conversation_id: string;
        client_msg_id: string;
        body: string;
        reply_to_id?: number | null;
      };
    }
  | {
      type: 'message.read';
      payload: {
        conversation_id: string;
        seq: number;
      };
    }
  | {
      type: 'message.sync';
      payload: {
        conversation_id: string;
        after_seq: number;
      };
    }
  | {
      type: 'typing.start';
      payload: {
        conversation_id: string;
      };
    }
  | {
      type: 'ping';
    }
  | {
      type: 'presence.heartbeat';
      payload?: Record<string, unknown>;
    }
  | {
      type: 'presence.subscribe';
      payload: {
        user_ids: string[];
      };
    };

export type WSServerFrame = import('./call').CallServerFrame
  | {
      type: 'message.ack';
      payload: {
        client_msg_id: string;
        id: number;
        seq: number;
        created_at: string;
      };
    }
  | {
      type: 'message.new';
      payload: {
        id: number;
        conversation_id: string;
        seq: number;
        sender_id: string;
        client_msg_id?: string;
        kind?: 'TEXT' | 'CALL';
        call?: import('./call').CallSummary;
        body: string;
        reply_to_id?: number | null;
        created_at: string;
      };
    }
  | {
      type: 'message.sync_res';
      payload: {
        conversation_id: string;
        messages: MessageResponse[];
      };
    }
  | {
      type: 'read.updated';
      payload: {
        conversation_id: string;
        user_id: string;
        last_read_seq: number;
      };
    }
  | {
      type: 'message.updated';
      payload: {
        id: number;
        conversation_id: string;
        seq: number;
        body: string;
        edited_at: string;
      };
    }
  | {
      type: 'message.deleted';
      payload: {
        id: number;
        conversation_id: string;
        seq: number;
        deleted_at: string;
      };
    }
  | {
      type: 'typing';
      payload: {
        conversation_id: string;
        user_id: string;
      };
    }
  | {
      type: 'error';
      payload: {
        code: string;
        message: string;
        client_msg_id?: string;
      };
    }
  | {
      type: 'pong';
    }
  | {
      type: 'presence.snapshot';
      payload: {
        statuses: Record<string, boolean>;
      };
    }
  | {
      type: 'presence.update';
      payload: {
        user_id: string;
        is_online: boolean;
        last_active?: string;
      };
    }
  | {
      type: 'conversation.new';
      payload: {
        id: string;
        type: ConversationType;
        created_by: string;
      };
    };

// ==========================================
// CLIENT-SIDE ENRICHED TYPES
// ==========================================

export type MessageStatus = 'SENDING' | 'SENT' | 'FAILED';
export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  kind?: 'TEXT' | 'CALL';
  call?: import('./call').CallSummary;
  id?: number;
  conversationId: string;
  seq?: number;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  clientMsgId: string;
  body: string;
  replyToId?: number | null;
  replyToMessage?: {
    id: number;
    senderName: string;
    body: string;
  } | null;
  createdAt: string;
  editedAt?: string | null;
  isDeleted: boolean;
  status: MessageStatus;
  isMine: boolean;
  mediaType?: MediaType;
  mediaUrl?: string;
  attachmentId?: string;
  fileName?: string;
  fileSize?: number;
  audioDuration?: string;
  uploadProgress?: number;
  reactions?: ChatReaction[];
}

export interface ChatMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isOnline?: boolean;
  joinedAt?: string;
}

export interface ChatConversationItem {
  id: string;
  type: ConversationType;
  dmKey?: string | null;
  title?: string | null;
  createdBy: string;
  createdAt: string;
  lastSeq: number;
  lastMessageAt?: string | null;
  unreadSeqDistance: number;
  lastReadSeq: number;
  clearedBeforeSeq: number;
  
  // UI Enriched fields
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastActiveText?: string;
  partner?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isOnline?: boolean;
    lastActive?: string;
  };
  members?: ChatMember[];
  lastMessagePreview?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    isRead: boolean;
  };
  isPinned?: boolean;
  isMuted?: boolean;
}

export type WSConnectionState = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
