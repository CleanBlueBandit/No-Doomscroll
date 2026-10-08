console.log("content.js loaded");

let selectors = {};
let blockpage = false;
let currentSite = null;

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function loadSelectors() {
    const response = await fetch(chrome.runtime.getURL("selectors.json"));
    selectors = await response.json();

    console.log("Selectors loaded:", selectors);
}

function getCurrentSite() {
    const url = window.location.href;

    for (const site in selectors) {
        if (url.includes(site)) {
            return site;
        }
    }

    return null;
}

async function main() {
    await loadSelectors();

    while (true) {
        const site = getCurrentSite();

        if (site !== currentSite) {
            currentSite = site;

            if (site) {
                blockpage = true;
                console.log(`Detected: ${site}`);
            } else {
                blockpage = false;
                console.log("Unsupported page.");
            }
        }

        if (blockpage && currentSite) {
            const selector = selectors[currentSite];
            const element = document.querySelector(selector);

            if (element) {
                element.remove();
            }
        }

        await sleep(50);
    }
}

document.addEventListener("keydown", e => {
    if (!blockpage) return;

    if (e.key === "ArrowDown") {
        console.log("Arrow down blocked");
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, true);

document.addEventListener("wheel", e => {
    if (!blockpage) return;

    console.log("Scrolling blocked");
    e.preventDefault();
}, {
    capture: true,
    passive: false
});

document.addEventListener("touchmove", e => {
    if (!blockpage) return;

    console.log("Scrolling blocked");
    e.preventDefault();
}, {
    capture: true,
    passive: false
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}