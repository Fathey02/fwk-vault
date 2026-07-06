import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDLMssIs5ExCQMiAQvP7UKcbbYEL8ZRSHs",
  authDomain: "emerald-logic-rw1xt.firebaseapp.com",
  projectId: "emerald-logic-rw1xt",
  storageBucket: "emerald-logic-rw1xt.firebasestorage.app",
  messagingSenderId: "541396461554",
  appId: "1:541396461554:web:daa2451fc0762400ff2d6b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided by AI Studio and enable long-polling
const dbId = "ai-studio-csinformationlib-40b823c2-b4ae-48a7-baaf-99a1fb3e954c";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId);
