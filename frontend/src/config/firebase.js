// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB36lFmegnkRqLaB__ob9-mUFPVhuOQ6x4",
  authDomain: "sampreact-b3081.firebaseapp.com",
  databaseURL: "https://sampreact-b3081-default-rtdb.firebaseio.com",
  projectId: "sampreact-b3081",
  storageBucket: "sampreact-b3081.firebasestorage.app",
  messagingSenderId: "541195098255",
  appId: "1:541195098255:web:3225d548673e617bd278fa",
  measurementId: "G-QM3MFKLJD3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
