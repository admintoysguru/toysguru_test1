"use strict";

/*==========================================================*
 * TOYSGURU — REAL AUTH (Firebase)
 *==========================================================*/


/*==========================================================*
 * TABS
 *==========================================================*/

const tabs = document.querySelectorAll(".gateTab");
const forms = document.querySelectorAll(".gateForm");

function showTab(name) {

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === name
        );
    });

    forms.forEach(form => {
        form.classList.toggle(
            "active",
            form.dataset.form === name
        );
    });

    clearErrors();
}


tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        showTab(tab.dataset.tab);
    });
});


const params = new URLSearchParams(window.location.search);

showTab(
    params.get("mode") === "signup"
        ? "signup"
        : "login"
);


/*==========================================================*
 * CLEAR ERRORS
 *==========================================================*/

function clearErrors() {

    document.querySelectorAll(".gateError").forEach(el => {
        el.classList.remove("show");
        el.textContent = "";
    });

    document
        .getElementById("accountAssistant")
        ?.classList.add("hidden");
}


/*==========================================================*
 * SHOW ERROR
 *==========================================================*/

function showError(formName, message) {

    const el = document.querySelector(
        `.gateForm[data-form="${formName}"] .gateError`
    );

    if (!el) {
        console.error(
            "Could not find error element for form:",
            formName
        );
        return;
    }

    el.textContent = message;
    el.classList.add("show");
}


/*==========================================================*
 * ACCOUNT ASSISTANT
 *==========================================================*/

function showAccountAssistant(errorCode, email = "") {

    const assistant =
        document.getElementById("accountAssistant");

    const title =
        document.getElementById("assistantTitle");

    const message =
        document.getElementById("assistantMessage");

    const button =
        document.getElementById("assistantButton");

    if (!assistant || !title || !message || !button) {
        return;
    }


    if (errorCode === "auth/user-not-found") {

        title.textContent =
            "Looks like you're new here.";

        message.textContent =
            "Create your ToysGuru account and start building your collection.";

        button.textContent =
            "Create Account";

    } else {

        title.textContent =
            "Need another way in?";

        message.textContent =
            "You can also continue using your Google account.";

        button.textContent =
            "Go to Sign Up";
    }


    assistant.classList.remove("hidden");


    button.onclick = () => {

        showTab("signup");

        const signupEmail =
            document.getElementById("suEmail");

        const signupName =
            document.getElementById("suName");

        if (signupEmail) {
            signupEmail.value = email;
        }

        if (signupName) {
            signupName.focus();
        }

        assistant.classList.add("hidden");
    };
}


/*==========================================================*
 * PROFILE HELPER
 *==========================================================*/

async function createProfileIfNeeded(
    user,
    displayName = ""
) {

    console.log(
        "Checking Firestore profile for UID:",
        user.uid
    );

    const ref =
        db.collection("profiles").doc(user.uid);

    const snap =
        await ref.get();


    if (snap.exists) {

        console.log(
            "Profile already exists for:",
            user.email
        );

        return;
    }


    console.log(
        "Creating Firestore profile for:",
        user.email
    );


    await ref.set({

        name:
            displayName ||
            user.displayName ||
            "",

        email:
            user.email || "",

        photoURL:
            user.photoURL || "",

        isAdmin:
            false,

        createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

    });


    console.log(
        "Firestore profile created successfully."
    );
}


/*==========================================================*
 * SIGN UP
 *==========================================================*/

const signupForm =
    document.getElementById("signupForm");


signupForm?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        clearErrors();


        const name =
            document
                .getElementById("suName")
                .value
                .trim();


        const email =
            document
                .getElementById("suEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("suPassword")
                .value;


        const confirm =
            document
                .getElementById("suConfirm")
                .value;


        if (!name || !email || !password) {

            showError(
                "signup",
                "Please fill in every field."
            );

            return;
        }


        if (!/^\S+@\S+\.\S+$/.test(email)) {

            showError(
                "signup",
                "Enter a valid email address."
            );

            return;
        }


        if (password.length < 6) {

            showError(
                "signup",
                "Password needs at least 6 characters."
            );

            return;
        }


        if (password !== confirm) {

            showError(
                "signup",
                "Passwords don't match."
            );

            return;
        }


        const submitBtn =
            signupForm.querySelector(".gateSubmit");


        submitBtn.disabled = true;

        submitBtn.textContent =
            "Creating account…";


        try {

            console.log(
                "Creating Email/Password account:",
                email
            );


            const cred =
                await auth.createUserWithEmailAndPassword(
                    email,
                    password
                );


            console.log(
                "Firebase account created successfully."
            );

            console.log(
                "Firebase UID:",
                cred.user.uid
            );


            /*
             * Save display name in Firebase Authentication
             */

            await cred.user.updateProfile({

                displayName: name

            });


            console.log(
                "Firebase display name updated."
            );


            /*
             * Create Firestore profile
             */

            await createProfileIfNeeded(
                cred.user,
                name
            );


            console.log(
                "Signup completed successfully."
            );


            window.location.href =
                "marketplace.html";


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "SIGNUP FAILED"
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Full error:",
                error
            );

            console.error(
                "================================="
            );


            submitBtn.disabled = false;

            submitBtn.textContent =
                "Create account";


            showError(
                "signup",
                friendlyError(error)
            );
        }

    }
);


/*==========================================================*
 * EMAIL + PASSWORD LOGIN
 *==========================================================*/

const loginForm =
    document.getElementById("loginForm");


loginForm?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        clearErrors();


        const email =
            document
                .getElementById("liEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("liPassword")
                .value;


        if (!email || !password) {

            showError(
                "login",
                "Please fill in every field."
            );

            return;
        }


        const submitBtn =
            loginForm.querySelector(".gateSubmit");


        submitBtn.disabled = true;

        submitBtn.textContent =
            "Entering…";


        /*--------------------------------------------------
         * STEP 1 — FIREBASE EMAIL/PASSWORD LOGIN
         *--------------------------------------------------*/

        let user;


        try {

            console.log(
                "================================="
            );

            console.log(
                "EMAIL/PASSWORD LOGIN STARTED"
            );

            console.log(
                "Email:",
                email
            );


            const cred =
                await auth.signInWithEmailAndPassword(
                    email,
                    password
                );


            user =
                cred.user;


            console.log(
                "EMAIL/PASSWORD LOGIN SUCCESSFUL"
            );

            console.log(
                "Firebase UID:",
                user.uid
            );

            console.log(
                "Firebase email:",
                user.email
            );

            console.log(
                "================================="
            );


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "EMAIL/PASSWORD LOGIN FAILED"
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Full Firebase error:",
                error
            );

            console.error(
                "================================="
            );


            submitBtn.disabled = false;

            submitBtn.textContent =
                "Enter the vault";


            showError(
                "login",
                friendlyError(error)
            );


            showAccountAssistant(
                error.code,
                email
            );


            return;
        }


        /*--------------------------------------------------
         * STEP 2 — MAKE SURE USER HAS A PROFILE
         *--------------------------------------------------*/

        try {

            console.log(
                "Checking user Firestore profile..."
            );


            await createProfileIfNeeded(
                user,
                user.displayName || ""
            );


            console.log(
                "User profile check completed."
            );


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "PROFILE CHECK FAILED"
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Full error:",
                error
            );

            console.error(
                "================================="
            );


            /*
             * The Firebase authentication itself
             * succeeded, so don't report this as
             * a wrong password.
             */

            submitBtn.disabled = false;

            submitBtn.textContent =
                "Enter the vault";


            showError(
                "login",
                "You are authenticated, but we couldn't load your ToysGuru profile. Please try again."
            );


            return;
        }


        /*--------------------------------------------------
         * STEP 3 — ENTER MARKETPLACE
         *--------------------------------------------------*/

        console.log(
            "Authentication successful."
        );

        console.log(
            "Redirecting to marketplace..."
        );


        window.location.href =
            "marketplace.html";

    }
);


/*==========================================================*
 * GOOGLE SIGN IN
 *==========================================================*/

const googleLoginBtn =
    document.getElementById("googleLoginBtn");


googleLoginBtn?.addEventListener(
    "click",
    async () => {

        clearErrors();


        googleLoginBtn.disabled = true;

        googleLoginBtn.textContent =
            "Connecting…";


        try {

            console.log(
                "================================="
            );

            console.log(
                "GOOGLE LOGIN STARTED"
            );


            const provider =
                new firebase.auth.GoogleAuthProvider();


            const result =
                await auth.signInWithPopup(
                    provider
                );


            const user =
                result.user;


            console.log(
                "GOOGLE LOGIN SUCCESSFUL"
            );

            console.log(
                "Google email:",
                user.email
            );

            console.log(
                "Firebase UID:",
                user.uid
            );


            await createProfileIfNeeded(
                user,
                user.displayName
            );


            console.log(
                "Google user profile verified."
            );

            console.log(
                "Redirecting to marketplace..."
            );


            window.location.href =
                "marketplace.html";


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "GOOGLE LOGIN FAILED"
            );

            console.error(
                "Error code:",
                error.code
            );

            console.error(
                "Error message:",
                error.message
            );

            console.error(
                "Full Firebase error:",
                error
            );

            console.error(
                "================================="
            );


            googleLoginBtn.disabled = false;

            googleLoginBtn.textContent =
                "Continue with Google";


            showError(
                "login",
                friendlyError(error)
            );
        }

    }
);


/*==========================================================*
 * FRIENDLY FIREBASE ERROR MESSAGES
 *==========================================================*/

function friendlyError(error) {

    switch (error.code) {

        case "auth/email-already-in-use":

            return (
                "An account with this email already exists — try logging in."
            );


        case "auth/invalid-email":

            return (
                "That email address doesn't look right."
            );


        case "auth/weak-password":

            return (
                "Password needs at least 6 characters."
            );


        case "auth/user-disabled":

            return (
                "This account has been disabled. Please contact us."
            );


        case "auth/user-not-found":

            return (
                "No account was found with this email."
            );


        case "auth/wrong-password":

            return (
                "Email or password is incorrect."
            );


        case "auth/invalid-credential":

            return (
                "Email or password is incorrect."
            );


        case "auth/too-many-requests":

            return (
                "Too many login attempts. Please try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Please check your internet connection and try again."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/password sign-in is currently disabled."
            );


        case "auth/popup-closed-by-user":

            return (
                "Google sign in was cancelled."
            );


        case "auth/popup-blocked":

            return (
                "Your browser blocked the Google sign-in window."
            );


        case "auth/unauthorized-domain":

            return (
                "This website is not authorized for Google sign-in."
            );


        case "auth/account-exists-with-different-credential":

            return (
                "An account already exists with this email using a different sign-in method."
            );


        default:

            return (
                "Unable to sign in right now. Please try again."
            );
    }
}