import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase web configuration is public. Database rules enforce write access.
const firebaseConfig = {
  apiKey: "AIzaSyDU1Zx_6JMz0XkX5jfGKc-Uy-704erM4zw",
  authDomain: "akkh-jlpt.firebaseapp.com",
  databaseURL:
    "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "akkh-jlpt",
  storageBucket: "akkh-jlpt.firebasestorage.app",
  messagingSenderId: "756645666314",
  appId: "1:756645666314:web:2b9e280402678202ec89f3",
  measurementId: "G-8V6JSKTVVG",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
