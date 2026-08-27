import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { state } from "./state.js";

export function watchAuth(callback){ return onAuthStateChanged(auth, user => { state.user = user; callback(user); }); }
export function login(email,password){ return signInWithEmailAndPassword(auth,email,password); }
export function register(email,password){ return createUserWithEmailAndPassword(auth,email,password); }
export function logout(){ return signOut(auth); }
