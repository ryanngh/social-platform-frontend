# Design Spec: Avatar & Banner Image Cropping (`react-easy-crop`)

- **Date**: 2026-09-30
- **Status**: Approved by User
- **Scope**: Frontend (`social-platform-frontend`)

---

## 1. Objectives

1. **Fix Aspect Ratio Distortion**: Prevent arbitrary aspect ratio images from breaking profile layouts ("toang ảnh").
2. **Crop Avatar**: Provide a 1:1 aspect ratio crop with a circular mask preview (guidelines for centering faces), outputting an optimized square image.
3. **Crop Banner**: Provide a 3:1 aspect ratio crop matching the `ProfileHeader` layout proportions, outputting an optimized widescreen cover image.
4. **Dual Entry Points**:
   - **Quick Action (ProfileHeader)**: Direct camera buttons on banner and avatar for own profile (`isOwnProfile = true`) that open the cropper and immediately upload to `/users/me/avatar` and `/users/me/banner`.
   - **Staged Action (EditProfileModal)**: Cropping within the profile editing form to preview changes before clicking "Save changes".
5. **Modern UI/UX**: Pinch-to-zoom (mobile), wheel-zoom (desktop), pan/drag, zoom slider, 90° rotation button, reset button, and dark blur overlay.

---

## 2. Technical Architecture

### 2.1 Dependencies
- Install `react-easy-crop` (`npm install react-easy-crop`).
- Requires zero extra backend changes (`userService.uploadAvatar(file)` and `userService.uploadBanner(file)` remain identical).

### 2.2 Cropping Utility (`src/utils/cropImage.ts`)
- `createImage(url: string): Promise<HTMLImageElement>`: Asynchronously loads an image from an object URL or data URL.
- `getRadianAngle(degreeValue: number): number`: Utility for trigonometry calculations.
- `getCroppedImg(imageSrc: string, pixelCrop: Area, rotation?: number, fileName?: string): Promise<File>`:
  - Draws the image to an HTML5 canvas rotated and translated accurately.
  - Crops the specified bounding rectangle `pixelCrop`.
  - Converts canvas to a compressed `Blob` (`image/jpeg` with quality `0.92`), then wraps it in a standard browser `File` object ready for `FormData` submission.

### 2.3 Reusable Modal Component (`src/components/common/ImageCropModal.tsx`)
- **Props**:
  - `isOpen: boolean`
  - `imageSrc: string | null`
  - `cropType: 'avatar' | 'banner'`
  - `onClose: () => void`
  - `onCropComplete: (file: File, previewUrl: string) => void`
  - `aspectRatio?: number` (Defaults: `1` for avatar, `3 / 1` for banner)
  - `cropShape?: 'round' | 'rect'` (Defaults: `'round'` for avatar, `'rect'` for banner)
- **Features**:
  - `<Cropper />` from `react-easy-crop`.
  - Zoom range slider (1x to 3x) with `ZoomIn` / `ZoomOut` icons.
  - Rotate button (90° clockwise increment).
  - Reset button to restore zoom=1, rotation=0, crop={x:0, y:0}.
  - Modal action buttons: Cancel (discard) and Apply (export canvas to file).
  - Bilingual support (`vi` / `en`) via `useLanguage`.

### 2.4 Integration in `EditProfileModal.tsx`
- Replace direct `handleFileChange` setting of raw files:
  - When user selects an avatar or banner file from `<input type="file">`, read the file as an Object URL and open `ImageCropModal`.
  - On `onCropComplete`:
    - Save the cropped `File` (`avatarFile` or `bannerFile`).
    - Update `avatarPreview` or `bannerPreview`.
    - Close `ImageCropModal`.
  - User can proceed to edit other profile fields and save everything together.

### 2.5 Integration in `ProfileHeader.tsx`
- For own profile (`isOwnProfile = true`):
  - **Banner Quick Action**: Add a sleek button with camera icon (e.g. "Cập nhật ảnh bìa" / "Update cover") positioned at the bottom-right of the cover photo.
  - **Avatar Quick Action**: Add an edit camera badge overlay on the avatar circle.
  - Hidden `<input type="file">` refs to trigger system file dialog.
  - Opening `ImageCropModal` upon file selection.
  - On crop completion:
    - Call `userService.uploadAvatar(file)` or `userService.uploadBanner(file)`.
    - Show loading spinner/toast feedback during upload.
    - Trigger state update to reflect newly uploaded avatar/banner immediately.

---

## 3. UI/UX Specifications (ui-ux-pro-max standard)

- **Backdrop**: `bg-black/85 backdrop-blur-md` for maximum visual focus on the crop canvas.
- **Cropper Container**: Fixed height on mobile (`h-72`), comfortable height on desktop (`h-96`), rounded corners.
- **Controls Bar**:
  - Smooth slider with `#004AC6` / dark `#0095F6` accents.
  - Accessible icon buttons with tooltip or text labels.
- **Color tokens & Dark Mode**:
  - Fully supports light/dark theme classes matching existing design tokens.
  - Keyboard accessibility (Esc to close modal).

---

## 4. Verification Plan

1. **Avatar Crop Verification**:
   - Upload wide (16:9) photo as avatar -> Verify modal shows 1:1 circular guide -> Crop face -> Verify saved avatar is sharp, properly centered, and has no stretching.
2. **Banner Crop Verification**:
   - Upload vertical/portrait photo as banner -> Verify modal shows 3:1 rectangular guide -> Pan/zoom -> Verify saved banner fits `ProfileHeader` without letterboxing or distortion.
3. **Dual Entry Point Verification**:
   - Test quick upload directly from `ProfileHeader` (both avatar & banner).
   - Test staged upload from inside `EditProfileModal`.
4. **Mobile & Touch Gestures**:
   - Verify drag-to-pan, pinch-to-zoom, and button controls work smoothly without layout shifting.
