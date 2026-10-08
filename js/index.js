// ========== DREAMY DIARIES — LOCK SCREEN ==========
// Same behaviour as before: SHA-256 password check -> 4 second love animation -> diary.html.
// Improvements: Enter key submits, no leaked debug logging, animation styles live in CSS,
// floating hearts pause when the tab is hidden, and reduced-motion is respected.

const storedHash = "d76ebaf36c676269f627a0931172d7e8c41dab7e78571041c74c245d6b3b86ba";
const REDIRECT_URL = "diary.html";
const REDIRECT_DELAY_MS = 4000;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// SHA-256 hashing function
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const els = {
  form: document.getElementById("lockForm"),
  input: document.getElementById("password"),
  error: document.getElementById("error"),
  toggleBtn: document.getElementById("toggleBtn"),
  toggleIcon: document.getElementById("toggleIcon"),
  toggleText: document.getElementById("toggleText"),
  unlockBtn: document.getElementById("unlockBtn"),
};

let unlocking = false;

function showError(message) {
  els.error.textContent = message;
  // restart the shake animation every time
  els.error.classList.remove("shake");
  void els.error.offsetWidth;
  els.error.classList.add("shake");
}

async function unlock() {
  if (unlocking) return;

  // crypto.subtle only exists on secure origins (https / localhost)
  if (!window.crypto || !crypto.subtle) {
    showError("This page needs a secure (https) connection to unlock.");
    return;
  }

  const hashedInput = await hashPassword(els.input.value);

  if (hashedInput !== storedHash) {
    showError("Incorrect password. Try again.");
    els.input.select();
    return;
  }

  unlocking = true;
  els.error.textContent = "";
  els.unlockBtn.disabled = true;

  try {
    localStorage.setItem("dreamyDiariesAuth", hashedInput);
  } catch (e) {
    /* storage can be blocked (private mode) — unlocking still works */
  }

  playUnlockAnimation();
}

function playUnlockAnimation() {
  const overlay = document.createElement("div");
  overlay.className = "unlock-overlay";
  overlay.setAttribute("role", "status");
  overlay.innerHTML = `
    <img src="assets/favicon-192.png" class="overlay-favicon" alt="" width="64" height="64" />
    <div class="overlay-glow">Loveee, oh my loveee 💖</div>
    <div class="overlay-poem">Loveee and only loveee </div>
    <div class="overlay-poem">The loveee of my loveee, the deepest loveee 💖</div>
  `;
  document.body.appendChild(overlay);

  // Floating hearts on the overlay
  const heartInterval = setInterval(() => {
    const heart = document.createElement("div");
    heart.className = "overlay-heart";
    heart.textContent = "💖";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.top = Math.random() * 80 + "vh";
    heart.style.fontSize = Math.random() * 25 + 20 + "px";
    overlay.appendChild(heart);
    setTimeout(() => heart.remove(), 6000);
  }, prefersReducedMotion ? 600 : 200);

  // Wait, then go to the diary
  setTimeout(() => {
    clearInterval(heartInterval);
    window.location.href = REDIRECT_URL;
  }, REDIRECT_DELAY_MS);
}

// ----- Show / hide password -----
function togglePassword() {
  const showing = els.input.type === "text";
  els.input.type = showing ? "password" : "text";
  els.input.classList.toggle("visible-password", !showing);
  els.toggleIcon.textContent = showing ? "👁️" : "🙈";
  els.toggleText.textContent = showing ? "Show" : "Hide";
  els.toggleBtn.setAttribute("aria-pressed", String(!showing));
  els.toggleBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  els.input.focus();
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault(); // Enter key and the Unlock button both land here
  unlock();
});
els.toggleBtn.addEventListener("click", togglePassword);
els.input.addEventListener("input", () => {
  if (els.error.textContent) els.error.textContent = "";
});

// ----- Background floating hearts -----
const MAX_BG_HEARTS = 14;
function createHeart() {
  if (document.hidden) return;
  if (document.querySelectorAll(".heart").length >= MAX_BG_HEARTS) return;
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "💖";
  heart.style.left = Math.random() * 100 + "vw";
  heart.style.fontSize = Math.random() * 25 + 15 + "px";
  heart.style.animationDuration = Math.random() * 3 + 4 + "s";
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 7500);
}
if (!prefersReducedMotion) setInterval(createHeart, 800);

/* Auto-login (kept disabled, exactly as before)
(async function () {
  const auth = localStorage.getItem("dreamyDiariesAuth");
  if (auth && auth === storedHash) window.location.href = "diary.html";
})();
*/
