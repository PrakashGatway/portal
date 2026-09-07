import { initializeApp, getApps, getApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

const firebaseConfig = {
  apiKey: "AIzaSyDhllsJ3c29AaoW6_E1FB1ta3HBAD4O5oY",
  authDomain: "ooshasprep-d3a3d.firebaseapp.com",
  projectId: "ooshasprep-d3a3d",
  storageBucket: "ooshasprep-d3a3d.firebasestorage.app",
  messagingSenderId: "371957412702",
  appId: "1:371957412702:web:9a209bb514bc69f0f195cf",
  measurementId: "G-CGJREFJKRK"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export default app;