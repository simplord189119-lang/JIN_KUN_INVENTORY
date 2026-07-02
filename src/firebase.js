import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAObp032ZCW3yaoZWrtR_86Zo79v58VJIA",
  authDomain: "jin-kun-inventory.firebaseapp.com",
  projectId: "jin-kun-inventory",
  storageBucket: "jin-kun-inventory.firebasestorage.app",
  messagingSenderId: "478424591054",
  appId: "1:478424591054:web:b0c626f4c45b8b74b17e9f",
  measurementId: "G-9NZ0WZ8ZXW",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
