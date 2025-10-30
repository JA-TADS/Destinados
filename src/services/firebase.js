import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnCWJY4NobiYPHepokjn3Ba0JMGQmAn18",
  authDomain: "destinados-7f2ff.firebaseapp.com",
  projectId: "destinados-7f2ff",
  storageBucket: "destinados-7f2ff.firebasestorage.app",
  messagingSenderId: "565138365383",
  appId: "1:565138365383:web:d036ad104866b6f84e17e2",
  measurementId: "G-1H0CY7HQBG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


