# Design Spec: Profile Redirection with Clean URL (`domain/:username`)

- **Date**: 2026-09-27
- **Status**: Approved by User
- **Scope**: Frontend (`social-platform-frontend`)

---

## 1. Objectives

1. Allow users to click on any user's Avatar, Display Name, or Username (`@username`) across all UI surfaces (Posts, Comments, Replies, Lightbox, Sidebars, Modals) to navigate to their Profile page.
2. Modernize the Profile URL route from `/profile/:identifier` to clean root URLs: `/:identifier` (e.g. `domain/zuck`, `domain/alex99`), while maintaining backward compatibility for legacy `/profile/:identifier` bookmarks.
3. Provide intuitive hover interactions (pointer cursor, subtle avatar opacity, underline + brand color text hover) and native browser behaviors (left click SPA navigation, right click / middle click open in new tab).

---

## 2. Architecture & Design

### 2.1 Route Configuration (`App.tsx`)
- Add root parameter route:
  ```tsx
  <Route path="/:identifier" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
  ```
- React Router v6 scores static routes (`/signin`, `/signup`, `/feed`, `/posts/:postId`) higher than dynamic `/:identifier`, preventing route collisions.
- Legacy backward-compatibility routes:
  - `/profile` -> Redirects to `/${currentUser.username}` (or `/feed`).
  - `/profile/:identifier` -> Redirects to `/:identifier`.

### 2.2 Centralized Helper Utility (`src/utils/user.ts`)
Create a helper function `getProfileUrl`:
```typescript
export const getProfileUrl = (userOrUsername?: { username?: string; id?: string } | string | null): string => {
  if (!userOrUsername) return '/feed';
  const identifier = typeof userOrUsername === 'string' ? userOrUsername : (userOrUsername.username || userOrUsername.id);
  return identifier ? `/${identifier}` : '/feed';
};
```

### 2.3 Component Enhancements

#### Task 1: Route Setup, Utils, Core Post & Lightbox Integration
- **`src/utils/user.ts`**: Implement `getProfileUrl` and export it.
- **`src/App.tsx`**: Add `/:identifier` route, add legacy `/profile` and `/profile/:identifier` redirects.
- **`src/components/post/PostCard.tsx`**:
  - Avatar -> `<Link to={getProfileUrl(post.author)} className="hover:opacity-90 transition flex-shrink-0">`
  - Name -> `<Link to={getProfileUrl(post.author)} className="font-bold text-gray-900 text-sm hover:underline hover:text-[#004AC6] transition-colors">`
  - `@username` -> `<Link to={getProfileUrl(post.author)} className="hover:underline hover:text-gray-600 transition-colors">@{post.author.username}</Link>`
  - Prevent event bubbling (`onClick={(e) => e.stopPropagation()}`).
- **`src/components/post/PostMediaLightbox.tsx`**:
  - Author Avatar, Name, Username wrapped in `<Link to={getProfileUrl(currentPost.author)} onClick={onClose} ...>` to close lightbox and navigate.
- **`src/pages/PostDetailPage.tsx`**: Verify PostCard integration.

#### Task 2: Comments, Sidebars, Modals & Feed Integration
- **`src/components/post/CommentItem.tsx`**:
  - Main comment:
    - Author Avatar -> `<Link to={getProfileUrl(comment.author)} className="hover:opacity-90 transition flex-shrink-0">`
    - Author Name -> `<Link to={getProfileUrl(comment.author)} className="font-semibold text-sm text-[#1A1C1E] hover:underline hover:text-[#004AC6] transition-colors">`
    - `@username` -> `<Link to={getProfileUrl(comment.author)} className="text-xs text-[#535F70] hover:underline transition-colors">@{comment.author.username}</Link>`
  - Reply item:
    - Reply Author Avatar -> `<Link to={getProfileUrl(reply.author)} className="hover:opacity-90 transition flex-shrink-0">`
    - Reply Author Name -> `<Link to={getProfileUrl(reply.author)} className="font-bold text-xs text-[#1A1C1E] hover:underline hover:text-[#004AC6] transition-colors">`
- **`src/components/layouts/LeftSidebar.tsx`**:
  - Mini Profile Card: make Avatar, Name, and Username link to `getProfileUrl(user)`.
- **`src/components/layouts/TopNavBar.tsx`**:
  - Update user dropdown and links to use clean profile URL.
- **`src/components/layouts/RightSidebar.tsx`**:
  - Friend Suggestions list items: Avatar, Name, and Username link to `getProfileUrl(user)`.
- **`src/components/post/LikersModal.tsx` & `src/components/profile/FollowListModal.tsx`**:
  - Update user items to link to `getProfileUrl(user)`.
- **`src/components/feed/FeedPostCard.tsx` & `src/pages/FeedPage.tsx`**:
  - Update mock posts (Maya Patel, Tech Digest) and custom posted card to link to profiles.

---

## 3. Verification Plan
- Build project using `npm run build` or `vite build` to guarantee zero TypeScript or bundle errors.
- Test routing: visiting `/:identifier` correctly opens `ProfilePage`.
- Test clicking Avatar, Name, and Username in Post, Comment, Reply, Lightbox, Sidebars.
- Verify modal/lightbox closes cleanly upon clicking author profile link.
