"use strict";

/*==========================================================
DEMO AUTH — stored in localStorage on this browser only.
Not secure (plain-text passwords, no server). Good enough to
demonstrate the flow; swap for a real backend later.
==========================================================*/

const USERS_KEY = "toysguru_users";
const SESSION_KEY = "toysguru_session";

function getUsers(){
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users){
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function setSession(user){
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
}

/*==========================================================
TAB SWITCHING
==========================================================*/

const tabs = document.querySelectorAll(".gateTab");
const forms = document.querySelectorAll(".gateForm");

function showTab(name){
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    forms.forEach(f => f.classList.toggle("active", f.dataset.form === name));
    clearErrors();
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

// Preselect tab from ?mode=login|signup
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
signupForm?.addEventListener("submit", e => {
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

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showError("signup", "An account with this email already exists — try logging in.");
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);

    window.location.href = "marketplace.html";
});

/*==========================================================
LOGIN
==========================================================*/

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById("liEmail").value.trim().toLowerCase();
    const password = document.getElementById("liPassword").value;

    if (!email || !password) {
        showError("login", "Please fill in every field.");
        return;
    }

    const users = getUsers();
    const match = users.find(u => u.email === email && u.password === password);

    if (!match) {
        showError("login", "Email or password is incorrect.");
        return;
    }

    setSession(match);
    window.location.href = "marketplace.html";
});