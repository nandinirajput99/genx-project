// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJ6jqt2tBubfJJQjGqCqu-MMRT5wZR9_s",
  authDomain: "genx-project-56007.firebaseapp.com",
  projectId: "genx-project-56007",
  storageBucket: "genx-project-56007.firebasestorage.app",
  messagingSenderId: "712352525044",
  appId: "1:712352525044:web:b1283940e4c814ee1d4ca1",
  measurementId: "G-5VHP99YKRS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);