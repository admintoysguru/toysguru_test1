const powerSwitch = document.getElementById("powerSwitch");

const hero = document.querySelector(".hero");

const glow = document.getElementById("backgroundGlow");

const dust = document.getElementById("dust");

const spotlights = document.querySelectorAll(".spotlight");

const vaultTitle = document.querySelector(".vaultTitle");

const logo = document.getElementById("logo");

const tagline = document.querySelector(".tagline");

const buttons = document.querySelector(".buttons");

const switchClick = document.getElementById("switchClick");

const relayClick = document.getElementById("relayClick");

const roomHum = document.getElementById("roomHum");

const logoBoom = document.getElementById("logoBoom");

let powered = false;

powerSwitch.onclick = async () => {

    if(powered) return;

    powered = true;

    powerSwitch.classList.add("active");

    play(switchClick);

    await wait(250);

    glow.classList.add("active");

    play(roomHum);

    for(const light of spotlights){

        light.classList.add("active");

        play(relayClick);

        await wait(180);

    }

    dust.classList.add("active");

    await wait(600);

    hero.classList.add("show");

    vaultTitle.classList.add("show");

    logo.classList.add("show");

    tagline.classList.add("show");

    buttons.classList.add("show");

    play(logoBoom);

};

function play(audio){

    if(!audio) return;

    audio.currentTime = 0;

    audio.play().catch(()=>{});

}

function wait(ms){

    return new Promise(resolve=>{

        setTimeout(resolve,ms);

    });

}