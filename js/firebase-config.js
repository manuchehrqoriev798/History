// Import Firebase modules from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1Qr-mxA7KtuD_CszDtuo5WT13e2JlUI8",
  authDomain: "history-platform.firebaseapp.com",
  databaseURL: "https://history-platform-default-rtdb.firebaseio.com",
  projectId: "history-platform",
  storageBucket: "history-platform.firebasestorage.app",
  messagingSenderId: "160494346743",
  appId: "1:160494346743:web:e7c164996eaad632f0cef2",
  measurementId: "G-L47L6D9PD7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
