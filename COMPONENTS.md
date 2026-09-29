# RySocial Frontend — Kiến trúc & Danh mục Components (Component Directory)

Tài liệu tham khảo nhanh toàn bộ cấu trúc giao diện, luồng dữ liệu, components và service endpoints trong dự án `social-platform-frontend`. 
Mục đích: **Tra cứu nhanh mà không cần đọc lại toàn bộ mã nguồn từ đầu đến cuối.**

---

## 1. Bản đồ Định tuyến & Layout (Routing & Layout Map)

### Cây Layout chung (`src/components/layouts/MainLayout.tsx`)
```text
<MainLayout>
  ├── <TopNavBar />            (Fixed top bar: Logo, Search, LangSwitcher, Notifications, Messages, UserMenu)
  ├── <main> (max-w-[1340px])
  │     ├── <LeftSidebar />    (Sticky trái: Navigation items Bảng tin, Khám phá, Thông báo, Tin nhắn, Cá nhân...)
  │     ├── <Outlet />         (Center Column max-w-[640px]: Trang nội dung tương ứng)
  │     └── <RightSidebar />   (Sticky phải: Trending hashtags, Gợi ý theo dõi, Footer links)
  └── <MobileBottomNav />      (Dành riêng cho màn hình mobile)
```

### Danh sách Trang (`src/pages/`)
| File Route | URL Path | Quyền truy cập | Mô tả & Chức năng chính |
|---|---|---|---|
| [`FeedPage.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/pages/FeedPage.tsx) | `/feed`, `/` | Protected | Trang Bảng tin chính. Bao gồm [`PostComposer`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/PostComposer.tsx), [`StoriesCarousel`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/StoriesCarousel.tsx), [`FeedTabs`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedTabs.tsx), các trạng thái empty / skeleton / network error. |
| [`PostDetailPage.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/pages/PostDetailPage.tsx) | `/posts/:postId` | Protected | Trang Chi tiết bài viết. Nhận `postId` từ URL, gọi `postService.getPostById()`, render [`PostCard`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostCard.tsx) với luồng bình luận mở sẵn, xử lý skeleton & 404/403. |
| [`ProfilePage.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/pages/ProfilePage.tsx) | `/profile`, `/profile/:identifier` | Protected | Trang Cá nhân người dùng hoặc chính mình. Bao gồm [`ProfileHeader`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileHeader.tsx), [`ProfileInfoCard`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileInfoCard.tsx), [`ProfileTabs`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileTabs.tsx), [`ProfileRightSidebar`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileRightSidebar.tsx). |
| [`SignInPage.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/pages/SignInPage.tsx) | `/signin` | Public | Đăng nhập (Email/Username + Password, Remember Me, lưu token vào `localStorage`). |
| [`SignUpPage.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/pages/SignUpPage.tsx) | `/signup` | Public | Đăng ký tài khoản mới (Họ, tên, username, email, phone, password). |

---

## 2. Components Bài viết & Tương tác (`src/components/post/`)

Đây là nhóm component cốt lõi của mạng xã hội, hỗ trợ like, comment, repost, bookmark, chia sẻ và media.

### 2.1. [`PostCard.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostCard.tsx) *(Component trung tâm)*
* **Props**:
  * `post: PostResponse` (Bắt buộc)
  * `onOpenLightbox?: (post: PostResponse, mediaIndex: number) => void` (Tùy chọn, nếu không truyền sẽ dùng modal lightbox tích hợp sẵn)
  * `language?: string` (vi \| en)
  * `isAuthor?: boolean` (Mặc định tự so sánh `currentUser.id === post.author.id`)
  * `onPostUpdated?: (post: PostResponse) => void`
  * `onPostDeleted?: (postId: string) => void`
  * `defaultShowComments?: boolean` (true trên PostDetailPage)
* **Tính năng**:
  * **Header**: Avatar tác giả, tên đầy đủ, `@username`, thời gian tương đối (`formatRelativeTime`), icon quyền riêng tư (`PUBLIC`, `FRIENDS`, `CLOSE_FRIENDS`, `PRIVATE`).
  * **Menu ba chấm**: Gọi [`PostMoreMenu`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostMoreMenu.tsx).
  * **Nội dung & Hashtag**: Tách hashtag hiển thị riêng bên dưới bằng `getContentWithoutHashtags`.
  * **Media Grid**: Hiển thị ảnh / video theo tỷ lệ chuẩn. Click vào ảnh/video kích hoạt Lightbox.
  * **Thanh Actions Bar**:
    * **Thích**: Toggle like/unlike với optimistic update + mở modal người đã thích ([`LikersModal`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/LikersModal.tsx)).
    * **Bình luận**: Nút toggle xem / ẩn comment stream + số đếm comment.
    * **Đăng lại (Repost)**: Nút đăng lại.
    * **Lượt xem (Views)**: Hiển thị số lượt xem.
    * **Lưu (Bookmark)**: Lưu bài viết vào mục Đã lưu.
    * **Chia sẻ (Share)**: Hiển thị icon `Share2` và `shareCount`. Khi bấm: copy link `${origin}/posts/${postId}` vào clipboard và gọi ngầm `POST /posts/{postId}/shares`.
  * **Bình luận tích hợp (Inline Comment Stream)**:
    * Sắp xếp bình luận: `POPULAR`, `NEWEST`, `OLDEST`.
    * Phân trang tải thêm bình luận (`handleLoadMoreComments`).
    * Danh sách comment dạng đệ quy ([`CommentItem`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/CommentItem.tsx)).
    * Khung nhập comment/reply nhanh ([`CommentInput`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/CommentInput.tsx)).

### 2.2. [`PostMediaLightbox.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostMediaLightbox.tsx)
* **Chức năng**: Cửa sổ xem ảnh / video toàn màn hình chuẩn rạp chiếu (Theater mode).
* **Bên trái (Media viewer)**:
  * Zoom in/out ($0.5x$ - $3x$), xoay ảnh ($90^\circ$), kéo rê (pan), chuyển ảnh trước/sau, toàn màn hình, tải ảnh xuống.
  * Trình phát video chuyên dụng ([`CustomVideoPlayer`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/media/CustomVideoPlayer.tsx)) khi media là video.
* **Bên phải (Interactive Sidebar)**:
  * Thông tin tác giả, nội dung bài viết, ngày đăng.
  * Thanh tương tác đầy đủ: like (+ likers), bookmark, **share (kèm shareCount)**, repost.
  * Danh sách bình luận đầy đủ với sorting, load more, reply, like comment.
  * Hộp soạn thảo bình luận tích hợp.

### 2.3. [`PostMoreMenu.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostMoreMenu.tsx)
* **Props**: `postId`, `authorUsername`, `isAuthor`, `currentVisibility`, `isOpen`, `onClose`, `onEdit`, `onChangeVisibility`, `onDelete`, `onCopyLink`.
* **Menu Options**:
  * Tác giả: Chỉnh sửa bài viết, Đổi quyền riêng tư (Public / Friends / Close Friends / Private), Xóa bài viết.
  * Mọi người: Lưu bài viết, **Sao chép liên kết** (gọi `handleCopyAndSharePost`).
  * Người xem (không phải tác giả): Chặn người dùng.

### 2.4. [`CommentItem.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/CommentItem.tsx) & [`CommentInput.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/CommentInput.tsx)
* **`CommentItem`**:
  * Render comment đơn lẻ hoặc reply lồng nhau.
  * Badge tác giả (`Tác giả`), badge `Bạn`, badge `Đã ghim`.
  * Like/Unlike comment, xem danh sách người like comment.
  * Menu 3 chấm: Ghim comment (chỉ dành cho tác giả bài viết), Sửa nội dung inline, Xóa comment.
  * Luồng replies lồng nhau: tự động tải reply top 1, xem thêm replies.
* **`CommentInput`**:
  * Textarea tự co giãn chiều cao theo nội dung.
  * Đính kèm ảnh / video / GIF.
  * Popover biểu cảm: [`EmojiPickerPopover`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/common/EmojiPickerPopover.tsx) và [`GifPickerPopover`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/common/GifPickerPopover.tsx).
  * Hỗ trợ trạng thái "Đang trả lời @username" kèm nút Hủy.

### 2.5. Các Modals phụ trợ
* **[`EditPostModal.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/EditPostModal.tsx)**: Modal chỉnh sửa bài viết, hỗ trợ sửa text và kéo thả tải thêm/xóa ảnh media.
* **[`LikersModal.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/LikersModal.tsx)**: Modal danh sách người bày tỏ cảm xúc trên Post hoặc Comment, phân trang và có nút Follow nhanh.
* **[`CommentMediaLightbox.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/CommentMediaLightbox.tsx)**: Modal zoom xem media gắn kèm trong bình luận.

---

## 3. Components Trang Bảng tin (`src/components/feed/`)

| Component | Mục đích & Trách nhiệm |
|---|---|
| [`PostComposer.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/PostComposer.tsx) | Hộp kích hoạt đăng bài nhanh ở đầu Feed ("Bạn đang nghĩ gì thế?"). Nhấn vào mở `CreatePostModal`. |
| [`CreatePostModal.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/CreatePostModal.tsx) | Modal đăng bài viết hoàn chỉnh. Tự động nhận diện `#hashtag`, upload multi-media lên MinIO qua `mediaService`, chọn quyền riêng tư, nút đăng với phím tắt Ctrl+Enter. |
| [`StoriesCarousel.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/StoriesCarousel.tsx) | Thanh cuộn ngang hiển thị các tin (Stories) 24h của bạn bè và nút tạo tin mới. |
| [`FeedTabs.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedTabs.tsx) | Thanh tab chuyển đổi danh mục feed: "Dành cho bạn" (`for-you`), "Đang theo dõi" (`following`), "Thịnh hành" (`trending`). |
| [`FeedEmptyState.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedEmptyState.tsx) | Giao diện trống khi feed chưa có bài viết nào. |
| [`FeedAllCaughtUpState.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedAllCaughtUpState.tsx) | Huy hiệu "Bạn đã xem hết bài viết mới". |
| [`FeedNetworkErrorState.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedNetworkErrorState.tsx) | Báo lỗi mất kết nối kèm nút Thử lại. |
| [`FeedSkeleton.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/feed/FeedSkeleton.tsx) | Hiệu ứng khung xương tải dữ liệu cho feed. |

---

## 4. Components Trang Cá nhân (`src/components/profile/`)

| Component | Mục đích & Trách nhiệm |
|---|---|
| [`ProfileHeader.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileHeader.tsx) | Ảnh bìa (cover), avatar, tên hiển thị, `@username`, bio, bộ đếm followers/following. Các nút CTA: "Chỉnh sửa trang cá nhân" (nếu là mình), "Theo dõi / Bỏ theo dõi", "Nhắn tin". |
| [`ProfileTabs.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileTabs.tsx) | Quản lý các tab: **Bài viết** (`Posts`), **Phản hồi** (`Replies`), **Đăng lại** (`Reposts`), **Phương tiện** (`Media`), **Lượt thích** (`Likes`). Với tab Posts: gọi `postService.getMyPosts` hoặc `getUserPosts`, render danh sách bằng [`PostCard`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/post/PostCard.tsx). |
| [`ProfileInfoCard.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileInfoCard.tsx) | Thẻ tóm tắt thông tin cá nhân: Địa điểm, Website, Ngày sinh, Ngày tham gia, Đại từ xưng hô, Phát âm tên. |
| [`ProfileRightSidebar.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileRightSidebar.tsx) | Cột phụ bên phải profile: Bạn chung, Gợi ý kết bạn, Bài viết đã lưu. |
| [`EditProfileModal.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/EditProfileModal.tsx) | Modal chỉnh sửa toàn diện thông tin cá nhân (upload avatar, banner, bio, link...). |
| [`ProfileSkeleton.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/components/profile/ProfileSkeleton.tsx) | Skeleton loading khi chuyển trang cá nhân. |

---

## 5. Danh mục Services & API Endpoints (`src/services/`)

Tất cả các service sử dụng Axios instance [`lib/axios.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/lib/axios.ts) tự động kèm token `Authorization: Bearer <accessToken>` và mutex refresh token tự động khi gặp lỗi 401.

| Service File | Phương thức API | Endpoint Backend | Ý nghĩa nghiệp vụ |
|---|---|---|---|
| [`postService.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/services/postService.ts) | `getPostById(postId)` | `GET /posts/{postId}` | Lấy chi tiết 1 bài viết |
| | `createPost(payload)` | `POST /posts` | Đăng bài viết mới |
| | `updatePost(postId, data)` | `PUT /posts/{postId}` | Cập nhật nội dung / visibility |
| | `deletePost(postId)` | `DELETE /posts/{postId}` | Xóa bài viết |
| | `getFeed(params)` | `GET /posts/feed` | Lấy danh sách bài viết trên bảng tin |
| | `getUserPosts(userId, params)` | `GET /users/{userId}/posts` | Lấy bài viết của người khác |
| | `getMyPosts(params)` | `GET /users/me/posts` | Lấy bài viết của chính mình |
| | `likePost(postId)` | `POST /posts/{postId}/reactions` | Bày tỏ cảm xúc (Thích) bài viết |
| | `unlikePost(postId)` | `DELETE /posts/{postId}/reactions` | Bỏ thích bài viết |
| | `getPostLikers(postId, params)` | `GET /posts/{postId}/reactions` | Lấy danh sách người đã thích |
| | **`sharePost(postId)`** | **`POST /posts/{postId}/shares`** | **Ghi nhận lượt chia sẻ (tracking copy link)** |
| [`commentService.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/services/commentService.ts) | `getComments(postId, params)` | `GET /posts/{postId}/comments` | Lấy danh sách bình luận (có sort) |
| | `createComment(postId, req)` | `POST /posts/{postId}/comments` | Gửi bình luận gốc |
| | `createReply(commentId, req)` | `POST /comments/{commentId}/replies` | Gửi phản hồi bình luận |
| | `getReplies(commentId, params)` | `GET /comments/{commentId}/replies` | Lấy danh sách replies con |
| | `likeComment(commentId)` | `POST /comments/{commentId}/reactions` | Thích bình luận |
| | `unlikeComment(commentId)` | `DELETE /comments/{commentId}/reactions` | Bỏ thích bình luận |
| | `pinComment(commentId, postId)` | `PUT /comments/{commentId}/pin` | Ghim / Bỏ ghim bình luận |
| | `deleteComment(commentId)` | `DELETE /comments/{commentId}` | Xóa bình luận |
| [`userService.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/services/userService.ts) | `getProfile(identifier)` | `GET /users/{identifier}` | Lấy profile theo username hoặc id |
| | `updateProfile(data)` | `PUT /users/me` | Cập nhật thông tin profile |
| | `followUser(userId)` | `POST /users/{userId}/follow` | Theo dõi người dùng |
| | `unfollowUser(userId)` | `DELETE /users/{userId}/follow` | Bỏ theo dõi |
| [`authService.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/services/authService.ts) | `login(data)` | `POST /auth/login` | Đăng nhập |
| | `register(data)` | `POST /auth/register` | Đăng ký |
| | `refreshToken(data)` | `POST /auth/refresh` | Đổi refresh token lấy access token |
| [`mediaService.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/services/mediaService.ts) | `uploadMedia(file)` | `POST /media/upload` | Upload ảnh / video lên MinIO |
| | `uploadMultipleMedia(files)` | `POST /media/upload/batch` | Upload nhiều file cùng lúc |

---

## 6. Utilities & Contexts (`src/utils/`, `src/contexts/`)

* **[`utils/share.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/utils/share.ts)**:
  * `copyToClipboard(text: string)`: Copy vào clipboard thiết bị, tự fallback `execCommand` khi không hỗ trợ Clipboard API / non-https.
  * `handleCopyAndSharePost(postId: string, options)`: Thao tác copy link `${origin}/posts/${postId}` + toast ngay lập tức + gọi ngầm `postService.sharePost(postId)` để tăng `shareCount`.
* **[`utils/media.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/utils/media.ts)**:
  * `getAvatarUrl(url)`: Chuẩn hóa link avatar (nếu rỗng trả về ảnh fallback).
  * `getMediaUrl(url)`: Chuẩn hóa link media từ MinIO.
  * `isVideoMedia(url, type)`: Phân loại tệp là ảnh hay video dựa vào đuôi mở rộng (`.mp4`, `.webm`) hoặc MIME type.
* **[`utils/text.ts`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/utils/text.ts)**:
  * `extractHashtags(content)`: Trích xuất các thẻ `#hashtag`.
  * `getContentWithoutHashtags(content)`: Lọc bỏ chuỗi hashtag để tránh lặp nội dung.
* **[`contexts/AuthContext.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/contexts/AuthContext.tsx)**: Quản lý đăng nhập, thông tin `currentUser`, token và tự động đăng xuất khi hết phiên.
* **[`contexts/LanguageContext.tsx`](file:///D:/Mo3Studio/Facebook-like%20platform/social-platform-frontend/src/contexts/LanguageContext.tsx)**: Quản lý ngôn ngữ hiển thị (`vi` và `en`) thông qua hàm dịch `t('key.path')`.

---

## 7. Cấu hình Vite Proxy Lưu ý (`vite.config.ts`)

Khi thêm route SPA trùng tiền tố với API backend (ví dụ `/posts/:postId` trùng với API `/posts`), proxy của Vite bắt buộc phải có `bypass`:
```typescript
bypass: (req: import('http').IncomingMessage) => {
  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'; // Phục vụ Single Page App khi browser truy cập trực tiếp
  }
}
```
Điều này đảm bảo khi người dùng F5 hoặc gõ URL trực tiếp trên thanh địa chỉ trình duyệt, server sẽ phục vụ trang HTML thay vì proxy request không có Token sang Spring Boot gây lỗi `401 Unauthorized`.
