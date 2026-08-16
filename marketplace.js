"use strict";

/*==========================================================
  TOYSGURU — MARKETPLACE (Firebase-backed)
  Requires firebase-*-compat CDN scripts + firebaseClient.js loaded first.
==========================================================*/

const GRADE_POSITIONS = { "MOC": 8, "Near Mint": 50, "Loose": 92 };

let currentUser = null;

/*==========================================================
SESSION GUARD
==========================================================*/

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "auth.html?mode=login";
        return;
    }

    currentUser = user;

    db.collection("profiles").doc(user.uid).get().then(doc => {
        const name = doc.exists ? doc.data().name : user.email;
        const nameEl = document.getElementById("navUserName");
        if (nameEl) nameEl.textContent = name.split(" ")[0];
    });

    renderListings();
    renderAuctions();
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "index.html";
});

/*==========================================================
AUCTIONS — still a simple front-end mock, unrelated to the
approval workflow for now
==========================================================*/

const auctions = [
    { lot:"TG-A014", series:"Hot Wheels Legends 2023", name:"Enzo Ferrari", bid:"₹4,200", bids:14, ends:"02:14:38", live:true },
    { lot:"TG-A011", series:"Super TH — MOC", name:"Bugatti Veyron Super Sport", bid:"₹8,750", bids:31, ends:"05:42:11", live:true },
    { lot:"TG-A009", series:"Car Culture Racing Circuit", name:"Dodge Viper GTS-R", bid:"₹2,900", bids:9, ends:"11:05:22", live:false }
];

/*==========================================================
MINIMAL LINE-ART CAR ICON
==========================================================*/

function carIcon(){
    return `<svg viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--brass-light)" stroke-width="1.4">
        <path d="M20 62 L36 34 Q40 28 48 28 L152 28 Q160 28 164 34 L180 62" stroke-opacity=".8"/>
        <path d="M14 62 L186 62" stroke-opacity=".9"/>
        <path d="M52 30 L64 46 L136 46 L148 30" stroke-opacity=".5"/>
        <circle cx="52" cy="64" r="12" stroke-opacity=".9"/>
        <circle cx="148" cy="64" r="12" stroke-opacity=".9"/>
        <circle cx="52" cy="64" r="4" fill="var(--brass-light)" stroke="none" opacity=".6"/>
        <circle cx="148" cy="64" r="4" fill="var(--brass-light)" stroke="none" opacity=".6"/>
    </svg>`;
}

/*==========================================================
DATA — real queries against the "listings" collection
==========================================================*/

async function fetchApprovedListings() {

    try {

        const response = await fetch("https://toysguru-backend.tenurly.workers.dev/api/listings");

        const data = await response.json();

        if (!data.success) {
            return [];
        }

        return data.listings;

    } catch (error) {

        console.error(error);
        return [];

    }

}

/*==========================================================
RENDER — LOT CARDS
==========================================================*/

function lotCard(item, featured = false){
    const gradePos = GRADE_POSITIONS[item.grade] ?? 50;
    return `
    <div class="lot reveal${featured ? " featured" : ""}">
        <div class="lotFrame">
            <span class="lotNumber">LOT ${item.lotNumber}</span>
            <span class="lotVerified">Verified</span>
            ${carIcon()}
        </div>
        <div class="lotBody">
            <div class="lotSeries">${item.series || item.brand}</div>
            <div class="lotName">${item.name}</div>
            <div class="gradeScale">
                <div class="gradeLabels"><span>MOC</span><span>Near Mint</span><span>Loose</span></div>
                <div class="gradeTrack">
                    <div class="gradeDot" style="left:${gradePos}%"></div>
                </div>
            </div>
            <div class="lotFoot">
                <span class="lotPrice">${item.price}</span>
                <span class="lotGradeText">${item.grade}</span>
            </div>
        </div>
    </div>`;
}

async function renderListings(filterFn){
    const all = await fetchApprovedListings();
    const approved = filterFn ? all.filter(filterFn) : all;

    const featured = approved.find(l => l.featured) || approved[0];
    const rest = approved.filter(l => l !== featured);

    const featuredEl = document.getElementById("featuredGrid");
    const gridEl = document.getElementById("catalogGrid");

    if (featuredEl) {
        featuredEl.innerHTML = featured
            ? `${lotCard(featured, true)}
               <div class="featuredSide">${rest.slice(0, 3).map(l => lotCard(l)).join("")}</div>`
            : `<p style="color:var(--text-faint);font-size:13px;">No approved listings yet in this wing.</p>`;
    }

    if (gridEl) {
        gridEl.innerHTML = rest.slice(3).map(l => lotCard(l)).join("");
    }

    initReveal();
}

/*==========================================================
ROSTRUM (auctions — front-end mock)
==========================================================*/

function rostrumCard(item){
    return `
    <div class="rostrumCard reveal">
        <div class="rostrumTop">
            <span class="rostrumTag">LOT ${item.lot}</span>
            ${item.live
                ? '<span class="liveTag">LIVE</span>'
                : '<span style="font-family:\'DM Mono\',monospace;font-size:9.5px;color:var(--text-faint);letter-spacing:1.5px;">UPCOMING</span>'}
        </div>
        <div class="rostrumFrame">${carIcon()}</div>
        <div class="rostrumName">${item.name}</div>
        <div class="rostrumSeries">${item.series}</div>
        <div class="rostrumStats">
            <div><div class="statLabel">Current Bid</div><div class="statValue">${item.bid}</div></div>
            <div><div class="statLabel">Ends In</div><div class="statValue time" data-timer="${item.lot}">${item.ends}</div></div>
            <div><div class="statLabel">Total Bids</div><div class="statValue">${item.bids}</div></div>
        </div>
        <button class="bidBtn">Place a bid</button>
    </div>`;
}

function renderAuctions(){
    const el = document.getElementById("rostrumGrid");
    if (!el) return;
    el.innerHTML = auctions.map(rostrumCard).join("");
    initReveal();
    startCountdowns();
}

function startCountdowns(){
    auctions.forEach(a => {
        if (!a.live) return;
        const el = document.querySelector(`[data-timer="${a.lot}"]`);
        if (!el) return;
        let parts = a.ends.split(":").map(Number);
        setInterval(() => {
            parts[2]--;
            if (parts[2] < 0) { parts[2] = 59; parts[1]--; }
            if (parts[1] < 0) { parts[1] = 59; parts[0]--; }
            if (parts[0] < 0) { parts[0] = parts[1] = parts[2] = 0; }
            el.textContent = parts.map(n => String(n).padStart(2, "0")).join(":");
        }, 1000);
    });
}

/*==========================================================
CATEGORY ROOMS (filter)
==========================================================*/

const roomMap = {
    "All": null,
    "Hot Wheels": l => l.brand === "Hot Wheels",
    "Mini GT": l => l.brand === "Mini GT",
    "Vintage": l => l.grade === "Loose"
};

document.querySelectorAll(".roomTab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".roomTab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderListings(roomMap[tab.dataset.room] || null);
    });
});

/*==========================================================
SEARCH
==========================================================*/

const searchInput = document.getElementById("marketSearch");
searchInput?.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    renderListings(q ? (l => l.name.toLowerCase().includes(q) || (l.series || "").toLowerCase().includes(q)) : null);
});

/*==========================================================
SUBMIT FOR APPRAISAL — real write into the listings collection,
starts as "pending" until the owner approves it.
==========================================================*/

const appraisalForm = document.getElementById("appraisalForm");
appraisalForm?.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("aName").value.trim();
    const brand = document.getElementById("aBrand").value;
    const price = document.getElementById("aPrice").value.trim();
    const grade = document.getElementById("aCondition").value;

    const statusEl = document.getElementById("appraisalStatus");
    statusEl.classList.remove("show", "success");

    if (!name || !brand || !price) {
        statusEl.textContent = "Please fill in the model name, brand and price.";
        statusEl.classList.add("show");
        return;
    }

    const submitBtn = appraisalForm.querySelector(".submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    const lotNumber = `TG-${Date.now().toString().slice(-6)}`;

    try {
        const profileDoc = await db.collection("profiles").doc(currentUser.uid).get();
        const sellerName = profileDoc.exists ? profileDoc.data().name : currentUser.email;

        await db.collection("listings").add({
            lotNumber,
            name,
            brand,
            series: brand,
            price: `₹${price}`,
            grade,
            sellerId: currentUser.uid,
            sellerName,
            status: "pending",
            featured: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        statusEl.textContent = "Submitted — the owner will review this before it goes live in the vault.";
        statusEl.classList.add("show", "success");
        appraisalForm.reset();
    } catch (error) {
        statusEl.textContent = error.message;
        statusEl.classList.add("show");
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for appraisal →";
});

/*==========================================================
SCROLL REVEAL
==========================================================*/

let revealObserver;

function initReveal(){
    if (!revealObserver) {
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("show");
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: .12 });
    }
    document.querySelectorAll(".reveal:not(.show)").forEach(el => revealObserver.observe(el));
}