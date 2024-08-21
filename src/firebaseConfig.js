// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";  // Import Firebase Auth
import { getFirestore } from "firebase/firestore"; // Import Firestore if you're using it

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoVBD-DaDzcR31iUBmacphpb_hOMCe-IQ",
  authDomain: "basketball-quiz-website.firebaseapp.com",
  projectId: "basketball-quiz-website",
  storageBucket: "basketball-quiz-website.appspot.com",
  messagingSenderId: "90271247095",
  appId: "1:90271247095:web:b51abdc12096b7a7fe41f2",
  measurementId: "G-D78H67B60C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);  // Initialize Firebase Auth
const db = getFirestore(app); // Initialize Firestore (if using Firestore)

// Export auth and db so you can use them in other files
export { auth, db };
