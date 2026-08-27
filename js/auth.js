import {signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {auth} from "./firebase.js"; import {state} from "./state.js";
export const initAuth=cb=>onAuthStateChanged(auth,u=>{state.user=u;cb(u)});
export const login=(e,p)=>signInWithEmailAndPassword(auth,e,p); export const register=(e,p)=>createUserWithEmailAndPassword(auth,e,p); export const logout=()=>signOut(auth);
