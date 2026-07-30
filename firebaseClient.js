"use strict";

/*==========================================================
  TOYSGURU — FIREBASE CLIENT
  Loaded after the firebase-app-compat / firebase-auth-compat /
  firebase-firestore-compat CDN scripts, before any page's own JS.

  <script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore-compat.js"></script>
  <script src="firebaseClient.js"></script>
  <script src="marketplace.js"></script>  (or auth.js, admin.js, etc.)

  This config is meant to be public — it's safe to ship in
  frontend code. Firestore security rules (see firestore.rules)
  are what actually control who can read/write what.
==========================================================*/

const firebaseConfig = {
  apiKey: "AIzaSyD03-eXuzjs78dG2dsgILwPBpt6Il2gXX4",
  authDomain: "toysguru-d2472.firebaseapp.com",
  projectId: "toysguru-d2472",
  storageBucket: "toysguru-d2472.firebasestorage.app",
  messagingSenderId: "253834421033",
  appId: "1:253834421033:web:696afa49c427ec783e0d38"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();