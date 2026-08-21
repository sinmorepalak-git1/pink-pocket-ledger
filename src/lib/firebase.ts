import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBH-Hk3czecTtUhjictPm7Z3ejsJJbppI4",
  authDomain: "expense-tracker-df273.firebaseapp.com",
  projectId: "expense-tracker-df273",
  storageBucket: "expense-tracker-df273.firebasestorage.app",
  messagingSenderId: "996669260671",
  appId: "1:996669260671:web:af5067bcd4a2757bb9904a",
  measurementId: "G-KNWHKSTP6E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
