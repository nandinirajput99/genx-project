import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJ6jqt2tBubfJJQjGqCqu-MMRT5wZR9_s",
  authDomain: "genx-project-56007.firebaseapp.com",
  projectId: "genx-project-56007",
  storageBucket: "genx-project-56007.firebasestorage.app",
  messagingSenderId: "712352525044",
  appId: "1:712352525044:web:b1283940e4c814ee1d4ca1",
  measurementId: "G-5VHP99YKRS"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;