import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAP_x1gGc46a2xnm3qtVRmJrgP-SaxCmeU",
  authDomain: "construtech-9211b.firebaseapp.com",
  projectId: "construtech-9211b",
  storageBucket: "construtech-9211b.firebasestorage.app",
  messagingSenderId: "743954486295",
  appId: "1:743954486295:web:9e3ac81d01730d505df852",
  measurementId: "G-GT107ZJS40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
