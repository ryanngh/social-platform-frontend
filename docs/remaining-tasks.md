# Remaining Tasks

## Backend Required

- [ ] **Posts/Feed API**: Need `GET /posts/feed`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id` endpoints
- [ ] **Comments API**: Need `GET /posts/:id/comments`, `POST /posts/:id/comments` endpoints
- [ ] **Likes API**: Need `POST /posts/:id/like`, `DELETE /posts/:id/like` endpoints
- [ ] **Stories API**: Need endpoints for creating and viewing stories
- [ ] **Search API**: Need `GET /search?q=...` endpoint for full-text search
- [ ] **Notifications API**: Need real-time notification endpoints
- [ ] **Trending/Hashtags API**: Need `GET /trending` endpoint
- [ ] **OAuth/Social Login**: Need Google/Apple OAuth integration on backend

## Frontend Tasks

- [ ] Connect Feed page to real Posts API when available
- [ ] Build full Create Post modal with media upload
- [ ] Build Comments section component
- [ ] Build Like/Unlike interaction
- [ ] Connect Stories carousel to real data
- [ ] Connect Trending section to real data
- [ ] Connect Friend Suggestions to real recommendation API
- [ ] Build notification dropdown/page
- [ ] Build search results page
- [ ] Add pagination/infinite scroll to feed
- [ ] Add image gallery/lightbox for post media
- [ ] Build Settings page
- [ ] Add dark mode support
- [ ] Add i18n/localization (Vietnamese/English)
- [ ] Replace placeholder images with real default avatars
- [ ] Add PWA support for mobile

## Testing

- [ ] Add unit tests for services
- [ ] Add component tests for key UI components
- [ ] Add E2E tests for auth flows
- [ ] Cross-browser testing
- [ ] Mobile device testing

## Performance

- [ ] Add lazy loading for route components
- [ ] Optimize image loading (lazy, srcset)
- [ ] Add service worker for caching
- [ ] Bundle size optimization
