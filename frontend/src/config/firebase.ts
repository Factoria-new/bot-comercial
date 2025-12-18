// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDVFbZA7vrAJfPS71GwrWPvzj1zrx6reIU",
    authDomain: "bot-comercial-9dc5e.firebaseapp.com",
    projectId: "bot-comercial-9dc5e",
    storageBucket: "bot-comercial-9dc5e.firebasestorage.app",
    messagingSenderId: "458732694462",
    appId: "1:458732694462:web:d40568b5258cebf4e2a7ef",
    measurementId: "G-8VLHYRKP6B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
