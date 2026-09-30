export interface ChatContact {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  lastActive?: string;
  isVerified?: boolean;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  mediaType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE';
  mediaUrl?: string;
  audioDuration?: string;
  fileName?: string;
  fileSize?: string;
  reactions?: ChatReaction[];
  timestamp: string;
  isMine: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  isGroup: boolean;
  name: string;
  avatarUrl: string;
  membersCount?: number;
  unreadCount: number;
  isOnline?: boolean;
  lastActive?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  partner?: ChatContact;
  lastMessage: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    isRead: boolean;
  };
  messages: ChatMessageItem[];
}

export const INITIAL_ACTIVE_CONTACTS: ChatContact[] = [
  {
    id: 'user-alex',
    name: 'Alex Nguyen',
    username: 'alexnguyen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
    isVerified: true,
  },
  {
    id: 'user-david',
    name: 'David Tran',
    username: 'david_tech',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
    isVerified: true,
  },
  {
    id: 'user-minhthu',
    name: 'Minh Thư',
    username: 'minhthu_ui',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
  },
  {
    id: 'user-bao',
    name: 'Quốc Bảo',
    username: 'bao_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isOnline: false,
    lastActive: '10 phút trước',
  },
  {
    id: 'user-thuha',
    name: 'Thu Hà',
    username: 'thuha_photo',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
  },
  {
    id: 'user-long',
    name: 'Hoàng Long',
    username: 'long_hoang',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    isOnline: false,
    lastActive: '1 giờ trước',
  },
];

export const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    isGroup: false,
    name: 'Alex Nguyen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    unreadCount: 2,
    isOnline: true,
    isPinned: true,
    partner: {
      id: 'user-alex',
      name: 'Alex Nguyen',
      username: 'alexnguyen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
      isVerified: true,
    },
    lastMessage: {
      text: 'Đã gửi một hình ảnh thiết kế mới 🎨',
      senderId: 'user-alex',
      senderName: 'Alex',
      timestamp: '14:25',
      isRead: false,
    },
    messages: [
      {
        id: 'm1-1',
        conversationId: 'conv-1',
        senderId: 'user-alex',
        senderName: 'Alex Nguyen',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Chào bạn! Mình vừa hoàn thành bản thảo giao diện trang Khám phá & Tin nhắn mới cho RySocial này.',
        mediaType: 'TEXT',
        timestamp: '14:20',
        isMine: false,
        status: 'read',
      },
      {
        id: 'm1-2',
        conversationId: 'conv-1',
        senderId: 'me',
        senderName: 'Me',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: 'Tuyệt vời quá! Bạn gửi hình ảnh demo qua cho mình xem với nhé.',
        mediaType: 'TEXT',
        timestamp: '14:22',
        isMine: true,
        status: 'read',
      },
      {
        id: 'm1-3',
        conversationId: 'conv-1',
        senderId: 'user-alex',
        senderName: 'Alex Nguyen',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Đây là mockup hệ thống giao diện mới, bạn xem thử tone màu xanh #004AC6 và Dark Mode này đã chuẩn chưa nhé!',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        reactions: [
          { emoji: '🔥', count: 2, userReacted: true },
          { emoji: '❤️', count: 1, userReacted: false },
        ],
        timestamp: '14:24',
        isMine: false,
        status: 'delivered',
      },
      {
        id: 'm1-4',
        conversationId: 'conv-1',
        senderId: 'user-alex',
        senderName: 'Alex Nguyen',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Tin nhắn thoại giải thích chi tiết component tokens',
        mediaType: 'AUDIO',
        audioDuration: '0:28',
        timestamp: '14:25',
        isMine: false,
        status: 'delivered',
      },
    ],
  },
  {
    id: 'conv-2',
    isGroup: false,
    name: 'David Tran',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    isOnline: true,
    isPinned: true,
    partner: {
      id: 'user-david',
      name: 'David Tran',
      username: 'david_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
      isVerified: true,
    },
    lastMessage: {
      text: 'Bạn: Cảm ơn bạn nhiều nhé, để mình test thử API',
      senderId: 'me',
      senderName: 'Bạn',
      timestamp: '11:15',
      isRead: true,
    },
    messages: [
      {
        id: 'm2-1',
        conversationId: 'conv-2',
        senderId: 'user-david',
        senderName: 'David Tran',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: 'Backend API cho tính năng Storage và Drive đã deploy xong lên server staging rồi nhé!',
        mediaType: 'TEXT',
        timestamp: '11:10',
        isMine: false,
        status: 'read',
      },
      {
        id: 'm2-2',
        conversationId: 'conv-2',
        senderId: 'me',
        senderName: 'Me',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: 'Cảm ơn bạn nhiều nhé, để mình test thử API',
        mediaType: 'TEXT',
        timestamp: '11:15',
        isMine: true,
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-3',
    isGroup: true,
    name: '🚀 RySocial Core Engineers',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    membersCount: 12,
    unreadCount: 4,
    lastMessage: {
      text: 'Quốc Bảo: Mọi người đã cập nhật bản build mới chưa?',
      senderId: 'user-bao',
      senderName: 'Quốc Bảo',
      timestamp: '09:40',
      isRead: false,
    },
    messages: [
      {
        id: 'm3-1',
        conversationId: 'conv-3',
        senderId: 'user-bao',
        senderName: 'Quốc Bảo',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        content: 'Mọi người đã cập nhật bản build mới chưa? Tất cả tests đang xanh mượt 100%!',
        mediaType: 'TEXT',
        timestamp: '09:40',
        isMine: false,
        status: 'delivered',
      },
    ],
  },
  {
    id: 'conv-4',
    isGroup: false,
    name: 'Minh Thư',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    isOnline: true,
    partner: {
      id: 'user-minhthu',
      name: 'Minh Thư',
      username: 'minhthu_ui',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    },
    lastMessage: {
      text: 'Hẹn bạn chiều mai 3h cà phê ở The Workshop nhé ☕',
      senderId: 'user-minhthu',
      senderName: 'Minh Thư',
      timestamp: 'Hôm qua',
      isRead: true,
    },
    messages: [
      {
        id: 'm4-1',
        conversationId: 'conv-4',
        senderId: 'user-minhthu',
        senderName: 'Minh Thư',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Hẹn bạn chiều mai 3h cà phê ở The Workshop nhé ☕',
        mediaType: 'TEXT',
        timestamp: 'Hôm qua 16:30',
        isMine: false,
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-5',
    isGroup: false,
    name: 'Thu Hà',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    unreadCount: 0,
    isOnline: false,
    lastActive: '3 giờ trước',
    partner: {
      id: 'user-thuha',
      name: 'Thu Hà',
      username: 'thuha_photo',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
      lastActive: '3 giờ trước',
    },
    lastMessage: {
      text: 'Gửi bạn xem trước album ảnh Đà Lạt nè!',
      senderId: 'user-thuha',
      senderName: 'Thu Hà',
      timestamp: '2 ngày trước',
      isRead: true,
    },
    messages: [
      {
        id: 'm5-1',
        conversationId: 'conv-5',
        senderId: 'user-thuha',
        senderName: 'Thu Hà',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        content: 'Gửi bạn xem trước album ảnh Đà Lạt nè!',
        mediaType: 'TEXT',
        timestamp: '2 ngày trước',
        isMine: false,
        status: 'read',
      },
    ],
  },
];
