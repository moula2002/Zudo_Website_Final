import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-CBCD3mhg3EWMfCRdYG9LCX7-qBpJD-0",
  authDomain: "zudo-b55cc.firebaseapp.com",
  projectId: "zudo-b55cc",
  storageBucket: "zudo-b55cc.firebasestorage.app",
  messagingSenderId: "782970415750",
  appId: "1:782970415750:web:f78f24e89555d699f7ff07",
  measurementId: "G-28T5XM9LFW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();