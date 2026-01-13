console.log("video rater loaded (declarative)");

let currentSpeed = 1;

function applyToVideo(video) {
    if (!video) return;
    // We don't return early anymore; we always check/enforce
    video.__videoRaterApplied = true;

    const enforce = () => {
        if (video.playbackRate !== currentSpeed) video.playbackRate = currentSpeed;
    };

    // Apply immediately and keep enforcing on common events
    try { video.playbackRate = currentSpeed; } catch (e) {}
    video.addEventListener('ratechange', enforce);
    video.addEventListener('play', () => { video.playbackRate = currentSpeed; });
    video.addEventListener('loadedmetadata', () => { video.playbackRate = currentSpeed; });
}

function applyToAllVideos() {
    document.querySelectorAll('video').forEach(applyToVideo);
}

// On load, fetch stored speed and apply
chrome.storage && chrome.storage.sync && chrome.storage.sync.get('speed', (data) => {
    if (data && typeof data.speed !== 'undefined') {
        currentSpeed = data.speed;
    }
    applyToAllVideos();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SET_SPEED') {
        currentSpeed = msg.speed;
        // Apply now and a few times over the next seconds to catch replacements/SPA changes
        applyToAllVideos();

        let attempts = 0;
        const interval = setInterval(() => {
            applyToAllVideos();
            if (++attempts > 12) clearInterval(interval);
        }, 500);
    }
});

// React to storage changes (if another popup or tab updates the speed)
chrome.storage && chrome.storage.onChanged && chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.speed) {
        currentSpeed = changes.speed.newValue;
        applyToAllVideos();
    }
});

// Observe DOM mutations to detect newly added videos (works for SPA and dynamic sites)
const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'VIDEO') applyToVideo(node);
            else if (node.querySelectorAll) node.querySelectorAll('video').forEach(applyToVideo);
        }
    }
});

if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Fallback: consistently ensure videos have the right speed in case the page replaces them silently
setInterval(() => {
    applyToAllVideos();
}, 1000);