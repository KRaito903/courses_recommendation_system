// src/config/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD75TsLgEzu9rrsVepwhxrsns9mQX74e9g",
  authDomain: "system-aa3a6.firebaseapp.com",
  projectId: "system-aa3a6",
  storageBucket: "system-aa3a6.firebasestorage.app",
  messagingSenderId: "923081697220",
  appId: "1:923081697220:web:a8a838acff61e4cf98a691",
  measurementId: "G-LYVV05RYXJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Xuất 'auth' để dùng cho login/register