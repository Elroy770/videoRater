const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const emojiThumb = document.getElementById("emoji-thumb");
const applyBtn = document.getElementById("apply");

// Emoji ranges (Updated for 5x max)
function getEmojiForSpeed(speed) {
    if (speed < 0.8) return "😴"; // Sleepy
    if (speed < 1.2) return "🙂"; // Content/Normal
    if (speed < 1.8) return "😊"; // Happy
    if (speed < 2.5) return "😃"; // Grinning
    if (speed < 4.0) return "😎"; // Cool (Up to 4)
    return "🚀"; // Rocket (4-5)
}

function updateUI(speed) {
    speedValue.textContent = speed + "x";
    emojiThumb.textContent = getEmojiForSpeed(speed);

    // Calculate Position
    const min = parseFloat(speedSlider.min);
    const max = parseFloat(speedSlider.max);
    const val = parseFloat(speed);

    // Calculate percentage (0 to 1)
    const percentage = (val - min) / (max - min);

    // Update Left Position
    emojiThumb.style.left = `${percentage * 100}%`;
}

// Load saved speed
chrome.storage.sync.get("speed", (data) => {
    if (data.speed) {
        speedSlider.value = data.speed;
        updateUI(data.speed);
    } else {
        updateUI(speedSlider.value);
    }
});

// Real-time updates
speedSlider.addEventListener("input", () => {
    const speed = speedSlider.value;
    updateUI(speed);
});

applyBtn.addEventListener("click", () => {
    const speed = parseFloat(speedSlider.value);

    chrome.storage.sync.set({ speed });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "SET_SPEED",
                speed
            });
        }
    });

    // Visual feedback
    const originalText = applyBtn.innerText;
    applyBtn.innerText = "Applied!";
    applyBtn.style.backgroundColor = "#10b981";

    setTimeout(() => {
        applyBtn.innerText = originalText;
        applyBtn.style.backgroundColor = "";
    }, 1500);
});
