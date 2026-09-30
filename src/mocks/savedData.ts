export interface SavedCollection {
  id: string;
  name: string;
  itemCount: number;
  color: string;
  coverUrl?: string;
  isPrivate?: boolean;
}

export type SavedItemType = 'POST' | 'MEDIA' | 'MARKETPLACE' | 'LINK';

export interface SavedItem {
  id: string;
  collectionId: string;
  collectionName: string;
  type: SavedItemType;
  title: string;
  excerpt: string;
  mediaUrl?: string;
  linkUrl?: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  savedAt: string;
  tags?: string[];
  price?: string;
}

export const INITIAL_SAVED_COLLECTIONS: SavedCollection[] = [
  {
    id: 'col-all',
    name: 'Tất cả mục đã lưu',
    itemCount: 8,
    color: 'bg-blue-500',
  },
  {
    id: 'col-design',
    name: '🎨 Cảm hứng UI/UX & Design',
    itemCount: 3,
    color: 'bg-purple-500',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-tech',
    name: '💻 Lập trình & Kiến trúc hệ thống',
    itemCount: 2,
    color: 'bg-emerald-500',
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-marketplace',
    name: '🛍️ Đồ muốn mua trên Chợ',
    itemCount: 2,
    color: 'bg-amber-500',
    coverUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'col-travel',
    name: '✈️ Du lịch & Điểm đến đẹp',
    itemCount: 1,
    color: 'bg-rose-500',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_SAVED_ITEMS: SavedItem[] = [
  {
    id: 'save-1',
    collectionId: 'col-design',
    collectionName: '🎨 Cảm hứng UI/UX & Design',
    type: 'POST',
    title: 'Hệ thống Design Token 3-Layer trong React 19',
    excerpt: 'Cách phân tách Primitives -> Semantics -> Components giúp code gọn gàng, hỗ trợ Dark Mode và đa chủ đề linh hoạt vượt trội.',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    author: {
      id: 'u1',
      name: 'Sarah Nguyen',
      username: 'sarah_design',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '2 giờ trước',
    tags: ['#DesignTokens', '#React19', '#TailwindCSS'],
  },
  {
    id: 'save-2',
    collectionId: 'col-marketplace',
    collectionName: '🛍️ Đồ muốn mua trên Chợ',
    type: 'MARKETPLACE',
    title: 'MacBook Pro 14 M3 Pro (18GB / 512GB Space Black)',
    excerpt: 'Máy đẹp 99% like new chính hãng FPT Shop, pin 99%, bao test 1 tháng.',
    price: '38.500.000 ₫',
    mediaUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    linkUrl: '/marketplace',
    author: {
      id: 's1',
      name: 'Hoàng Long',
      username: 'long_apple',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '5 giờ trước',
  },
  {
    id: 'save-3',
    collectionId: 'col-tech',
    collectionName: '💻 Lập trình & Kiến trúc hệ thống',
    type: 'POST',
    title: 'Tối ưu Performance Bảng tin với React Virtualized & Feed Pagination Cursor',
    excerpt: 'Chi tiết kỹ thuật render mượt mà hàng ngàn post feed mà không bị giật lag trên các thiết bị di động cấu hình thấp.',
    author: {
      id: 'u2',
      name: 'David Tran',
      username: 'david_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: 'Hôm qua',
    tags: ['#Performance', '#React', '#Optimization'],
  },
  {
    id: 'save-4',
    collectionId: 'col-travel',
    collectionName: '✈️ Du lịch & Điểm đến đẹp',
    type: 'MEDIA',
    title: 'Hoàng hôn biển Mỹ Khê - Đà Nẵng',
    excerpt: 'Góc chụp lúc chiều tà với ánh nắng vàng cam phủ khắp mặt biển.',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    author: {
      id: 'u3',
      name: 'Linh Dan',
      username: 'linhdan_travel',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '2 ngày trước',
  },
  {
    id: 'save-5',
    collectionId: 'col-tech',
    collectionName: '💻 Lập trình & Kiến trúc hệ thống',
    type: 'LINK',
    title: 'Clean Architecture Pattern in Modern TypeScript Backends',
    excerpt: 'Hướng dẫn xây dựng Domain-driven Design, CQRS và Event-driven Architecture trong hệ thống mạng xã hội quy mô lớn.',
    linkUrl: 'https://martinfowler.com/articles',
    author: {
      id: 'u-tech',
      name: 'Tech Insights Daily',
      username: 'tech_insights',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '3 ngày trước',
  },
  {
    id: 'save-6',
    collectionId: 'col-design',
    collectionName: '🎨 Cảm hứng UI/UX & Design',
    type: 'POST',
    title: 'Top 10 Thư viện Icons và Animation đẹp nhất cho Web App 2026',
    excerpt: 'Tổng hợp Lucide React, Framer Motion, GSAP và Canvas Shaders cho giao diện web tương tác cao cấp.',
    mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    author: {
      id: 'u1',
      name: 'Sarah Nguyen',
      username: 'sarah_design',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '5 ngày trước',
  },
  {
    id: 'save-7',
    collectionId: 'col-marketplace',
    collectionName: '🛍️ Đồ muốn mua trên Chợ',
    type: 'MARKETPLACE',
    title: 'Sony Alpha A7 IV + Lens Sigma 24-70mm f/2.8',
    excerpt: 'Body chụp 4k shot chủ yếu quay video trong studio máy lạnh.',
    price: '45.000.000 ₫',
    mediaUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    linkUrl: '/marketplace',
    author: {
      id: 's3',
      name: 'Quang Vinh Media',
      username: 'vinh_camera',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '1 tuần trước',
  },
  {
    id: 'save-8',
    collectionId: 'col-design',
    collectionName: '🎨 Cảm hứng UI/UX & Design',
    type: 'MEDIA',
    title: 'Setup bàn làm việc tối giản với đèn ấm',
    excerpt: 'Góc làm việc gọn gàng mang lại cảm hứng sáng tạo mỗi ngày.',
    mediaUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    author: {
      id: 'u2',
      name: 'David Tran',
      username: 'david_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    savedAt: '1 tuần trước',
  },
];
