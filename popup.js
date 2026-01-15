const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const emojiThumb = document.getElementById("emoji-thumb");
const sliderWrapper = document.querySelector(".slider-wrapper");

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
  const val = parseFloat(speed);
  speedValue.textContent = val + "x";
  emojiThumb.textContent = getEmojiForSpeed(val);

  // Calculate Position
  const min = parseFloat(speedSlider.min);
  const max = parseFloat(speedSlider.max);

  // Calculate percentage (0 to 1)
  const percentage = (val - min) / (max - min);

  // Update Left Position
  emojiThumb.style.left = `${percentage * 100}%`;
}

function applySpeed(speed) {
  const v = parseFloat(speed);
  chrome.storage &&
    chrome.storage.sync &&
    chrome.storage.sync.set({ speed: v });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SET_SPEED", speed: v });
    }
  });
}

// Load saved speed
chrome.storage &&
  chrome.storage.sync &&
  chrome.storage.sync.get("speed", (data) => {
    if (data && typeof data.speed !== "undefined") {
      speedSlider.value = data.speed;
      updateUI(data.speed);
    } else {
      updateUI(speedSlider.value);
    }
  });

// Real-time updates (auto-apply while sliding)
speedSlider.addEventListener("input", () => {
  const speed = speedSlider.value;
  updateUI(speed);
  applySpeed(speed);
});

// Dragging the emoji to change speed
let dragging = false;

function handlePointer(e) {
  const rect = sliderWrapper.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));
  const percentage = x / rect.width;
  const min = parseFloat(speedSlider.min);
  const max = parseFloat(speedSlider.max);
  const step = parseFloat(speedSlider.step) || 0.25;

  let value = min + percentage * (max - min);
  value = Math.round(value / step) * step;
  value = Math.max(min, Math.min(max, value));

  speedSlider.value = value;
  updateUI(value);
  applySpeed(value);
}

emojiThumb.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  dragging = true;
  emojiThumb.setPointerCapture(e.pointerId);
  emojiThumb.classList.add("dragging");
  handlePointer(e);
});

emojiThumb.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  handlePointer(e);
});

window.addEventListener("pointerup", (e) => {
  if (!dragging) return;
  dragging = false;
  try {
    emojiThumb.releasePointerCapture(e.pointerId);
  } catch (err) {}
  emojiThumb.classList.remove("dragging");
});
// Keyboard navigation for precision and preventing video seeking
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    // Prevent default browser behavior (scrolling/seeking)
    e.preventDefault();
    e.stopPropagation();

    const step = parseFloat(speedSlider.step) || 0.25;
    let currentValue = parseFloat(speedSlider.value);
    const min = parseFloat(speedSlider.min);
    const max = parseFloat(speedSlider.max);

    if (e.key === "ArrowLeft") {
      currentValue = Math.max(min, currentValue - step);
    } else {
      currentValue = Math.min(max, currentValue + step);
    }

    // Fix floating point precision
    currentValue = Math.round(currentValue * 100) / 100;

    speedSlider.value = currentValue;
    updateUI(currentValue);
    applySpeed(currentValue);
  }
});
