"use strict";

let adminUser = null;

auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "admin-login.html";
        return;
    }

    const profileDoc = await db.collection("profiles").doc(user.uid).get();

    if (!profileDoc.exists || !profileDoc.data().isAdmin) {
        await auth.signOut();
        window.location.href = "admin-login.html";
        return;
    }

    adminUser = { id: user.uid, name: profileDoc.data().name || user.email };
    document.getElementById("adminName").textContent = adminUser.name;
    loadDashboard();
});

async function loadDashboard(){
    const listingsSnap = await db.collection("listings").get();
    const listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const profilesSnap = await db.collection("profiles").get();
    const collectorCount = profilesSnap.size;

    const pending = listings.filter(l => l.status === "pending");
    const approved = listings.filter(l => l.status === "approved");
    const sellers = new Set(approved.map(l => l.sellerId)).size;

    document.getElementById("statTotal").textContent = listings.length;
    document.getElementById("statPending").textContent = pending.length;
    document.getElementById("statApproved").textContent = approved.length;
    document.getElementById("statSellers").textContent = sellers;
    document.getElementById("statCollectors").textContent = collectorCount;

    renderQueue(pending);
    renderInventory(approved);
}

function renderQueue(pending){
    const el = document.getElementById("queueList");

    if (!pending.length) {
        el.innerHTML = `<p class="emptyNote">No pending submissions right now.</p>`;
        return;
    }

    el.innerHTML = pending.map(item => `
        <div class="queueCard">
            <div class="queueTop">
                <span class="queueLot">LOT ${item.lotNumber}</span>
                <span class="queueGrade">${item.grade}</span>
            </div>
            <div class="queueName">${item.name}</div>
            <div class="queueMeta">${item.brand} · ${item.price}</div>
            <div class="queueSeller">Submitted by ${item.sellerName || "Unknown"}</div>
            <div class="queueActions">
                <button class="approveBtn" data-id="${item.id}">Approve</button>
                <button class="rejectBtn" data-id="${item.id}">Reject</button>
            </div>
        </div>
    `).join("");

    el.querySelectorAll(".approveBtn").forEach(btn =>
        btn.addEventListener("click", () => updateStatus(btn.dataset.id, "approved"))
    );
    el.querySelectorAll(".rejectBtn").forEach(btn =>
        btn.addEventListener("click", () => updateStatus(btn.dataset.id, "rejected"))
    );
}

async function updateStatus(id, status){
    try {
        await db.collection("listings").doc(id).update({ status });
        loadDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function renderInventory(approved){
    const brands = {};
    approved.forEach(l => { brands[l.brand] = (brands[l.brand] || 0) + 1; });

    const el = document.getElementById("inventoryList");
    const rows = Object.entries(brands);

    el.innerHTML = rows.length
        ? rows.map(([brand, count]) => `<div class="invRow"><span>${brand}</span><span>${count}</span></div>`).join("")
        : `<p class="emptyNote" style="padding:20px;">No approved listings yet.</p>`;
}

document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "admin-login.html";
});