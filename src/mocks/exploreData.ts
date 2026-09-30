export interface ExploreItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  videoDuration?: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  category: 'tech' | 'design' | 'photography' | 'gaming' | 'lifestyle' | 'travel' | 'food';
  tags: string[];
  createdAt: string;
  comments: {
    id: string;
    author: {
      name: string;
      username: string;
      avatarUrl: string;
    };
    content: string;
    time: string;
  }[];
}

export interface FeaturedCreator {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  role: string;
  followersCount: string;
  isFollowing?: boolean;
  isVerified?: boolean;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  category: string;
  postsCount: string;
  growth: string;
}

export const INITIAL_FEATURED_CREATORS: FeaturedCreator[] = [
  {
    id: 'creator-1',
    name: 'Sarah Nguyen',
    username: 'sarah_design',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    role: 'Lead UI/UX Designer & 3D Artist',
    followersCount: '48.5K',
    isFollowing: false,
    isVerified: true,
  },
  {
    id: 'creator-2',
    name: 'David Tran',
    username: 'david_tech',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    role: 'AI Researcher & Full-stack Dev',
    followersCount: '112K',
    isFollowing: true,
    isVerified: true,
  },
  {
    id: 'creator-3',
    name: 'Linh Dan',
    username: 'linhdan_travel',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    role: 'Traveler & Landscape Photographer',
    followersCount: '89.2K',
    isFollowing: false,
    isVerified: false,
  },
  {
    id: 'creator-4',
    name: 'Cyber Gaming Hub',
    username: 'cybergaming',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    role: 'Esports & Next-gen Gaming News',
    followersCount: '230K',
    isFollowing: false,
    isVerified: true,
  },
];

export const INITIAL_TRENDING_TOPICS: TrendingTopic[] = [
  { id: '1', tag: '#RySocial2026', category: 'Platform', postsCount: '45.2K', growth: '+34%' },
  { id: '2', tag: '#React19', category: 'Technology', postsCount: '88.7K', growth: '+21%' },
  { id: '3', tag: '#CyberDesign', category: 'Design', postsCount: '19.4K', growth: '+15%' },
  { id: '4', tag: '#VietnamTravel', category: 'Travel', postsCount: '62.1K', growth: '+45%' },
  { id: '5', tag: '#CoffeeVibes', category: 'Lifestyle', postsCount: '31.8K', growth: '+9%' },
];

export const INITIAL_EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'exp-1',
    title: 'Minimalist Architecture in Da Nang',
    caption: 'Khám phá kiến trúc hiện đại tối giản giữa lòng thành phố biển Đà Nẵng. Không gian ánh sáng tự nhiên tuyệt vời!',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    mediaType: 'IMAGE',
    author: {
      id: 'u1',
      name: 'Sarah Nguyen',
      username: 'sarah_design',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    likesCount: 1420,
    commentsCount: 89,
    viewsCount: 15400,
    category: 'design',
    tags: ['#Architecture', '#Minimalism', '#DaNang', '#InteriorDesign'],
    createdAt: '2 giờ trước',
    comments: [
      {
        id: 'c1',
        author: {
          name: 'David Tran',
          username: 'david_tech',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        content: 'Góc chụp và ánh sáng quá đỉnh luôn bạn ơi! 👏',
        time: '1 giờ trước',
      },
      {
        id: 'c2',
        author: {
          name: 'Minh Thư',
          username: 'minhthu_ui',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        },
        content: 'Tone màu ấm áp rất hợp mắt 😍',
        time: '30 phút trước',
      },
    ],
  },
  {
    id: 'exp-2',
    title: 'Next-Gen Workspace Setup 2026',
    caption: 'Setup bàn làm việc cho Full-stack Developer: 2 màn hình 4K OLED, bàn phím cơ custom và đèn ambient dịu mắt.',
    imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
    mediaType: 'VIDEO',
    videoDuration: '1:15',
    author: {
      id: 'u2',
      name: 'David Tran',
      username: 'david_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    likesCount: 3890,
    commentsCount: 245,
    viewsCount: 48200,
    category: 'tech',
    tags: ['#Workspace', '#DeskSetup', '#Coding', '#DeveloperSetup'],
    createdAt: '4 giờ trước',
    comments: [
      {
        id: 'c3',
        author: {
          name: 'Quốc Bảo',
          username: 'bao_dev',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        },
        content: 'Cho mình xin info con bàn phím với bro ơi!',
        time: '2 giờ trước',
      },
    ],
  },
  {
    id: 'exp-3',
    title: 'Bình minh trên đỉnh Tà Xùa',
    caption: 'Săn mây Tà Xùa mùa đẹp nhất năm. Biển mây bồng bềnh phủ kín thung lũng lúc 5h30 sáng.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    mediaType: 'CAROUSEL',
    author: {
      id: 'u3',
      name: 'Linh Dan',
      username: 'linhdan_travel',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 5120,
    commentsCount: 312,
    viewsCount: 62000,
    category: 'travel',
    tags: ['#TaXua', '#SanMay', '#VietnamTravel', '#Photography'],
    createdAt: '6 giờ trước',
    comments: [],
  },
  {
    id: 'exp-4',
    title: 'Cyberpunk Neon Street Visuals',
    caption: 'Cảm hứng ánh sáng Cyberpunk về đêm tại Sài Gòn. Những gam màu tương phản tạo nên năng lượng bất tận.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    mediaType: 'IMAGE',
    author: {
      id: 'u4',
      name: 'Alex K.',
      username: 'alex_cyber',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 2280,
    commentsCount: 94,
    viewsCount: 21900,
    category: 'photography',
    tags: ['#Cyberpunk', '#NeonLights', '#StreetPhoto', '#VisualArt'],
    createdAt: '8 giờ trước',
    comments: [],
  },
  {
    id: 'exp-5',
    title: 'Cà phê Specialty & Không gian làm việc',
    caption: 'Một buổi sáng yên tĩnh với Pour-over Ethiopia Yirgacheffe hương hoa nhài và cam bergamot.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    mediaType: 'IMAGE',
    author: {
      id: 'u5',
      name: 'Hoàng Yến',
      username: 'yen_coffee',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 1680,
    commentsCount: 78,
    viewsCount: 18300,
    category: 'lifestyle',
    tags: ['#SpecialtyCoffee', '#CoffeeLover', '#Pourover', '#SlowLiving'],
    createdAt: '10 giờ trước',
    comments: [],
  },
  {
    id: 'exp-6',
    title: 'Unreal Engine 5.5 Gameplay Preview',
    caption: 'Đồ hoạ chân thực đến ngỡ ngàng của tựa game phiêu lưu hành động thế giới mở sắp ra mắt.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    mediaType: 'VIDEO',
    videoDuration: '2:40',
    author: {
      id: 'u6',
      name: 'Cyber Gaming Hub',
      username: 'cybergaming',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    likesCount: 6740,
    commentsCount: 520,
    viewsCount: 95000,
    category: 'gaming',
    tags: ['#UnrealEngine5', '#GamingNews', '#Esports', '#GameDev'],
    createdAt: '12 giờ trước',
    comments: [],
  },
  {
    id: 'exp-7',
    title: 'Phở bò truyền thống phố cổ Hà Nội',
    caption: 'Hương vị nước dùng trong vắt, thơm nồng mùi hoa hồi thảo quả, bánh phở mềm dẻo đặc trưng.',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
    mediaType: 'IMAGE',
    author: {
      id: 'u7',
      name: 'Foodie Saigon & Hanoi',
      username: 'vietnam_foodie',
      avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: 2980,
    commentsCount: 142,
    viewsCount: 31000,
    category: 'food',
    tags: ['#PhoHaNoi', '#VietnameseFood', '#FoodPorn', '#Culinary'],
    createdAt: '14 giờ trước',
    comments: [],
  },
  {
    id: 'exp-8',
    title: 'Generative AI & UI Component Systems',
    caption: 'Cách xây dựng hệ thống Design Tokens tự động thích ứng với AI Engine trong các ứng dụng hiện đại.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    mediaType: 'CAROUSEL',
    author: {
      id: 'u1',
      name: 'Sarah Nguyen',
      username: 'sarah_design',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    likesCount: 4210,
    commentsCount: 198,
    viewsCount: 54000,
    category: 'tech',
    tags: ['#DesignSystem', '#GenerativeAI', '#React19', '#UIUX'],
    createdAt: '1 ngày trước',
    comments: [],
  },
];
