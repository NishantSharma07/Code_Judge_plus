import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these values with your own Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC4m3UE0M79dDzCd0zToMnxNcOUHW7yBFo",
  authDomain: "codejudge-plus.firebaseapp.com",
  projectId: "codejudge-plus",
  storageBucket: "codejudge-plus.appspot.com", // <-- FIXED HERE
  messagingSenderId: "552616782341",
  appId: "1:552616782341:web:d68ee953672d4797d34a6c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
