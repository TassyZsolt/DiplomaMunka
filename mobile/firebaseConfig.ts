// mobile/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeZ_n3eXvjEqyVSdwYzLZ26joQsf1mEzk",
  authDomain: "fitapp-b87a6.firebaseapp.com",
  projectId: "fitapp-b87a6",
  storageBucket: "fitapp-b87a6.firebasestorage.app",
  messagingSenderId: "515136117027",
  appId: "1:515136117027:web:c2e89bef2b1e62a3819496",
  measurementId: "G-RJ1LNZ4F2L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
