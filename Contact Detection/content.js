console.log("✅ Recruiter Filter + PHONE-ONLY MODE STARTED");

// ================= RUNNING FLAG =================
let running = true;

// ================= PHONE REGEX (US, ROBUST) =================
const phoneRegex = /\b(?:\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})(?:\s*(?:ext|EXT|x|extension|Ext|Ext:)\s*[:.]?\s*\d{1,5})?\b/g;

const foundPhones = new Set();
let firstPhoneFound = false; // 🔑 KEY FLAG

// ================= US STATES =================
const usStates = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","illinois","new york","new jersey",
  "texas","washington","virginia","ohio",
  "ca","tx","ny","nj","il","fl","va","wa"
];

// ================= HELPERS =================
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

// ================= PHONE CHECK =================
function hasPhoneNumber(post) {
  phoneRegex.lastIndex = 0;
  return phoneRegex.test(post.innerText);
}

// ================= AUTO SCROLL =================
let autoScrollInterval = null;
let autoScrollRunning = false;

function startAutoScroll() {
  if (autoScrollRunning) return;
  autoScrollRunning = true;
  console.log("🟢 Auto-scroll started");

  autoScrollInterval = setInterval(() => {
    window.scrollBy({ top: 600, behavior: "smooth" });
  }, 1200);
}

function stopAutoScroll(reason = "") {
  if (!autoScrollRunning) return;
  clearInterval(autoScrollInterval);
  autoScrollInterval = null;
  autoScrollRunning = false;
  console.log("🛑 Auto-scroll stopped →", reason);
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
    console.log("📞 Recruiter Phone Found:", clean);

    // 🛑 STOP IMMEDIATELY AFTER FIRST PHONE
    if (!firstPhoneFound) {
      firstPhoneFound = true;
      stopAutoScroll("First phone number found");
    }

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
  if (!running || post.dataset.scored) return;
  post.dataset.scored = "true";

  const text = post.innerText.toLowerCase();

  if (!hasPhoneNumber(post) || !isUSPost(text)) {
    post.style.display = "none";
    return;
  }

  post.style.display = "block";
  post.style.border = "3px solid #0a66c2";
  post.style.background = "#eef6ff";
  post.style.position = "relative";

  extractPhones(post);
  rankFeed();
}

// ================= RANK FEED =================
function rankFeed() {
  const posts = [...document.querySelectorAll("div.feed-shared-update-v2")]
    .filter(p => p.dataset.scored)
    .sort((a, b) => b.innerText.length - a.innerText.length);

  posts.forEach(p => p.parentElement.prepend(p));
}

// ================= EXPAND / LOAD MORE =================
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

// ================= CSV EXPORT =================
function exportPhonesToCSV() {
  if (foundPhones.size === 0) {
    console.warn("⚠️ No phone numbers found yet.");
    return;
  }

  const csv =
    "data:text/csv;charset=utf-8," + Array.from(foundPhones).join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = "recruiter_phones.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`✅ Exported ${foundPhones.size} phone numbers`);
}

// ================= HOTKEYS =================
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.code === "KeyE") exportPhonesToCSV();
  if (e.ctrlKey && e.shiftKey && e.code === "KeyS") startAutoScroll();
  if (e.ctrlKey && e.shiftKey && e.code === "KeyX") stopAutoScroll("Manual stop");
});

// ================= START =================
startAutoScroll();

console.log("🚀 AUTO-SCROLL ENABLED");
console.log("🛑 Stops after FIRST phone number only");
console.log("💡 Ctrl+Shift+E → Export CSV");
