# Live TV Pro - IPTV Streaming Platform

## Overview
A modern IPTV streaming application built with React, TypeScript, Vite, and Firebase. This application allows users to stream live TV channels organized by categories, manage favorites, and track recently watched content. Includes an admin panel for managing categories and channels.

## Recent Changes
- **October 2, 2025**: Performance and UX improvements
  - **Routing Migration**: Migrated from React Router to Wouter for browser-native navigation
  - **Performance**: Implemented code-splitting with React.lazy and Suspense for faster initial load
  - **Video Player**: Added landscape orientation lock for fullscreen on mobile devices
  - **Video Player**: Replaced settings Drawer with in-container panel for fullscreen visibility
  - Configured for Replit environment (port 5000, host 0.0.0.0, allowedHosts: ['*'])
  - Set up workflow and deployment configuration

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: Wouter (lightweight, browser-native navigation)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Video Streaming**: HLS.js and Shaka Player for M3U8/DASH stream playback
- **Backend**: Firebase (Authentication + Firestore)
- **State Management**: React Query (TanStack Query)
- **Theme**: next-themes with dark mode support
- **Performance**: Code-splitting with React.lazy and Suspense

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Header.tsx      # App header
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── BottomNav.tsx   # Mobile bottom navigation
│   └── VideoPlayer.tsx # HLS video player
├── contexts/           # React contexts
│   ├── FavoritesContext.tsx
│   └── RecentsContext.tsx
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client (if used)
├── lib/                # Utilities and configurations
│   ├── firebase.ts     # Firebase configuration
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Favorites.tsx
│   ├── CategoryChannels.tsx
│   ├── ChannelPlayer.tsx
│   └── Admin.tsx
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

### Key Features
1. **Category-based Channel Organization**: Browse channels by categories
2. **Live Streaming**: HLS/M3U8 video streaming with custom controls
3. **Favorites Management**: Save and manage favorite channels
4. **Recent Viewing**: Track recently watched channels
5. **Admin Panel**: Manage categories and channels (requires Firebase authentication)
6. **Responsive Design**: Works on desktop and mobile devices
7. **Dark Mode**: Built-in theme switching

## Development Setup

### Prerequisites
- Node.js 20.x
- Firebase project (for backend services)

### Environment Configuration
The application uses Firebase for backend services. You need to configure Firebase credentials in `src/lib/firebase.ts`.

### Running the Application
- **Development**: The workflow "Start application" runs `npm run dev` on port 5000
- **Build**: `npm run build` - Compiles TypeScript and builds for production
- **Production Preview**: `npm run start` - Serves the built app

### Deployment
Configured for Replit Autoscale deployment:
- Build command: `npm run build`
- Run command: `npm run start`
- Port: 5000

## Firebase Setup Required
This application requires Firebase configuration for:
1. **Authentication**: Admin user authentication
2. **Firestore Database**: Categories and channels storage

See README.md for detailed Firebase setup instructions.

## Important Notes
- The Vite dev server is configured to accept all hosts for Replit proxy compatibility
- Port 5000 is used for both development and production
- Dependencies installed with `--legacy-peer-deps` due to TypeScript ESLint version conflicts
