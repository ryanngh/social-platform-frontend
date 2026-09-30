# Implementation Plan: Avatar & Banner Image Cropping

- **Date**: 2026-09-30
- **Spec**: `docs/superpowers/specs/2026-09-30-avatar-banner-crop-design.md`
- **Scope**: Frontend (`social-platform-frontend`)

---

## Proposed Changes

### 1. Dependencies
- Install `react-easy-crop` via npm.

### 2. Canvas Utility (`src/utils/cropImage.ts`)
- Implement `createImage(url: string): Promise<HTMLImageElement>` helper.
- Implement `getRadianAngle(degreeValue: number): number`.
- Implement `getCroppedImg(imageSrc: string, pixelCrop: Area, rotation?: number, fileName?: string): Promise<File>`.
  - Calculate safe canvas bounding box considering rotation.
  - Draw transformed image onto an offscreen canvas.
  - Crop the exact `pixelCrop` region onto destination canvas.
  - Convert canvas content to `Blob` (`image/jpeg`, 0.92 quality) and return a new `File` object.

### 3. Cropping Modal (`src/components/common/ImageCropModal.tsx`)
- Props:
  - `isOpen: boolean`
  - `imageSrc: string | null`
  - `cropType: 'avatar' | 'banner'`
  - `onClose: () => void`
  - `onCropComplete: (file: File, previewUrl: string) => void`
- UI elements:
  - Header: Modal title ("Chỉnh sửa ảnh đại diện" / "Chỉnh sửa ảnh bìa"), close X button.
  - Cropper viewport: `Cropper` from `react-easy-crop` with 1:1 circle mask for avatar, 3:1 rect mask for banner.
  - Controls toolbar:
    - Zoom slider (- / + icons, 1x to 3x range).
    - Rotate 90° button (`RotateCw` icon).
    - Reset button (`RotateCcw` icon).
  - Footer actions: Cancel button and Save/Apply button with loading indicator.
  - Full keyboard accessibility and dark/light mode token integration.

### 4. Integration into `EditProfileModal.tsx`
- Connect file inputs for avatar and banner to read selected image as object URL and open `ImageCropModal`.
- On crop complete, store cropped `File` and update preview image inside modal.
- Submit cropped files together with profile updates on form submit.

### 5. Integration into `ProfileHeader.tsx`
- For own profile (`isOwnProfile = true`):
  - Add camera button on Banner (bottom-right) with label "Cập nhật ảnh bìa" / "Update cover".
  - Add camera button overlay on Avatar.
  - Hidden file inputs triggered on click.
  - Open `ImageCropModal` on file selection.
  - On crop complete, call `userService.uploadAvatar(file)` / `userService.uploadBanner(file)` with loading spinner & toast notification.
  - Update user state to display newly cropped image immediately.

### 6. Verification & Build
- Verify TypeScript types and build via `npm run build`.
- Update graphify graph (`graphify update .`).
