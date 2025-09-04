// frontend/src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-n1Ro87Lk3mm6j_l6Tke11aLgXHkVJvE",
  authDomain: "teamtrack-93cae.firebaseapp.com",
  projectId: "teamtrack-93cae",
  storageBucket: "teamtrack-93cae.firebasestorage.app",
  messagingSenderId: "860441948458",
  appId: "1:860441948458:web:ca76a7eeb7a4111be4ee53"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
