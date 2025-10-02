# Live TV Pro - IPTV Streaming Platform

A modern IPTV streaming application built with React, TypeScript, and Firebase. Stream live TV channels organized by categories with favorites management and admin controls.

## Features

### User Features
- **Category-based browsing** - Channels organized by categories
- **Live streaming** - HLS video streaming with custom player controls
- **Favorites system** - Save and manage favorite channels
- **Recent viewing** - Track recently watched channels
- **Search functionality** - Find channels quickly
- **Responsive design** - Works on desktop and mobile

### Admin Features
- **Category management** - Add, edit, delete channel categories
- **Channel management** - Add, edit, delete streaming channels
- **Authentication** - Secure admin access
- **Stream URL management** - Support for M3U8 streams with auth cookies

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)

2. Enable **Authentication** and **Firestore Database**

3. In Authentication > Sign-in method, enable **Email/Password**

4. Create an admin user in Authentication > Users

5. Get your Firebase config from Project Settings > General > Your apps > Web app

6. Update `src/lib/firebase.ts` with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Firestore Database Structure

Create these collections in your Firestore database:

#### Categories Collection (`categories`)
```javascript
{
  name: "Movies",           // Category name
  slug: "movies",          // URL-friendly slug
  iconUrl: "https://..."   // Category icon URL
}
```

#### Channels Collection (`channels`)
```javascript
{
  name: "Channel Name",        // Channel display name
  logoUrl: "https://...",      // Channel logo URL
  streamUrl: "https://...",    // M3U8 stream URL
  categoryId: "categoryId",    // Reference to category
  categoryName: "Movies",      // Category name for quick access
  authCookie: "optional"       // Optional authentication cookie
}
```

### 3. Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Categories - read-only for public, write for authenticated users
    match /categories/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Channels - read-only for public, write for authenticated users
    match /channels/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Admin Access

1. Navigate to `/admin`
2. Sign in with your Firebase admin credentials
3. Manage categories and channels from the admin dashboard

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Video Streaming**: HLS.js for M3U8 stream playback
- **Backend**: Firebase (Authentication + Firestore)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Favorites, Recents)
├── hooks/              # Custom React hooks
├── lib/                # Firebase configuration
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Stream Format Support

- **HLS (HTTP Live Streaming)** - Primary format (.m3u8)
- **Authentication** - Support for cookie-based auth
- **Adaptive bitrate** - Automatic quality adjustment
- **Cross-browser compatibility** - Works in modern browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Create a pull request

## License

This project is open source and available under the MIT License.