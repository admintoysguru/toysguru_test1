/*==========================================================
  TOYSGURU — THE COLLECTOR'S VAULT
  Simplified engine: one intro sequence, one scroll-reveal
  system, a subtle ambient glow follow. Everything else from
  the old build (magnetic buttons, card tilt, ripple clicks,
  scroll progress bar, multi-layer parallax) has been removed
  — they didn't come from the vault concept, they were just
  noise competing with the reveal.
==========================================================*/

"use strict";

const CONFIG = {
    introDelay: 250,
    spotlightDelay: 130,
    stepDelay: 160,
    staggerDelay: 120,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

const DOM = {
    body: document.body,
    glow: document.getElementById("backgroundGlow"),
    dust: document.getElementById("dust"),
    hero: document.querySelector(".hero"),
    vaultTitle: document.querySelector(".vaultTitle"),
    logo: document.getElementById("logo"),
    tagline: document.querySelector(".tagline"),
    buttons: document.querySelector(".buttons"),
    scrollIndicator: document.querySelector(".scrollIndicator"),
    trustHeader: document.querySelector(".trustHeader"),
    trustCards: [...document.querySelectorAll(".trustCard")],
    spotlights: [...document.querySelectorAll(".spotlight")]
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/*==========================================================
INTRO — the vault opening. Lights come on, dust settles,
then the hero reveals in sequence. This is the one signature
moment; everything else on the page stays quiet.
==========================================================*/

async function playIntro() {

    if (CONFIG.reducedMotion) {
        DOM.hero?.classList.add("show");
        [DOM.vaultTitle, DOM.logo, DOM.tagline, DOM.buttons, DOM.scrollIndicator]
            .forEach(el => el?.classList.add("show"));
        return;
    }

    DOM.glow?.classList.add("active");
    await wait(CONFIG.introDelay);

    for (const light of DOM.spotlights) {
        light.classList.add("active");
        await wait(CONFIG.spotlightDelay);
    }

    DOM.dust?.classList.add("active");
    await wait(250);

    DOM.hero?.classList.add("show");
    await wait(CONFIG.stepDelay);

    DOM.vaultTitle?.classList.add("show");
    await wait(CONFIG.stepDelay);

    DOM.logo?.classList.add("show");
    await wait(CONFIG.stepDelay);

    DOM.tagline?.classList.add("show");
    await wait(CONFIG.stepDelay);

    DOM.buttons?.classList.add("show");
    await wait(180);

    DOM.scrollIndicator?.classList.add("show");
}

/*==========================================================
SCROLL REVEAL — trust header, then cards staggered in
==========================================================*/

let trustAnimated = false;

async function animateTrust() {
    if (trustAnimated || !DOM.trustHeader) return;

    const top = DOM.trustHeader.getBoundingClientRect().top;
    if (top > window.innerHeight * .82) return;

    trustAnimated = true;
    DOM.trustHeader.classList.add("show");
    await wait(CONFIG.staggerDelay);

    for (const card of DOM.trustCards) {
        card.classList.add("show");
        await wait(CONFIG.staggerDelay);
    }
}

let ticking = false;

function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        ticking = false;
        animateTrust();
    });
}

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick, { passive: true });

/*==========================================================
AMBIENT GLOW FOLLOW — subtle, hero only, no other parallax
==========================================================*/

if (!CONFIG.reducedMotion && DOM.glow) {

    let targetX = 50, targetY = 30;
    let currentX = 50, currentY = 30;

    window.addEventListener("mousemove", e => {
        targetX = (e.clientX / window.innerWidth) * 100;
        targetY = (e.clientY / window.innerHeight) * 100;
    }, { passive: true });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function followGlow() {
        currentX = lerp(currentX, targetX, .04);
        currentY = lerp(currentY, targetY, .04);

        DOM.glow.style.background = `
            radial-gradient(
                ellipse at ${currentX}% ${currentY}%,
                rgba(184,146,90,.16) 0%,
                rgba(150,115,65,.08) 30%,
                rgba(110,85,50,.04) 55%,
                transparent 80%
            )
        `;

        requestAnimationFrame(followGlow);
    }

    requestAnimationFrame(followGlow);
}

/*==========================================================
ACCESSIBILITY
==========================================================*/

document.querySelectorAll("button").forEach(button => {
    button.addEventListener("keyup", e => {
        if (e.key === "Enter" || e.key === " ") button.click();
    });
});

document.querySelectorAll("img").forEach(img => {
    img.loading = "lazy";
    img.decoding = "async";
});

/*==========================================================
BOOT
==========================================================*/

window.addEventListener("load", () => {
    DOM.body.classList.add("loaded");
    playIntro();
});