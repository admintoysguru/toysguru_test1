"use strict";

const adminLoginForm = document.getElementById("adminLoginForm");
const googleAdminBtn = document.getElementById("googleAdminBtn");


/* =========================================================
   ERROR HELPERS
========================================================= */

function showAdminError(message) {
    const el = document.getElementById("adminError");

    if (!el) return;

    el.textContent = message;
    el.classList.add("show");
}

function clearAdminError() {
    const el = document.getElementById("adminError");

    if (!el) return;

    el.textContent = "";
    el.classList.remove("show");
}


/* =========================================================
   CHECK ADMIN ACCESS
========================================================= */

async function checkAdminAccess(user) {

    console.log("Checking admin access for:", user.email);
    console.log("Firebase UID:", user.uid);

    const profileDoc = await db
        .collection("profiles")
        .doc(user.uid)
        .get();

    console.log("Profile exists:", profileDoc.exists);

    if (!profileDoc.exists) {
        console.error("No profile document found for UID:", user.uid);

        await auth.signOut();

        return false;
    }

    const profileData = profileDoc.data();

    console.log("Profile data:", profileData);
    console.log("isAdmin:", profileData.isAdmin);

    if (!profileData.isAdmin) {
        await auth.signOut();

        return false;
    }

    return true;
}


/* =========================================================
   EMAIL + PASSWORD LOGIN
========================================================= */

adminLoginForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    clearAdminError();

    const emailInput = document.getElementById("adEmail");
    const passwordInput = document.getElementById("adPassword");

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
        showAdminError("Please fill in both fields.");
        return;
    }

    const submitBtn = adminLoginForm.querySelector(".gateSubmit");

    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";


    /* ---------------------------------------------------------
       STEP 1: FIREBASE EMAIL/PASSWORD AUTHENTICATION
    --------------------------------------------------------- */

    let user;

    try {

        const cred = await auth.signInWithEmailAndPassword(
            email,
            password
        );

        user = cred.user;

        console.log("Email/password login successful.");
        console.log("Logged-in email:", user.email);
        console.log("Firebase UID:", user.uid);

    } catch (error) {

        console.error("=================================");
        console.error("EMAIL LOGIN FAILED");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("=================================");

        submitBtn.disabled = false;
        submitBtn.textContent = "Enter dashboard";

        let message = "Email or password is incorrect.";

        if (error.code === "auth/user-not-found") {
            message = "No account exists with this email.";
        }
        else if (error.code === "auth/wrong-password") {
            message = "The password is incorrect.";
        }
        else if (error.code === "auth/invalid-credential") {
            message = "The email or password is incorrect.";
        }
        else if (error.code === "auth/invalid-email") {
            message = "Please enter a valid email address.";
        }
        else if (error.code === "auth/user-disabled") {
            message = "This account has been disabled.";
        }
        else if (error.code === "auth/too-many-requests") {
            message = "Too many login attempts. Please try again later.";
        }
        else if (error.code === "auth/network-request-failed") {
            message = "Network error. Please check your internet connection.";
        }

        showAdminError(message);

        return;
    }


    /* ---------------------------------------------------------
       STEP 2: CHECK FIRESTORE ADMIN PROFILE
    --------------------------------------------------------- */

    try {

        const isAdmin = await checkAdminAccess(user);

        if (!isAdmin) {

            submitBtn.disabled = false;
            submitBtn.textContent = "Enter dashboard";

            showAdminError(
                "This account doesn't have owner access."
            );

            return;
        }

        console.log("Admin access confirmed.");
        console.log("Redirecting to admin dashboard...");

        window.location.href = "admin-dashboard.html";

    } catch (error) {

        console.error("=================================");
        console.error("ADMIN PROFILE CHECK FAILED");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("=================================");

        try {
            await auth.signOut();
        } catch (signOutError) {
            console.error("Sign-out error:", signOutError);
        }

        submitBtn.disabled = false;
        submitBtn.textContent = "Enter dashboard";

        if (
            error.code === "permission-denied" ||
            error.code === "firestore/permission-denied"
        ) {
            showAdminError(
                "Unable to verify owner access. Please check your account permissions."
            );
        } else {
            showAdminError(
                "Unable to verify owner access. Please try again."
            );
        }
    }
});


/* =========================================================
   GOOGLE LOGIN
========================================================= */

googleAdminBtn?.addEventListener("click", async () => {

    clearAdminError();

    googleAdminBtn.disabled = true;
    googleAdminBtn.textContent = "Checking…";


    /* ---------------------------------------------------------
       STEP 1: GOOGLE AUTHENTICATION
    --------------------------------------------------------- */

    let user;

    try {

        const provider = new firebase.auth.GoogleAuthProvider();

        const result = await auth.signInWithPopup(provider);

        user = result.user;

        console.log("=================================");
        console.log("GOOGLE LOGIN SUCCESSFUL");
        console.log("Google email:", user.email);
        console.log("Firebase UID:", user.uid);
        console.log("=================================");

    } catch (error) {

        console.error("=================================");
        console.error("GOOGLE LOGIN FAILED");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("=================================");

        googleAdminBtn.disabled = false;
        googleAdminBtn.textContent = "Continue with Google";


        let message = "Google sign-in failed. Please try again.";

        if (error.code === "auth/popup-closed-by-user") {
            message = "Google sign-in was cancelled.";
        }
        else if (error.code === "auth/popup-blocked") {
            message = "Your browser blocked the Google sign-in popup.";
        }
        else if (error.code === "auth/unauthorized-domain") {
            message = "This website domain is not authorized for Google login.";
        }
        else if (error.code === "auth/network-request-failed") {
            message = "Network error. Please check your internet connection.";
        }
        else if (error.code === "auth/account-exists-with-different-credential") {
            message = "An account already exists with this email using a different login method.";
        }

        showAdminError(message);

        return;
    }


    /* ---------------------------------------------------------
       STEP 2: CHECK FIRESTORE ADMIN PROFILE
    --------------------------------------------------------- */

    try {

        const isAdmin = await checkAdminAccess(user);

        if (!isAdmin) {

            googleAdminBtn.disabled = false;
            googleAdminBtn.textContent = "Continue with Google";

            showAdminError(
                "This Google account doesn't have owner access."
            );

            return;
        }

        console.log("Google admin access confirmed.");
        console.log("Redirecting to admin dashboard...");

        window.location.href = "admin-dashboard.html";

    } catch (error) {

        console.error("=================================");
        console.error("GOOGLE ADMIN PROFILE CHECK FAILED");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("=================================");

        try {
            await auth.signOut();
        } catch (signOutError) {
            console.error("Sign-out error:", signOutError);
        }

        googleAdminBtn.disabled = false;
        googleAdminBtn.textContent = "Continue with Google";

        if (
            error.code === "permission-denied" ||
            error.code === "firestore/permission-denied"
        ) {
            showAdminError(
                "Unable to verify owner access. Please check your account permissions."
            );
        } else {
            showAdminError(
                "Unable to verify owner access. Please try again."
            );
        }
    }
});