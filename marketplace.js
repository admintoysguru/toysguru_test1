"use strict";

/*==========================================================
DATA
Grade scale is fixed order: MOC -> Near Mint -> Loose
gradePosition (0-100) drives the dot on the grading track.
==========================================================*/

const GRADE_POSITIONS = { "MOC": 8, "Near Mint": 50, "Loose": 92 };

const listings = [
    { lot:"TG-0847", series:"Hot Wheels · Treasure Hunt 2023", name:"Dodge Charger Daytona", price:"₹649", grade:"MOC", verified:true, featured:true },
    { lot:"TG-0812", series:"Mini GT · Car Culture", name:"Porsche 911 GT3 RS", price:"₹1,199", grade:"MOC", verified:true },
    { lot:"TG-0790", series:"Kaido House · V2", name:"Nissan Skyline GT-R", price:"₹2,899", grade:"Near Mint", verified:true },
    { lot:"TG-0765", series:"Tarmac Works · Global64", name:"McLaren Senna", price:"₹1,449", grade:"MOC", verified:true },
    { lot:"TG-0741", series:"Matchbox · Superfast", name:"Ford Mustang Shelby", price:"₹449", grade:"Loose", verified:false },
    { lot:"TG-0730", series:"Hot Wheels · Super TH", name:"Bugatti Veyron", price:"₹2,499", grade:"MOC", verified:true },
    { lot:"TG-0718", series:"Mini GT · JDM Collection", name:"Toyota Supra MK4", price:"₹899", grade:"Near Mint", verified:true },
    { lot:"TG-0702", series:"Greenlight · Hollywood", name:"Ferrari F40", price:"₹799", grade:"Loose", verified:false }
];

const auctions = [
    { lot:"TG-A014", series:"Hot Wheels Legends 2023", name:"Enzo Ferrari", bid:"₹4,200", bids:14, ends:"02:14:38", live:true },
    { lot:"TG-A011", series:"Super TH — MOC", name:"Bugatti Veyron Super Sport", bid:"₹8,750", bids:31, ends:"05:42:11", live:true },
    { lot:"TG-A009", series:"Car Culture Racing Circuit", name:"Dodge Viper GTS-R", bid:"₹2,900", bids:9, ends:"11:05:22", live:false }
];

/*==========================================================
MINIMAL LINE-ART CAR ICON — kept deliberately simple so the
lot card (frame, number, grading) carries the visual weight,
not the illustration.
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
RENDER — LOT CARDS
==========================================================*/

function lotCard(item, featured = false){
    const gradePos = GRADE_POSITIONS[item.grade];
    return `
    <div class="lot reveal${featured ? " featured" : ""}">
        <div class="lotFrame">
            <span class="lotNumber">LOT ${item.lot}</span>
            ${item.verified ? '<span class="lotVerified">Verified</span>' : ''}
            ${carIcon()}
        </div>
        <div class="lotBody">
            <div class="lotSeries">${item.series}</div>
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

function renderListings(filtered = listings){
    const featured = filtered.find(l => l.featured) || filtered[0];
    const rest = filtered.filter(l => l !== featured);

    const featuredEl = document.getElementById("featuredGrid");
    const gridEl = document.getElementById("catalogGrid");

    if (featuredEl) {
        featuredEl.innerHTML = `
            ${featured ? lotCard(featured, true) : ""}
            <div class="featuredSide">
                ${rest.slice(0, 3).map(l => lotCard(l)).join("")}
            </div>`;
    }

    if (gridEl) {
        gridEl.innerHTML = rest.slice(3).map(l => lotCard(l)).join("");
    }

    initReveal();
}

/*==========================================================
RENDER — ROSTRUM (auctions)
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
    "All": () => listings,
    "Hot Wheels": () => listings.filter(l => l.series.startsWith("Hot Wheels")),
    "Mini GT": () => listings.filter(l => l.series.startsWith("Mini GT")),
    "Vintage": () => listings.filter(l => l.grade === "Loose")
};

document.querySelectorAll(".roomTab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".roomTab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const key = tab.dataset.room;
        const fn = roomMap[key] || roomMap["All"];
        renderListings(fn());
    });
});

/*==========================================================
SEARCH (simple client-side filter across name/series)
==========================================================*/

const searchInput = document.getElementById("marketSearch");
if (searchInput) {
    searchInput.addEventListener("input", e => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) { renderListings(); return; }
        renderListings(listings.filter(l =>
            l.name.toLowerCase().includes(q) || l.series.toLowerCase().includes(q)
        ));
    });
}

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

/*==========================================================
BOOT
==========================================================*/

window.addEventListener("load", () => {
    renderListings();
    renderAuctions();
});