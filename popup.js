let lastVideo = document.querySelector("video");

const observer = new MutationObserver(() => {
    const video = document.querySelector("video");

    if (video !== lastVideo) {
        console.log("VIDEO ELEMENT CHANGED");
        console.log("OLD:", lastVideo);
        console.log("NEW:", video);

        lastVideo = video;
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});