import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCImzOd64JL7cOeomoKscuczfi91ffbu-A",
  authDomain: "mygnanedu.firebaseapp.com",
  projectId: "mygnanedu",
  storageBucket: "mygnanedu.firebasestorage.app",
  messagingSenderId: "743990933673",
  appId: "1:743990933673:web:afa9b182234c56bc5911b8",
  measurementId: "G-Z4LMK0J02H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
