"use strict";

/*==========================================================
  TOYSGURU — REAL AUTH (Firebase)
  Requires firebase-*-compat CDN scripts + firebaseClient.js
  loaded first (see auth.html).
==========================================================*/

const tabs = document.querySelectorAll(".gateTab");
const forms = document.querySelectorAll(".gateForm");

function showTab(name){
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    forms.forEach(f => f.classList.toggle("active", f.dataset.form === name));
    clearErrors();
}

tabs.forEach(tab => tab.addEventListener("click", () => showTab(tab.dataset.tab)));

const params = new URLSearchParams(window.location.search);
showTab(params.get("mode") === "signup" ? "signup" : "login");

function clearErrors(){
    document.querySelectorAll(".gateError").forEach(el => {
        el.classList.remove("show");
        el.textContent = "";
    });
}

function showError(formName, message){
    const el = document.querySelector(`.gateForm[data-form="${formName}"] .gateError`);
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
}

/*==========================================================
SIGN UP
==========================================================*/

const signupForm = document.getElementById("signupForm");
signupForm?.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById("suName").value.trim();
    const email = document.getElementById("suEmail").value.trim().toLowerCase();
    const password = document.getElementById("suPassword").value;
    const confirm = document.getElementById("suConfirm").value;

    if (!name || !email || !password) {
        showError("signup", "Please fill in every field.");
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showError("signup", "Enter a valid email address.");
        return;
    }
    if (password.length < 6) {
        showError("signup", "Password needs at least 6 characters.");
        return;
    }
    if (password !== confirm) {
        showError("signup", "Passwords don't match.");
        return;
    }

    const submitBtn = signupForm.querySelector(".gateSubmit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);

        // Firebase Auth only stores the login itself — we store the
        // name and admin flag ourselves in a "profiles" document.
        await db.collection("profiles").doc(cred.user.uid).set({
            name,
            isAdmin: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = "marketplace.html";
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create account";
        showError("signup", friendlyError(error));
    }
});

/*==========================================================
LOGIN
==========================================================*/

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById("liEmail").value.trim().toLowerCase();
    const password = document.getElementById("liPassword").value;

    if (!email || !password) {
        showError("login", "Please fill in every field.");
        return;
    }

    const submitBtn = loginForm.querySelector(".gateSubmit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Entering…";

    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = "marketplace.html";
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enter the vault";
        showError("login", friendlyError(error));
    }
});

/*==========================================================
ERROR MESSAGES — Firebase error codes translated to plain English
==========================================================*/

function friendlyError(error){
    switch (error.code) {
        case "auth/email-already-in-use":
            return "An account with this email already exists — try logging in.";
        case "auth/invalid-email":
            return "That email address doesn't look right.";
        case "auth/weak-password":
            return "Password needs at least 6 characters.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Email or password is incorrect.";
        default:
            return error.message;
    }
}