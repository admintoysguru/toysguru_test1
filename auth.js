"use strict";

/*==========================================================*
 * TOYSGURU — REAL AUTH (Firebase)
 * Email/Password + Google
 *==========================================================*/

const tabs = document.querySelectorAll(".gateTab");
const forms = document.querySelectorAll(".gateForm");

let pendingGoogleCredential = null;


/*==========================================================*
 * TAB HANDLING
 *==========================================================*/

function showTab(name) {

    const completion =
        document.getElementById("accountCompletion");

    const gateCard =
        document.querySelector(".gateCard");

    /*
     * If account completion is currently visible,
     * don't allow the normal Login / Sign Up tabs
     * to take over the screen.
     */
    if (
        completion &&
        !completion.classList.contains("hidden")
    ) {
        return;
    }


    gateCard?.classList.remove(
        "account-completing"
    );


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

        /*
         * Explicitly restore normal form visibility.
         */
        form.style.display =
            form.dataset.form === name
                ? "flex"
                : "none";

    });


    /*
     * Make sure completion is hidden.
     */

    if (completion) {

        completion.classList.add("hidden");
        completion.style.display = "none";

    }


    clearErrors();
}


/*==========================================================*
 * TAB CLICK EVENTS
 *==========================================================*/

tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => showTab(tab.dataset.tab)
    );

});


/*==========================================================*
 * INITIAL TAB
 *==========================================================*/

const params = new URLSearchParams(
    window.location.search
);


showTab(
    params.get("mode") === "signup"
        ? "signup"
        : "login"
);


/*==========================================================*
 * CLEAR ERRORS
 *==========================================================*/

function clearErrors() {

    document
        .querySelectorAll(".gateError")
        .forEach(el => {

            el.classList.remove("show");
            el.textContent = "";

        });


    document
        .getElementById("accountAssistant")
        ?.classList.add("hidden");
}


/*==========================================================*
 * SHOW NORMAL AUTH ERROR
 *==========================================================*/

function showError(formName, message) {

    const el = document.querySelector(
        `.gateForm[data-form="${formName}"] .gateError`
    );


    if (!el) {
        return;
    }


    el.textContent = message;
    el.classList.add("show");
}


/*==========================================================*
 * ACCOUNT ASSISTANT
 *==========================================================*/

function showAccountAssistant(
    errorCode,
    email = ""
) {

    const assistant =
        document.getElementById(
            "accountAssistant"
        );

    const title =
        document.getElementById(
            "assistantTitle"
        );

    const message =
        document.getElementById(
            "assistantMessage"
        );

    const button =
        document.getElementById(
            "assistantButton"
        );


    if (
        !assistant ||
        !title ||
        !message ||
        !button
    ) {
        return;
    }


    if (
        errorCode ===
        "auth/user-not-found"
    ) {

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


    assistant.classList.remove(
        "hidden"
    );


    button.onclick = () => {

        showTab("signup");


        const emailInput =
            document.getElementById(
                "suEmail"
            );

        const nameInput =
            document.getElementById(
                "suName"
            );


        if (emailInput) {

            emailInput.value =
                email;
        }


        nameInput?.focus();


        assistant.classList.add(
            "hidden"
        );
    };
}


/*==========================================================*
 * PROFILE HELPER
 *==========================================================*/

async function createProfileIfNeeded(
    user,
    displayName = ""
) {

    const ref =
        db.collection("profiles").doc(
            user.uid
        );


    const snap =
        await ref.get();


    if (snap.exists) {
        return;
    }


    await ref.set({

        name:
            displayName ||
            user.displayName ||
            "",

        email:
            user.email,

        photoURL:
            user.photoURL ||
            "",

        isAdmin:
            false,

        createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

    });
}


/*==========================================================*
 * LINK GOOGLE TO CURRENT USER
 *==========================================================*/

async function linkGoogleToCurrentUser() {

    const currentUser =
        auth.currentUser;


    if (!currentUser) {

        throw new Error(
            "You must be signed in before linking Google."
        );
    }


    const provider =
        new firebase.auth.GoogleAuthProvider();


    const result =
        await currentUser.linkWithPopup(
            provider
        );


    await createProfileIfNeeded(
        result.user,
        result.user.displayName
    );


    return result.user;
}


/*==========================================================*
 * LINK EMAIL/PASSWORD TO CURRENT USER
 *==========================================================*/

async function linkEmailPasswordToCurrentUser(
    email,
    password
) {

    const currentUser =
        auth.currentUser;


    if (!currentUser) {

        throw new Error(
            "You must be signed in before adding a password."
        );
    }


    const credential =
        firebase.auth.EmailAuthProvider.credential(
            email,
            password
        );


    const result =
        await currentUser.linkWithCredential(
            credential
        );


    return result.user;
}


/*==========================================================*
 * SHOW GOOGLE ACCOUNT COMPLETION SCREEN
 *==========================================================*/

function showAccountCompletion(user) {

    const gateCard =
        document.querySelector(".gateCard");

    const gateTabs =
        document.querySelector(".gateTabs");

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const accountAssistant =
        document.getElementById(
            "accountAssistant"
        );

    const completion =
        document.getElementById(
            "accountCompletion"
        );


    if (!completion) {

        console.error(
            "accountCompletion section not found in auth.html"
        );

        return;
    }


    /*
     * Put the entire card into completion mode.
     */

    gateCard?.classList.add(
        "account-completing"
    );


    /*
     * Hide tabs.
     */

    if (gateTabs) {

        gateTabs.classList.add("hidden");
        gateTabs.style.display = "none";

    }


    /*
     * Hide login form.
     */

    if (loginForm) {

        loginForm.classList.remove(
            "active"
        );

        loginForm.style.display =
            "none";
    }


    /*
     * Hide signup form.
     */

    if (signupForm) {

        signupForm.classList.remove(
            "active"
        );

        signupForm.style.display =
            "none";
    }


    /*
     * Hide old account assistant.
     */

    if (accountAssistant) {

        accountAssistant.classList.add(
            "hidden"
        );

        accountAssistant.style.display =
            "none";
    }


    /*
     * Show completion section.
     */

    completion.classList.remove(
        "hidden"
    );

    completion.style.display =
        "block";


    /*
     * Clear completion error.
     */

    const error =
        document.getElementById(
            "accountCompletionError"
        );


    if (error) {

        error.textContent = "";
        error.classList.remove("show");

    }


    /*
     * Reset password fields.
     */

    const password =
        document.getElementById(
            "linkPassword"
        );

    const confirmPassword =
        document.getElementById(
            "linkConfirmPassword"
        );


    if (password) {

        password.value = "";
        password.type = "password";

    }


    if (confirmPassword) {

        confirmPassword.value = "";
        confirmPassword.type =
            "password";

    }


    /*
     * Reset Show Password checkboxes.
     */

    const showPassword =
        document.getElementById(
            "linkShowPassword"
        );

    const showConfirmPassword =
        document.getElementById(
            "linkShowConfirmPassword"
        );


    if (showPassword) {
        showPassword.checked = false;
    }


    if (showConfirmPassword) {
        showConfirmPassword.checked = false;
    }


    /*
     * Remember setup state.
     */

    sessionStorage.setItem(
        "toysguruGooglePasswordSetup",
        "true"
    );


    sessionStorage.setItem(
        "toysguruGoogleEmail",
        user.email || ""
    );


    /*
     * Focus first password field.
     */

    setTimeout(() => {

        password?.focus();

    }, 0);
}


/*==========================================================*
 * ACCOUNT COMPLETION ERROR
 *==========================================================*/

function showAccountCompletionError(
    message
) {

    const error =
        document.getElementById(
            "accountCompletionError"
        );


    if (!error) {
        return;
    }


    error.textContent =
        message;

    error.classList.add(
        "show"
    );
}


/*==========================================================*
 * CREATE PASSWORD AFTER GOOGLE LOGIN
 *==========================================================*/

const createLinkedPasswordBtn =
    document.getElementById(
        "createLinkedPasswordBtn"
    );


createLinkedPasswordBtn?.addEventListener(
    "click",
    async () => {

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            showAccountCompletionError(
                "Your Google sign-in session has expired. Please sign in with Google again."
            );

            return;
        }


        const passwordInput =
            document.getElementById(
                "linkPassword"
            );

        const confirmInput =
            document.getElementById(
                "linkConfirmPassword"
            );


        if (
            !passwordInput ||
            !confirmInput
        ) {

            showAccountCompletionError(
                "Password fields could not be found. Please refresh the page and try again."
            );

            return;
        }


        const password =
            passwordInput.value;

        const confirmPassword =
            confirmInput.value;


        /*
         * Validate empty fields.
         */

        if (
            !password ||
            !confirmPassword
        ) {

            showAccountCompletionError(
                "Please enter and confirm your password."
            );

            return;
        }


        /*
         * Validate minimum password length.
         */

        if (
            password.length < 6
        ) {

            showAccountCompletionError(
                "Password needs at least 6 characters."
            );

            return;
        }


        /*
         * Validate confirmation.
         */

        if (
            password !==
            confirmPassword
        ) {

            showAccountCompletionError(
                "Passwords don't match."
            );

            return;
        }


        /*
         * Disable button.
         */

        createLinkedPasswordBtn.disabled =
            true;

        createLinkedPasswordBtn.textContent =
            "Creating Password…";


        try {

            /*
             * IMPORTANT:
             *
             * This attaches Email/Password
             * to the currently authenticated
             * Google user.
             *
             * No second Firebase account is created.
             */

            const linkedUser =
                await linkEmailPasswordToCurrentUser(
                    currentUser.email,
                    password
                );


            console.log(
                "Email/password linked successfully."
            );


            console.log(
                "Firebase UID:",
                linkedUser.uid
            );


            /*
             * Ensure Firestore profile exists.
             */

            await createProfileIfNeeded(
                linkedUser,
                linkedUser.displayName
            );


            /*
             * Clean temporary state.
             */

            sessionStorage.removeItem(
                "toysguruGooglePasswordSetup"
            );

            sessionStorage.removeItem(
                "toysguruGoogleEmail"
            );


            /*
             * Redirect only after the
             * linking operation succeeds.
             */

            window.location.href =
                "marketplace.html";


        } catch (error) {

            console.error(
                "Create linked password error:",
                error
            );


            createLinkedPasswordBtn.disabled =
                false;

            createLinkedPasswordBtn.textContent =
                "Create Password";


            switch (error.code) {

                case "auth/provider-already-linked":

                    sessionStorage.removeItem(
                        "toysguruGooglePasswordSetup"
                    );

                    sessionStorage.removeItem(
                        "toysguruGoogleEmail"
                    );


                    window.location.href =
                        "marketplace.html";

                    break;


                case "auth/email-already-in-use":

                    showAccountCompletionError(
                        "This email is already attached to another ToysGuru account. Please sign in to that account instead."
                    );

                    break;


                case "auth/credential-already-in-use":

                    showAccountCompletionError(
                        "This email/password credential is already being used by another ToysGuru account."
                    );

                    break;


                case "auth/requires-recent-login":

                    showAccountCompletionError(
                        "For security, please sign in with Google again and then create your password."
                    );

                    break;


                case "auth/weak-password":

                    showAccountCompletionError(
                        "Password needs at least 6 characters."
                    );

                    break;


                default:

                    showAccountCompletionError(
                        error.message ||
                        "Unable to create the password. Please try again."
                    );

                    break;
            }
        }

    }
);


/*==========================================================*
 * SIGN UP
 *==========================================================*/

const signupForm =
    document.getElementById(
        "signupForm"
    );


signupForm?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        clearErrors();


        const name =
            document
                .getElementById(
                    "suName"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "suEmail"
                )
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById(
                    "suPassword"
                )
                .value;


        const confirm =
            document
                .getElementById(
                    "suConfirm"
                )
                .value;


        if (
            !name ||
            !email ||
            !password
        ) {

            showError(
                "signup",
                "Please fill in every field."
            );

            return;
        }


        if (
            !/^\S+@\S+\.\S+$/.test(
                email
            )
        ) {

            showError(
                "signup",
                "Enter a valid email address."
            );

            return;
        }


        if (
            password.length < 6
        ) {

            showError(
                "signup",
                "Password needs at least 6 characters."
            );

            return;
        }


        if (
            password !==
            confirm
        ) {

            showError(
                "signup",
                "Passwords don't match."
            );

            return;
        }


        const submitBtn =
            signupForm.querySelector(
                ".gateSubmit"
            );


        submitBtn.disabled = true;

        submitBtn.textContent =
            "Creating account…";


        try {

            const cred =
                await auth.createUserWithEmailAndPassword(
                    email,
                    password
                );


            await cred.user.updateProfile({
                displayName: name
            });


            await createProfileIfNeeded(
                cred.user,
                name
            );


            window.location.href =
                "marketplace.html";


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );


            submitBtn.disabled = false;

            submitBtn.textContent =
                "Create account";


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                showError(
                    "signup",
                    "This email already has a ToysGuru account. Please sign in instead."
                );

                return;
            }


            showError(
                "signup",
                friendlyError(error)
            );

        }

    }
);


/*==========================================================*
 * EMAIL/PASSWORD LOGIN
 *==========================================================*/

const loginForm =
    document.getElementById(
        "loginForm"
    );


loginForm?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        clearErrors();


        const email =
            document
                .getElementById(
                    "liEmail"
                )
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById(
                    "liPassword"
                )
                .value;


        if (
            !email ||
            !password
        ) {

            showError(
                "login",
                "Please fill in every field."
            );

            return;
        }


        const submitBtn =
            loginForm.querySelector(
                ".gateSubmit"
            );


        submitBtn.disabled =
            true;

        submitBtn.textContent =
            "Entering…";


        try {

            const result =
                await auth.signInWithEmailAndPassword(
                    email,
                    password
                );


            /*
             * If the user previously attempted
             * Google sign-in and Firebase returned
             * account-exists-with-different-credential,
             * finish the Google linking now.
             */

            if (
                pendingGoogleCredential
            ) {

                try {

                    await result.user.linkWithCredential(
                        pendingGoogleCredential
                    );


                    pendingGoogleCredential =
                        null;


                    console.log(
                        "Google account linked successfully."
                    );


                } catch (linkError) {

                    console.error(
                        "Google linking error:",
                        linkError
                    );


                    if (
                        linkError.code ===
                        "auth/provider-already-linked"
                    ) {

                        pendingGoogleCredential =
                            null;

                    } else {

                        showError(
                            "login",
                            "Your email/password login worked, but Google could not be linked. Please try again."
                        );


                        submitBtn.disabled =
                            false;

                        submitBtn.textContent =
                            "Enter the vault";


                        return;
                    }
                }
            }


            await createProfileIfNeeded(
                result.user,
                result.user.displayName
            );


            window.location.href =
                "marketplace.html";


        } catch (error) {

            console.error(
                "Email/password login error:",
                error
            );


            submitBtn.disabled =
                false;

            submitBtn.textContent =
                "Enter the vault";


            if (
                error.code ===
                    "auth/wrong-password" ||

                error.code ===
                    "auth/invalid-credential"
            ) {

                showError(
                    "login",
                    "Email/password login failed. If this account was created with Google, sign in with Google first, then create a password for the same account."
                );

                return;
            }


            showError(
                "login",
                friendlyError(error)
            );


            showAccountAssistant(
                error.code,
                email
            );

        }

    }
);


/*==========================================================*
 * GOOGLE SIGN IN
 *==========================================================*/

const googleLoginBtn =
    document.getElementById(
        "googleLoginBtn"
    );


googleLoginBtn?.addEventListener(
    "click",
    async () => {

        clearErrors();


        googleLoginBtn.disabled =
            true;

        googleLoginBtn.textContent =
            "Checking…";


        try {

            const provider =
                new firebase.auth.GoogleAuthProvider();


            const result =
                await auth.signInWithPopup(
                    provider
                );


            const user =
                result.user;


            console.log(
                "Google login:",
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


            /*
             * Check linked providers.
             */

            const hasPassword =
                user.providerData.some(
                    providerData =>
                        providerData.providerId ===
                        "password"
                );


            /*
             * Already has both Google
             * and Email/Password.
             */

            if (hasPassword) {

                window.location.href =
                    "marketplace.html";

                return;
            }


            /*
             * Google-only user.
             *
             * Stay on the auth page and ask
             * them to create the password.
             */

            console.log(
                "Google-only account detected."
            );


            sessionStorage.setItem(
                "toysguruGooglePasswordSetup",
                "true"
            );


            sessionStorage.setItem(
                "toysguruGoogleEmail",
                user.email || ""
            );


            googleLoginBtn.disabled =
                false;

            googleLoginBtn.textContent =
                "Continue with Google";


            showAccountCompletion(
                user
            );


        } catch (error) {

            console.error(
                "Google login error:",
                error
            );


            /*
             * This happens when the same email
             * already has Email/Password.
             */

            if (
                error.code ===
                "auth/account-exists-with-different-credential"
            ) {

                pendingGoogleCredential =
                    error.credential;


                const email =
                    error.email ||
                    error.customData?.email ||
                    "";


                const emailInput =
                    document.getElementById(
                        "liEmail"
                    );


                if (emailInput) {

                    emailInput.value =
                        email;
                }


                showError(
                    "login",
                    "This email already has a password account. Enter your password above and click Enter the Vault to link Google to the same account."
                );


                googleLoginBtn.disabled =
                    false;

                googleLoginBtn.textContent =
                    "Continue with Google";


                return;
            }


            googleLoginBtn.disabled =
                false;

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
 * FRIENDLY ERROR MESSAGES
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


        case "auth/popup-closed-by-user":

            return (
                "Google sign in was cancelled."
            );


        case "auth/popup-blocked":

            return (
                "Your browser blocked the Google sign-in popup. Please allow popups for ToysGuru and try again."
            );


        case "auth/account-exists-with-different-credential":

            return (
                "This email already has another sign-in method. Sign in with that method to link your accounts."
            );


        case "auth/provider-already-linked":

            return (
                "This sign-in method is already linked to your account."
            );


        case "auth/credential-already-in-use":

            return (
                "That Google account is already linked to another ToysGuru account."
            );


        case "auth/user-disabled":

            return (
                "This account has been disabled. Please contact ToysGuru support."
            );


        case "auth/operation-not-allowed":

            return (
                "This sign-in method is not enabled in Firebase."
            );


        case "auth/user-not-found":

        case "auth/wrong-password":

        case "auth/invalid-credential":

            return (
                "Email or password is incorrect."
            );


        default:

            return (
                error.message ||
                "Something went wrong. Please try again."
            );
    }
}


/*==========================================================*
 * SHOW / HIDE PASSWORD
 *==========================================================*/

function setupPasswordToggle(
    inputId,
    checkboxId
) {

    const input =
        document.getElementById(
            inputId
        );

    const checkbox =
        document.getElementById(
            checkboxId
        );


    if (
        !input ||
        !checkbox
    ) {

        console.warn(
            "Password toggle could not be initialized:",
            inputId,
            checkboxId
        );

        return;
    }


    /*
     * Start hidden.
     */

    checkbox.checked =
        false;

    input.type =
        "password";


    /*
     * Toggle visibility.
     */

    checkbox.addEventListener(
        "change",
        () => {

            input.type =
                checkbox.checked
                    ? "text"
                    : "password";

        }
    );
}


/*==========================================================*
 * INITIALIZE PASSWORD TOGGLES
 *==========================================================*/

function initializePasswordToggles() {

    /*
     * Login
     */

    setupPasswordToggle(
        "liPassword",
        "liShowPassword"
    );


    /*
     * Sign Up
     */

    setupPasswordToggle(
        "suPassword",
        "suShowPassword"
    );


    setupPasswordToggle(
        "suConfirm",
        "suShowConfirmPassword"
    );


    /*
     * Google account completion
     */

    setupPasswordToggle(
        "linkPassword",
        "linkShowPassword"
    );


    setupPasswordToggle(
        "linkConfirmPassword",
        "linkShowConfirmPassword"
    );
}


/*==========================================================*
 * INITIALIZE SCRIPT
 *==========================================================*/

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePasswordToggles
    );

} else {

    initializePasswordToggles();

}