import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1JET_UNj0P0PT22vggM3ljwnf6wWFcYU",
  authDomain: "kor-daily.firebaseapp.com",
  projectId: "kor-daily",
  storageBucket: "kor-daily.firebasestorage.app",
  messagingSenderId: "856422019923",
  appId: "1:856422019923:web:2297cebc2241bfbf6a27a6"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
