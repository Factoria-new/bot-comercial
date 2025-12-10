// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuWTvXx5WskPw9z2Il-0keFrPIkcpuYiU",
    authDomain: "factoriabotcomercial.firebaseapp.com",
    projectId: "factoriabotcomercial",
    storageBucket: "factoriabotcomercial.firebasestorage.app",
    messagingSenderId: "187049465604",
    appId: "1:187049465604:web:23d362b2534229a34c2251",
    measurementId: "G-RZJBWV5KG3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
