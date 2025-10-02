// /src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Initialize Firestore with long polling for better compatibility
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  console.log('Firestore initialized successfully with long polling');
} catch (error) {
  console.error('Firestore init error:', error);
  throw error;
}

export { db };

// Analytics (only in browser + if supported)
export const analytics = (async () =>
  typeof window !== "undefined" && (await isSupported())
    ? getAnalytics(app)
    : null)();

export { app };
