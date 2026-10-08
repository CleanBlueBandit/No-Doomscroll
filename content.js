console.log("Content.js loaded.");

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    while (true) {
        const scrolldown =
            document.querySelector('[aria-label="Next video"]') ||
            document.querySelector('[aria-label="Navigate to next reel"]');

        if (scrolldown) {
            scrolldown.remove();
        }

        await sleep(50);
    }
}

document.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") {
        console.log("Arrow down blocked");
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, true);

document.addEventListener("wheel", e => {
    console.log("Scrolling blocked");
    e.preventDefault();
}, {
    capture: true,
    passive: false
});

document.addEventListener("touchmove", e => {
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