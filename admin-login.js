"use strict";

const adminLoginForm = document.getElementById("adminLoginForm");

function showAdminError(message){
    const el = document.getElementById("adminError");
    el.textContent = message;
    el.classList.add("show");
}

adminLoginForm?.addEventListener("submit", async e => {
    e.preventDefault();
    document.getElementById("adminError").classList.remove("show");

    const email = document.getElementById("adEmail").value.trim().toLowerCase();
    const password = document.getElementById("adPassword").value;

    if (!email || !password) {
        showAdminError("Please fill in both fields.");
        return;
    }

    const submitBtn = adminLoginForm.querySelector(".gateSubmit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";

    try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const profileDoc = await db.collection("profiles").doc(cred.user.uid).get();

        if (!profileDoc.exists || !profileDoc.data().isAdmin) {
            await auth.signOut();
            submitBtn.disabled = false;
            submitBtn.textContent = "Enter dashboard";
            showAdminError("This account doesn't have owner access.");
            return;
        }

        window.location.href = "admin-dashboard.html";
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enter dashboard";
        showAdminError("Email or password is incorrect.");
    }
});