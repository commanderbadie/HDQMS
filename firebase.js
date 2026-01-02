import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyByUH4NBCvMStu2c9_YFjabk7X7vKdBmZk",
  authDomain: "dqmsnew.firebaseapp.com",
  databaseURL: "https://dqmsnew-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dqmsnew",
  storageBucket: "dqmsnew.firebasestorage.app",
  messagingSenderId: "935569591494",
  appId: "1:935569591494:web:55cbc43fecc940e00adbc7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
