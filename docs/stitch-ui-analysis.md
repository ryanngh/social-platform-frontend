# Stitch UI Analysis

## Source
D:\Mo3Studio\Facebook-like platform\stitch_social_profile_feed_ui\stitch_social_profile_feed_ui

## Screens Discovered (32 total)

### Authentication (Desktop + Mobile)
- Sign In screen
- Sign Up Step 1 (Basic info)
- Sign Up Step 2 (Profile & Security)
- Sign Up Step 3 Finish
- Sign Up Step 3 Success state
- Sign Up Step 3 Resent email state
- Sign Up Step 3 Expired link state
- Mobile Sign In screen

### Home Feed (Desktop + Mobile)
- Home Feed main screen
- Home Feed empty state
- Home Feed skeleton loading state
- Home Feed network error state
- Home Feed "all caught up" state
- Home Feed create post modal
- Mobile variants of all above

### Profile (Desktop + Mobile)
- Profile screen (own profile)
- Profile visitor view
- Profile edit profile modal
- Profile empty posts state
- Profile private account state
- Profile skeleton loading state
- Mobile variants of all above

## Design System

### Typography
- **Font**: Be Vietnam Pro (400, 500, 600, 700, 800)
- **Headings**: tight tracking (-0.01em), bold/extrabold
- **Body**: text-sm (14px), regular weight
- **Small/Meta**: text-xs (12px), text-[11px]

### Colors
- **Brand Primary**: #004AC6
- **Brand Dark**: #003A9F
- **Brand Light**: #EFF6FF
- **Background Canvas**: #FAFAFB
- **Surface/Cards**: #FFFFFF
- **Text Heading**: #1F2937
- **Text Body**: #4B5563
- **Text Muted**: #9CA3AF
- **Border**: #E5E7EB, border-gray-100
- **Error**: #EF4444

### Layout Structure (Desktop)
- **Max Width**: 1340px centered
- **Left Sidebar**: 260px fixed
- **Center Feed**: 640px
- **Right Sidebar**: 338px
- **Gap**: 24px (gap-6)
- **Top Nav**: h-16 fixed

### Component Design Rules
- **Cards**: bg-white rounded-3xl shadow-sm border border-gray-100
- **Navigation items**: rounded-2xl px-4 py-2.5, active: bg-[#EFF6FF]
- **Buttons Primary**: bg-[#004AC6] rounded-full or rounded-lg
- **Buttons Secondary**: bg-[#EFF6FF] text-[#003A9F] rounded-full
- **Inputs**: rounded-lg border-gray-200 focus:ring-[#004AC6]
- **Avatars**: rounded-full with border
- **Avatar sizes**: w-7 (reply), w-9 (nav), w-10 (post author), w-14 (sidebar), w-24/w-28 (profile)

### Auth Screen Layout
- Split layout: left branding (FAFAFC bg) + right form (white bg)
- Max width: 1200px (sign-in), 1240px (sign-up)
- Rounded-[24px] or rounded-2xl container card
- Responsive: stacks vertically on mobile

### Mobile Design
- Single column layout
- Bottom navigation bar
- Full-width cards (edge-to-edge)
- Abbreviated top bar

## Assets
- image.png_1 through image.png_7: component/screen screenshots for reference
- modern_minimalist_auth_canvas: DESIGN.md with auth design system details
