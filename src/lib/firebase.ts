// /src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCKz_hVm9a34Us36M4Uu7MlIEE47wH-5Ds",
  authDomain: "live-tv-pro-302b8.firebaseapp.com",
  projectId: "live-tv-pro-302b8",
  storageBucket: "live-tv-pro-302b8.appspot.com",
  messagingSenderId: "536478798061",
  appId: "1:536478798061:web:eadca349b64e14c48ffce4",
  measurementId: "G-LW16BGCNZQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Initialize Analytics if supported
export const analytics = (async () => (await isSupported()) ? getAnalytics(app) : null)();
