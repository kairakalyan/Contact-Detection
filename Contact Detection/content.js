console.log("✅ Recruiter Filter + PHONE-VISIBLE MODE STARTED");

// ================= FLAGS =================
let running = true;
let scrollStopped = false;

// ================= PHONE REGEX =================
const phoneRegex = /\b(?:\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})(?:\s*(?:ext|EXT|x|extension|Ext|Ext:)\s*[:.]?\s*\d{1,5})?\b/g;
const foundPhones = new Set();

// ================= US CHECK =================
const usStates = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","illinois","new york","new jersey",
  "texas","washington","virginia","ohio",
  "ca","tx","ny","nj","il","fl","va","wa"
];

const hasAny = (text, list) => list.some(k => text.includes(k));
const hasUSZip = text => /\b\d{5}\b/.test(text);

function isUSPost(text) {
  return (
    hasAny(text, usStates) ||
    hasUSZip(text) ||
    text.includes("united states") ||
    text.includes("usa") ||
    text.includes("remote us")
  );
}

// ================= VIEWPORT CHECK =================
function isVisible(post) {
  const r = post.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

// ================= AUTO SCROLL =================
let autoScrollInterval = null;
let autoScrollRunning = false;
let scrollBtn;

function startAutoScroll() {
  if (autoScrollRunning || scrollStopped) return;
  autoScrollRunning = true;
  updateButton();

  autoScrollInterval = setInterval(() => {
    window.scrollBy({ top: 600, behavior: "smooth" });
  }, 1200);
}

function stopAutoScroll(reason) {
  if (!autoScrollRunning) return;
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
  autoScrollRunning = false;
  scrollStopped = true;
  updateButton();
  console.log("🛑 Auto-scroll stopped →", reason);
}

// ================= BUTTON =================
function createScrollButton() {
  scrollBtn = document.createElement("button");
  scrollBtn.style.cssText = `
    position:fixed;
    bottom:20px;
    left:20px;
    z-index:99999;
    padding:10px 14px;
    font-size:13px;
    font-weight:600;
    border:none;
    border-radius:6px;
    cursor:pointer;
    color:#fff;
    box-shadow:0 4px 10px rgba(0,0,0,.3);
  `;

  scrollBtn.onclick = () => {
    autoScrollRunning ? stopAutoScroll("Paused manually") : startAutoScroll();
  };

  document.body.appendChild(scrollBtn);
  updateButton();
}

function updateButton() {
  if (!scrollBtn) return;

  if (scrollStopped) {
    scrollBtn.innerText = "📞 Phones Found";
    scrollBtn.style.background = "#2e7d32";
    scrollBtn.disabled = true;
    return;
  }

  if (autoScrollRunning) {
    scrollBtn.innerText = "⏸ Pause Scroll";
    scrollBtn.style.background = "#0a66c2";
  } else {
    scrollBtn.innerText = "▶ Resume Scroll";
    scrollBtn.style.background = "#d32f2f";
  }
}

// ================= PHONE HELPERS =================
function hasPhone(post) {
  phoneRegex.lastIndex = 0;
  return phoneRegex.test(post.innerText);
}

// ================= EXTRACT PHONE =================
function extractPhones(post) {
  if (post.dataset.phoneExtracted) return;
  post.dataset.phoneExtracted = "true";

  phoneRegex.lastIndex = 0;
  const matches = post.innerText.match(phoneRegex);
  if (!matches) return;

  matches.forEach(num => {
    const clean = num.trim();
    if (foundPhones.has(clean)) return;

    foundPhones.add(clean);
    console.log("📞 Phone:", clean);

    const badge = document.createElement("div");
    badge.innerText = `📞 ${clean}`;
    badge.style.cssText =
      "position:absolute;bottom:8px;right:8px;background:#0a66c2;color:#fff;padding:4px 6px;font-size:11px;border-radius:4px;z-index:999;cursor:pointer";
    badge.onclick = () => navigator.clipboard.writeText(clean);
    post.appendChild(badge);
  });
}

// ================= PROCESS POSTS =================
function processPost(post) {
  const text = post.innerText.toLowerCase();

  const phonePresent = hasPhone(post);
  const usPost = isUSPost(text);
  const visible = isVisible(post);

  // ❌ Hide irrelevant posts
  if (!phonePresent || !usPost) {
    post.style.display = "none";
    return;
  }

  // ✅ Show & highlight all phone posts
  post.style.display = "block";
  post.style.border = "3px solid #0a66c2";
  post.style.background = "#eef6ff";
  post.style.position = "relative";

  extractPhones(post);

  // 🛑 Stop scrolling if ANY phone post is visible
  if (visible && !scrollStopped) {
    stopAutoScroll("Phone post visible");
  }
}

// ================= EXPAND / LOAD =================
function expandPostOnce() {
  const btn = document.querySelector(
    'button.feed-shared-inline-show-more-text__see-more-less-toggle:not([data-clicked])'
  );
  if (btn) {
    btn.dataset.clicked = "true";
    btn.click();
  }
}

function clickLoadMoreOnce() {
  const btn = document.querySelector(
    'button[aria-label*="more"]:not([data-clicked])'
  );
  if (btn && btn.offsetParent !== null) {
    btn.dataset.clicked = "true";
    btn.click();
  }
}

// ================= OBSERVER =================
const observer = new MutationObserver(() => {
  document.querySelectorAll("div.feed-shared-update-v2").forEach(processPost);
  expandPostOnce();
  clickLoadMoreOnce();
});

observer.observe(document.body, { childList: true, subtree: true });

// ================= START =================
createScrollButton();
startAutoScroll();

console.log("🚀 Auto-scroll active");
console.log("📞 Shows ALL posts with visible contacts");
console.log("🛑 Stops when any phone post is visible");
