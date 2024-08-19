// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzZMBCRgWHjRn1gL2umKadATEUytrAQkA",
  authDomain: "arproject-b2e7b.firebaseapp.com",
  databaseURL: "https://arproject-b2e7b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "arproject-b2e7b",
  storageBucket: "arproject-b2e7b.appspot.com",
  messagingSenderId: "1078776578060",
  appId: "1:1078776578060:web:798a417cc282a9a149ee29",
  measurementId: "G-NZL9ZDREN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export default app;