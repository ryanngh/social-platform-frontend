# UI → API Mapping

## Authentication

### Sign In
- **UI**: SignInPage
- **API**: `POST /auth/login`
- **Request**: `{ identifier, password }`
- **Response**: `{ accessToken, refreshToken, tokenType }`
- **React**: `useAuth().login()`
- **Status**: ✅ Connected

### Sign Up
- **UI**: SignUpPage
- **API**: `POST /auth/register`
- **Request**: `{ phoneNumber, email, username, password, firstName, lastName }`
- **Response**: `{ accessToken, refreshToken, tokenType }`
- **React**: `useAuth().register()`
- **Status**: ✅ Connected

### Token Refresh
- **API**: `POST /auth/refresh`
- **React**: Automatic via axios interceptor
- **Status**: ✅ Connected

### Logout
- **API**: `POST /auth/logout`
- **React**: `useAuth().logout()`
- **Status**: ✅ Connected

---

## User Profile

### My Profile
- **UI**: ProfilePage (own), LeftSidebar mini profile
- **API**: `GET /users/me`
- **React**: `userService.getMyProfile()`
- **Status**: ✅ Connected

### View User Profile
- **UI**: ProfilePage (visitor)
- **API**: `GET /users/:identifier`
- **React**: `userService.getUserByIdentifier()`
- **Status**: ✅ Connected

### Edit Profile
- **UI**: EditProfileModal
- **API**: `PUT /users/me/profile`
- **React**: `userService.updateProfile()`
- **Status**: ✅ Connected

### Upload Avatar
- **UI**: EditProfileModal
- **API**: `POST /users/me/avatar`
- **React**: `userService.uploadAvatar()`
- **Status**: ✅ Connected

### Upload Banner
- **UI**: EditProfileModal
- **API**: `POST /users/me/banner`
- **React**: `userService.uploadBanner()`
- **Status**: ✅ Connected

---

## Follow & Relationships

### Follow / Unfollow User
- **UI**: ProfilePage visitor view, Follow buttons
- **API**: `POST /users/{userId}/follow`, `DELETE /users/{userId}/follow`
- **React**: `userService.followUser()`, `userService.unfollowUser()`
- **Status**: ✅ Connected

### Get Following / Followers
- **UI**: StoriesCarousel, Profile follow lists modal
- **API**: `GET /users/{userId}/following`, `GET /users/{userId}/followers`
- **React**: `userService.getFollowing()`, `userService.getFollowers()`
- **Status**: ✅ Connected

### Close Friends & Blocks
- **UI**: ProfilePage close friends toggle & block actions
- **API**: `/close-friends/*`, `/relationships/blocks/*`
- **React**: `closeFriendService`, `relationshipService`
- **Status**: ✅ Connected

---

## Not Available (Mock/Empty State)

| Feature | Reason | UI Treatment |
|---------|--------|-------------|
| Feed Posts | Backend not implemented | Empty state UI |
| Create Post | Backend not implemented | UI only (no submit) |
| Comments | Backend not implemented | Not built |
| Likes | Backend not implemented | Not built |
| Stories | Backend not implemented | Mock data |
| Trending | Backend not implemented | Mock data |
| Notifications | Backend not implemented | UI placeholder |
| Search | Backend not implemented | UI only |
