console.log("video rater loaded");

let currentSpeed = 1;
function getVideo() {
    return document.querySelector("video");
}
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SET_SPEED") {
        const video = getVideo();
        if (!video) return;

        currentSpeed = msg.speed;
        video.playbackRate = currentSpeed;
    }
})