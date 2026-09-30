export type MarketplaceCondition = 'NEW' | 'LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR';

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  condition: MarketplaceCondition;
  category: 'electronics' | 'vehicles' | 'furniture' | 'fashion' | 'gaming' | 'books' | 'free';
  description: string;
  images: string[];
  location: string;
  distanceKm: number;
  isSaved?: boolean;
  isSold?: boolean;
  viewsCount: number;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    rating: number;
    reviewCount: number;
    joinDate: string;
    responseRate: string;
    isVerified?: boolean;
  };
}

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'mp-1',
    title: 'MacBook Pro 14 M3 Pro (18GB / 512GB Space Black)',
    price: 38500000,
    originalPrice: 49990000,
    currency: '₫',
    condition: 'LIKE_NEW',
    category: 'electronics',
    description: 'Máy mua chính hãng FPT Shop, pin 99%, sạc 25 lần. Fullbox đầy đủ cáp sạc MagSafe 3 zin theo máy. Không một vết xước dăm, dán màn hình JCPAL từ lúc mở hộp. Bao test 1 tháng!',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Quận 1, TP. Hồ Chí Minh',
    distanceKm: 3.2,
    isSaved: true,
    viewsCount: 640,
    createdAt: '2 giờ trước',
    seller: {
      id: 's1',
      name: 'Hoàng Long',
      username: 'long_apple',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviewCount: 38,
      joinDate: 'Tháng 4, 2024',
      responseRate: '98% (thường trả lời trong 10 phút)',
      isVerified: true,
    },
  },
  {
    id: 'mp-2',
    title: 'Bàn làm việc công thái học Ergonomic nâng hạ điện thông minh',
    price: 4200000,
    originalPrice: 6500000,
    currency: '₫',
    condition: 'NEW',
    category: 'furniture',
    description: 'Mặt bàn gỗ sồi tự nhiên kích thước 140x70cm, chân đôi 2 motor nâng hạ cực êm tải trọng 120kg. Bộ nhớ 4 vị trí, bảo hành 3 năm chính hãng.',
    images: [
      'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Bình Thạnh, TP. Hồ Chí Minh',
    distanceKm: 5.4,
    isSaved: false,
    viewsCount: 310,
    createdAt: '4 giờ trước',
    seller: {
      id: 's2',
      name: 'Nội Thất Xanh Studio',
      username: 'noithatxanh',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.8,
      reviewCount: 92,
      joinDate: 'Tháng 1, 2023',
      responseRate: '100%',
      isVerified: true,
    },
  },
  {
    id: 'mp-3',
    title: 'Sony Alpha A7 IV + Lens Sigma 24-70mm f/2.8 DG DN Art',
    price: 45000000,
    originalPrice: 58000000,
    currency: '₫',
    condition: 'LIKE_NEW',
    category: 'electronics',
    description: 'Body chụp 4k shot chủ yếu quay video trong studio máy lạnh. Kính trong veo không mốc rễ, kèm 2 pin zin, dock sạc đôi, thẻ Sony Tough 128GB.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Cầu Giấy, Hà Nội',
    distanceKm: 8.1,
    isSaved: true,
    viewsCount: 890,
    createdAt: '5 giờ trước',
    seller: {
      id: 's3',
      name: 'Quang Vinh Media',
      username: 'vinh_camera',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviewCount: 47,
      joinDate: 'Tháng 8, 2023',
      responseRate: '95%',
      isVerified: true,
    },
  },
  {
    id: 'mp-4',
    title: 'Tai nghe Chống ồn Sony WH-1000XM5 Silver Edition',
    price: 5900000,
    originalPrice: 8490000,
    currency: '₫',
    condition: 'LIKE_NEW',
    category: 'electronics',
    description: 'Chống ồn đỉnh cao, nghe nhạc bass chắc và êm tai. Đầy đủ bao da hộp đựng phụ kiện, mới mua 3 tháng tại CellphoneS.',
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Quận 3, TP. Hồ Chí Minh',
    distanceKm: 2.1,
    isSaved: false,
    viewsCount: 420,
    createdAt: '6 giờ trước',
    seller: {
      id: 's4',
      name: 'Mai Anh',
      username: 'maianh_audio',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviewCount: 19,
      joinDate: 'Tháng 11, 2024',
      responseRate: '99%',
      isVerified: false,
    },
  },
  {
    id: 'mp-5',
    title: 'Bàn phím cơ Custom Keychron Q1 Pro Wireless QMK/VIA (Gateron Red)',
    price: 2800000,
    originalPrice: 4500000,
    currency: '₫',
    condition: 'USED_GOOD',
    category: 'gaming',
    description: 'Full nhôm CNC nguyên khối cực đầm tay, đã lót foam Poron + tape mod âm thock gõ sướng. Bluetooth 5.1 kết nối 3 thiết bị cùng lúc.',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Hải Châu, Đà Nẵng',
    distanceKm: 12.0,
    isSaved: false,
    viewsCount: 280,
    createdAt: '8 giờ trước',
    seller: {
      id: 's5',
      name: 'Đức Huy',
      username: 'huy_customkeeb',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rating: 4.7,
      reviewCount: 15,
      joinDate: 'Tháng 5, 2024',
      responseRate: '90%',
    },
  },
  {
    id: 'mp-6',
    title: 'Tủ sách gỗ sồi 4 tầng đựng tài liệu gia đình (Tặng miễn phí cho bạn nào cần)',
    price: 0,
    currency: '₫',
    condition: 'USED_GOOD',
    category: 'free',
    description: 'Dọn nhà chuyển đi nên mình tặng lại tủ sách gỗ còn chắc chắn. Bạn nào cần thì qua lấy trực tiếp nhé (tự vận chuyển).',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    ],
    location: 'Thủ Đức, TP. Hồ Chí Minh',
    distanceKm: 7.5,
    isSaved: false,
    viewsCount: 950,
    createdAt: '12 giờ trước',
    seller: {
      id: 's6',
      name: 'Thuỳ Trang',
      username: 'trang_home',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      reviewCount: 22,
      joinDate: 'Tháng 2, 2024',
      responseRate: '100%',
    },
  },
];
