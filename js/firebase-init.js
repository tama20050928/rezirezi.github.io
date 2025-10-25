// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChFYe6TCCaFrLfOUdwBL-AJf_chmtYoPg",
  authDomain: "sampledata-c15cf.firebaseapp.com",
  projectId: "sampledata-c15cf",
  storageBucket: "sampledata-c15cf.firebasestorage.app",
  messagingSenderId: "195459478252",
  appId: "1:195459478252:web:5f85b84ec772875dd2ebc9",
  measurementId: "G-CVM6P1RG1H"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase初期化完了:", db);

// 他のJSから利用できるようにexport
export { db };
