"use strict";

/*==========================================================
  TOYSGURU — REAL AUTH (Firebase)
==========================================================*/

const tabs = document.querySelectorAll(".gateTab");
const forms = document.querySelectorAll(".gateForm");

function showTab(name) {
    tabs.forEach(tab =>
        tab.classList.toggle("active", tab.dataset.tab === name)
    );

    forms.forEach(form =>
        form.classList.toggle("active", form.dataset.form === name)
    );

    clearErrors();
}

tabs.forEach(tab =>
    tab.addEventListener("click", () => showTab(tab.dataset.tab))
);

const params = new URLSearchParams(window.location.search);

showTab(
    params.get("mode") === "signup"
        ? "signup"
        : "login"
);

/*==========================================================
CLEAR ERRORS
==========================================================*/

function clearErrors() {

    document.querySelectorAll(".gateError").forEach(el => {
        el.classList.remove("show");
        el.textContent = "";
    });

    document
        .getElementById("accountAssistant")
        ?.classList.add("hidden");
}

/*==========================================================
SHOW ERROR
==========================================================*/

function showError(formName, message) {

    const el = document.querySelector(
        `.gateForm[data-form="${formName}"] .gateError`
    );

    if (!el) return;

    el.textContent = message;
    el.classList.add("show");
}

/*==========================================================
ACCOUNT ASSISTANT
==========================================================*/

function showAccountAssistant(errorCode, email = "") {

    const assistant = document.getElementById("accountAssistant");
    const title = document.getElementById("assistantTitle");
    const message = document.getElementById("assistantMessage");
    const button = document.getElementById("assistantButton");

    if (errorCode === "auth/user-not-found") {

        title.textContent = "Looks like you're new here.";

        message.textContent =
            "Create your ToysGuru account and start building your collection.";

        button.textContent = "Create Account";

    } else {

        title.textContent = "Need another way in?";

        message.textContent =
            "You can also continue using your Google account.";

        button.textContent = "Go to Sign Up";
    }

    assistant.classList.remove("hidden");

    button.onclick = () => {

        showTab("signup");

        document.getElementById("suEmail").value = email;

        document.getElementById("suName").focus();

        assistant.classList.add("hidden");
    };
}

/*==========================================================
PROFILE HELPER
==========================================================*/

async function createProfileIfNeeded(user, displayName = "") {

    const ref = db.collection("profiles").doc(user.uid);

    const snap = await ref.get();

    if (snap.exists) return;

    await ref.set({

        name: displayName || user.displayName || "",

        email: user.email,

        photoURL: user.photoURL || "",

        isAdmin: false,

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    });

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

        const cred = await auth.createUserWithEmailAndPassword(
            email,
            password
        );

        // Save the user's display name in Firebase Authentication
        await cred.user.updateProfile({
            displayName: name
        });

        // Create Firestore profile (only if it doesn't already exist)
        await createProfileIfNeeded(
            cred.user,
            name
        );

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

        showAccountAssistant(error.code, email);

    }

});


/*==========================================================
GOOGLE SIGN IN
==========================================================*/

const googleLoginBtn = document.getElementById("googleLoginBtn");

googleLoginBtn?.addEventListener("click", async () => {

    clearErrors();

    const provider = new firebase.auth.GoogleAuthProvider();

    try {

        const result = await auth.signInWithPopup(provider);

        await createProfileIfNeeded(
            result.user,
            result.user.displayName
        );

        window.location.href = "marketplace.html";

    } catch (error) {

        showError("login", error.message);

    }

});


/*==========================================================
ERROR MESSAGES
==========================================================*/

function friendlyError(error){

    switch (error.code) {

        case "auth/email-already-in-use":
            return "An account with this email already exists — try logging in.";

        case "auth/invalid-email":
            return "That email address doesn't look right.";

        case "auth/weak-password":
            return "Password needs at least 6 characters.";

        case "auth/popup-closed-by-user":
            return "Google sign in was cancelled.";

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Email or password is incorrect.";

        default:
            return error.message;
    }

}