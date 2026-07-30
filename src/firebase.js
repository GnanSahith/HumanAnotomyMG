// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCImzOd64JL7cOeomoKscuczfi91ffbu-A",
  authDomain: "mygnanedu.firebaseapp.com",
  projectId: "mygnanedu",
  storageBucket: "mygnanedu.firebasestorage.app",
  messagingSenderId: "743990933673",
  appId: "1:743990933673:web:afa9b182234c56bc5911b8",
  measurementId: "G-Z4LMK0J02H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
