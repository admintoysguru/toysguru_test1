const hero = document.querySelector(".hero");

const glow = document.getElementById("backgroundGlow");

const dust = document.getElementById("dust");

const spotlights = document.querySelectorAll(".spotlight");

const vaultTitle = document.querySelector(".vaultTitle");

const logo = document.getElementById("logo");

const tagline = document.querySelector(".tagline");

const buttons = document.querySelector(".buttons");

window.addEventListener("load", startIntro);

async function startIntro() {

    glow.classList.add("active");

    await wait(250);

    for (const light of spotlights) {

        light.classList.add("active");

        await wait(180);

    }

    dust.classList.add("active");

    await wait(600);

    hero.classList.add("show");

    vaultTitle.classList.add("show");

    logo.classList.add("show");

    tagline.classList.add("show");

    buttons.classList.add("show");

}

function wait(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}