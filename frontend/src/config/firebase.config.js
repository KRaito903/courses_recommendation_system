// src/config/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBAihn-xAfxEz7rkvHGQoI9i0i84tNFGCg",
  authDomain: "recomendation-course.firebaseapp.com",
  projectId: "recomendation-course",
  storageBucket: "recomendation-course.firebasestorage.app",
  messagingSenderId: "1088364549317",
  appId: "1:1088364549317:web:34ec436484835e93350cac",
  measurementId: "G-9BN7PSQ3FQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Xuất 'auth' để dùng cho login/register