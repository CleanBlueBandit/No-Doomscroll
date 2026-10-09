console.log("content.js loaded");

let selectors = {};
let blockpage = false;
let currentSite = null;

const SCROLL_COOLDOWN_MS = 1000;  
const FLUSH_DELAY_MS = 500; 

let lastScrollAttempt = 0;
let pendingScrollAttempts = 0;
let flushTimer = null;

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

function registerScrollAttempt(source) {
    const now = Date.now();
    if (now - lastScrollAttempt < SCROLL_COOLDOWN_MS) return;

    lastScrollAttempt = now;
    pendingScrollAttempts++;
    console.log(`Scroll attempt blocked (${source})`);

    if (!flushTimer) {
        flushTimer = setTimeout(flushScrollAttempts, FLUSH_DELAY_MS);
    }
}

async function flushScrollAttempts() {
    flushTimer = null;
    if (pendingScrollAttempts === 0) return;

    const toAdd = pendingScrollAttempts;
    pendingScrollAttempts = 0;

    try {
        const { scrollAttempts = 0 } = await chrome.storage.local.get("scrollAttempts");
        await chrome.storage.local.set({ scrollAttempts: scrollAttempts + toAdd });
    } catch (err) {
        console.warn("Could not save scroll attempts:", err);
    }
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

async function incrementTotalBlocked() {
    try {
        const { totalBlocked = 0 } = await chrome.storage.local.get("totalBlocked");
        await chrome.storage.local.set({ totalBlocked: totalBlocked + 1 });
    } catch (err) {
        console.warn("Could not save totalBlocked:", err);
    }
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
                await incrementTotalBlocked();
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
        e.preventDefault();
        e.stopImmediatePropagation();
        registerScrollAttempt("arrow down");
    }
}, true);

document.addEventListener("wheel", e => {
    if (!blockpage) return;

    e.preventDefault();
    registerScrollAttempt("wheel");
}, {
    capture: true,
    passive: false
});

document.addEventListener("touchmove", e => {
    if (!blockpage) return;

    e.preventDefault();
    registerScrollAttempt("touch");
}, {
    capture: true,
    passive: false
});

window.addEventListener("pagehide", flushScrollAttempts);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}