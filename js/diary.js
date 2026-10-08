// =====================================================================
// DREAMY DIARIES — diary.js
// ---------------------------------------------------------------------
// Data comes from data/creations.json. Each creation can have:
//   - date:        YYYY-MM-DD            (day it belongs to)
//   - availableAt: YYYY-MM-DDTHH:mm      (exact moment it opens)
// Times WITHOUT an explicit offset are read as Bangladesh time (UTC+6), so the
// unlock moment is the same real instant for every visitor, anywhere.
// If the moment is in the future the entry is "Coming Soon", else "Published".
// =====================================================================

// ---------- Config ----------
const DATA_URL = "data/creations.json";
const TZ = "Asia/Dhaka";
const TZ_OFFSET = "+06:00";
const NEW_WINDOW_DAYS = 7;
const MAX_TIMEOUT_MS = 2147483647; // setTimeout upper bound (~24.8 days)
const AUTO_CHECK_COOLDOWN_MS = 30 * 1000;
const CACHE_KEY = "diaryCreationsCache";

// ---------- State ----------
let creations = [];
let dataVersion = "1.0.0";
let dataSignature = "";
let lastFetchedAt = null;
let lastCheckAt = 0;
let updateHistory = [];
let newItemsCount = 0;
let autoRefreshInterval = 5; // minutes
let autoRefreshTimer = null;
let unlockTimer = null;
let previousCreationIds = new Set();
let hasInitialSnapshot = false;
let isOnline = navigator.onLine;

let statusFilter = "all";
let searchQuery = "";
let yearFilter = "";
let monthFilter = "";
let categoryFilter = "";
let sortKey = "date"; // "date" | "title"
let sortDir = "asc"; // "asc" (oldest first, the original sequence) | "desc"

const $ = (id) => document.getElementById(id);

// ---------- Small helpers ----------
function lsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* storage unavailable (private mode / quota) — app keeps working */
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ---------- Date handling (Bangladesh time) ----------
function parseDhaka(str) {
  if (!str || typeof str !== "string") return null;
  const value = str.trim();
  let d;
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(value) && value.includes("T")) {
    d = new Date(value); // already has an explicit offset
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d = new Date(`${value}T00:00:00${TZ_OFFSET}`);
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    d = new Date(`${value}${value.length === 16 ? ":00" : ""}${TZ_OFFSET}`);
  } else {
    return null;
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const fullFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
});

function formatEntryDate(c) {
  const d = c._at;
  if (!d) return c.date || "";
  const hasTime = c.availableAt && !/T00:00(:00)?$/.test(c.availableAt);
  return hasTime ? `${dayFmt.format(d)} · ${timeFmt.format(d)}` : dayFmt.format(d);
}

function normalizeCreations(list) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((raw) => {
    if (!raw || !raw.title) return;
    const key = [raw.title, raw.link, raw.date, raw.availableAt].join("|");
    if (seen.has(key)) return; // drop exact duplicates
    seen.add(key);
    out.push({ ...raw, _idx: out.length, _at: parseDhaka(raw.availableAt) || parseDhaka(raw.date) });
  });
  return out;
}

function stripInternal(c) {
  const { _idx, _at, ...rest } = c;
  return rest;
}

function getAvailableDate(c) {
  return c._at;
}

function isComingSoon(c) {
  const dt = getAvailableDate(c);
  if (!dt) return true; // no date means not yet
  return dt > new Date();
}

function getCreationYear(c) {
  const source = c.date || (c.availableAt ? c.availableAt.slice(0, 10) : "");
  return source ? source.slice(0, 4) : "";
}

function getCreationMonth(c) {
  const source = c.date || (c.availableAt ? c.availableAt.slice(0, 10) : "");
  return source ? source.slice(0, 7) : "";
}

function formatMonthLabel(monthValue) {
  const parsed = new Date(`${monthValue}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return monthValue;
  return parsed.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCountdown(targetDate) {
  const diff = targetDate - new Date();
  if (diff <= 0) return "Available now!";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function safeUrl(link) {
  try {
    const u = new URL(link, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch (e) {
    return "";
  }
}

// ========== STATUS / HISTORY / BADGES ==========
function updateStatusDisplay(message, tone = "info") {
  const statusText = $("statusText");
  if (statusText) {
    statusText.textContent = message;
    statusText.dataset.tone = tone; // ok | warn | error | info (colours live in CSS)
  }
}

function updateLastSyncDisplay() {
  const lastSyncEl = $("lastSyncTime");
  if (lastSyncEl && lastFetchedAt) {
    lastSyncEl.textContent = `Last sync: ${formatTimeAgo(new Date(lastFetchedAt))}`;
  }
}

function addUpdateHistory(changeType, details) {
  updateHistory.unshift({ timestamp: new Date().toISOString(), changeType, details });
  if (updateHistory.length > 10) updateHistory.pop();
  lsSet("diaryUpdateHistory", JSON.stringify(updateHistory));
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = $("updateHistoryList");
  if (!historyList) return;
  historyList.replaceChildren();

  if (updateHistory.length === 0) {
    const item = el("div", "history-item");
    item.appendChild(el("span", "history-change", "No updates yet."));
    historyList.appendChild(item);
    return;
  }

  updateHistory.forEach((entry) => {
    const item = el("div", "history-item");
    item.appendChild(el("span", "history-time", new Date(entry.timestamp).toLocaleTimeString()));
    item.appendChild(el("span", "history-change", `${entry.changeType}: ${entry.details}`));
    historyList.appendChild(item);
  });
}

function toggleUpdateHistory() {
  const panel = $("updateHistoryPanel");
  if (panel) {
    const isOpen = panel.classList.toggle("open");
    panel.setAttribute("aria-hidden", String(!isOpen));
  }
}

function updateNewItemsBadge() {
  const badge = $("updateBadge");
  const badgeCount = document.querySelector(".badge-count");
  if (newItemsCount > 0 && badge && badgeCount) {
    badgeCount.textContent = newItemsCount;
    badge.style.display = "inline-flex";
  } else if (badge) {
    badge.style.display = "none";
  }
}

function checkForNewItems(newCreations) {
  const currentIds = new Set(newCreations.map((c) => c.title));

  // Build baseline on first load so all entries are not treated as "new".
  if (!hasInitialSnapshot) {
    previousCreationIds = currentIds;
    hasInitialSnapshot = true;
    return;
  }

  const newTitles = [...currentIds].filter((id) => !previousCreationIds.has(id));
  if (newTitles.length > 0) {
    newItemsCount = newTitles.length;
    updateNewItemsBadge();
    addUpdateHistory(
      "New Items",
      `${newTitles.length} new creation(s): ${newTitles.slice(0, 2).join(", ")}${newTitles.length > 2 ? "..." : ""}`
    );
  }
  previousCreationIds = currentIds;
}

// Offline/Online detection (only logs when the state really changes)
function updateOnlineStatus() {
  const offlineIndicator = $("offlineIndicator");
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  if (offlineIndicator) offlineIndicator.style.display = isOnline ? "none" : "inline-flex";
  if (wasOnline !== isOnline) {
    addUpdateHistory("Status", isOnline ? "Device is online" : "Device went offline");
  }
}

// ========== DATA LOADING ==========
async function fetchCreationsJson() {
  const response = await fetch(`${DATA_URL}?cache=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function applyData(data) {
  const list = normalizeCreations(data.creations);
  creations = list;
  dataVersion = data.version || "1.0.0";
  dataSignature = JSON.stringify(list.map(stripInternal));
  lastFetchedAt = new Date().toISOString();
  checkForNewItems(creations);
  updateLastSyncDisplay();
  updateFilterOptions();
  renderList();
}

async function loadCreationsData() {
  try {
    updateStatusDisplay("⏳ Loading data...");
    const data = await fetchCreationsJson();
    applyData(data);
    lsSet(CACHE_KEY, JSON.stringify(data));
    lastCheckAt = Date.now();
    updateStatusDisplay(`✅ Last updated: ${formatTimeAgo(new Date(lastFetchedAt))}`, "ok");
    return true;
  } catch (error) {
    console.error("Error loading creations:", error);
    const cached = lsGet(CACHE_KEY);
    if (cached) {
      try {
        applyData(JSON.parse(cached));
        updateStatusDisplay("❌ Error loading data. Using cached version.", "error");
        return false;
      } catch (e) {
        /* fall through to the empty state */
      }
    }
    updateStatusDisplay("❌ Error loading data.", "error");
    renderList();
    return false;
  }
}

// opts.manual = true when the person pressed "Check Updates"
async function checkForUpdates(opts) {
  const manual = !(opts && opts.auto);

  if (!manual && Date.now() - lastCheckAt < AUTO_CHECK_COOLDOWN_MS) return; // focus + visibility fire together
  if (!isOnline) {
    updateStatusDisplay("📡 No internet connection", "warn");
    return;
  }

  try {
    lastCheckAt = Date.now();
    updateStatusDisplay("🔄 Checking for updates...");
    const data = await fetchCreationsJson();
    const newVersion = data.version || dataVersion;
    const newSignature = JSON.stringify(normalizeCreations(data.creations).map(stripInternal));

    // Update when the version changes OR the content changed (even if version was not bumped)
    if (newVersion !== dataVersion || newSignature !== dataSignature) {
      updateStatusDisplay("📤 New updates available! Reloading...", "warn");
      applyData(data);
      lsSet(CACHE_KEY, JSON.stringify(data));
      addUpdateHistory("Version Update", `Updated to v${dataVersion}`);
      updateStatusDisplay(`✅ Updated to v${dataVersion}`, "ok");
    } else {
      lastFetchedAt = new Date().toISOString();
      updateStatusDisplay(`✅ You're up to date (v${dataVersion})`, "ok");
    }
    updateLastSyncDisplay();
  } catch (error) {
    console.error("Error checking for updates:", error);
    updateStatusDisplay("❌ Could not check for updates", "error");
  }
}

function setupAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  const intervalMinutes = Math.max(1, Math.min(60, autoRefreshInterval));
  autoRefreshTimer = setInterval(() => checkForUpdates({ auto: true }), intervalMinutes * 60 * 1000);
}

function downloadData() {
  const dataToDownload = {
    version: dataVersion,
    lastUpdated: new Date().toISOString(),
    creations: creations.map(stripInternal),
    totalCount: creations.length,
    categories: [...new Set(creations.map((c) => c.category || "Uncategorized"))],
  };

  const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DreamyDiaries_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  updateStatusDisplay("📥 Downloaded successfully!", "ok");
}

// ========== FILTERING ==========
// One matcher is used by the list AND by the month dropdown (which ignores the month filter itself).
function matches(c, sevenDaysAgo, skipMonth) {
  const coming = isComingSoon(c);

  if (statusFilter === "published" && coming) return false;
  if (statusFilter === "coming" && !coming) return false;
  if (statusFilter === "new") {
    if (coming) return false;
    const ad = getAvailableDate(c);
    if (!ad || ad < sevenDaysAgo) return false;
  }

  if (searchQuery) {
    const lower = searchQuery.toLowerCase();
    const dstr = c.date || (c.availableAt ? c.availableAt.slice(0, 10) : "");
    const hay = [c.title, dstr, formatEntryDate(c), c.category || "Uncategorized"].join(" ").toLowerCase();
    if (!hay.includes(lower)) return false;
  }

  if (yearFilter && getCreationYear(c) !== yearFilter) return false;
  if (!skipMonth && monthFilter && getCreationMonth(c) !== monthFilter) return false;

  const catStr = c.category ? c.category : "Uncategorized";
  if (categoryFilter && catStr !== categoryFilter) return false;

  return true;
}

function fillSelect(select, placeholder, values, labelFn) {
  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  values.forEach((v) => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = labelFn ? labelFn(v) : v;
    select.appendChild(option);
  });
}

function updateFilterOptions() {
  const filterYearEl = $("filterYear");
  const filterMonthEl = $("filterMonth");
  const filterCategoryEl = $("filterCategory");
  if (!filterYearEl || !filterMonthEl) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - NEW_WINDOW_DAYS);

  const years = [...new Set(creations.map(getCreationYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  // Month options reflect all active filters except month itself.
  const months = [
    ...new Set(creations.filter((c) => matches(c, sevenDaysAgo, true)).map(getCreationMonth).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a));

  fillSelect(filterYearEl, "All years", years);
  if (yearFilter && years.includes(yearFilter)) filterYearEl.value = yearFilter;
  else if (yearFilter) yearFilter = "";

  fillSelect(filterMonthEl, "All months", months, formatMonthLabel);
  if (monthFilter && months.includes(monthFilter)) filterMonthEl.value = monthFilter;
  else if (monthFilter) monthFilter = "";

  if (filterCategoryEl) {
    const categories = [...new Set(creations.map((c) => c.category || "Uncategorized"))].sort((a, b) =>
      a.localeCompare(b)
    );
    fillSelect(filterCategoryEl, "All categories", categories);
    if (categoryFilter && categories.includes(categoryFilter)) filterCategoryEl.value = categoryFilter;
    else if (categoryFilter) categoryFilter = "";
  }
}

// ========== SORTING ==========
function compareCreations(a, b) {
  let result;
  if (sortKey === "title") {
    result = a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true });
  } else {
    const da = a._at ? a._at.getTime() : Number.MAX_SAFE_INTEGER;
    const db = b._at ? b._at.getTime() : Number.MAX_SAFE_INTEGER;
    result = da - db;
  }
  if (result === 0) result = a._idx - b._idx; // keep the JSON order for ties (stable)
  return sortDir === "asc" ? result : -result;
}

function sortByTitle() {
  if (sortKey === "title") sortDir = sortDir === "asc" ? "desc" : "asc";
  else {
    sortKey = "title";
    sortDir = "asc";
  }
  renderList();
}

function sortByDate() {
  if (sortKey === "date") sortDir = sortDir === "asc" ? "desc" : "asc";
  else {
    sortKey = "date";
    sortDir = "asc";
  }
  renderList();
}

function updateSortButtons() {
  const arrow = sortDir === "asc" ? "↑" : "↓";
  const titleBtn = $("sortTitleBtn");
  const dateBtn = $("sortDateBtn");
  if (titleBtn) {
    titleBtn.textContent = sortKey === "title" ? `Sort by Title ${arrow}` : "Sort by Title";
    titleBtn.classList.toggle("is-active", sortKey === "title");
    titleBtn.setAttribute("aria-pressed", String(sortKey === "title"));
  }
  if (dateBtn) {
    dateBtn.textContent = sortKey === "date" ? `Sort by Date ${arrow}` : "Sort by Date";
    dateBtn.classList.toggle("is-active", sortKey === "date");
    dateBtn.setAttribute("aria-pressed", String(sortKey === "date"));
  }
}

// ========== RENDER ==========
function findLatestReleased() {
  return creations.reduce((best, c) => {
    if (isComingSoon(c) || !c._at) return best;
    return !best || c._at > best._at ? c : best;
  }, null);
}

function renderList() {
  const list = $("creationsList");
  list.replaceChildren();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - NEW_WINDOW_DAYS);

  const displayList = creations.filter((c) => matches(c, sevenDaysAgo, false)).sort(compareCreations);
  const latest = findLatestReleased();
  const groupByMonth = sortKey === "date";

  const monthCounts = {};
  displayList.forEach((c) => {
    const m = getCreationMonth(c) || "undated";
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });

  const counter = $("resultCount");
  if (counter) {
    counter.textContent = creations.length
      ? `Showing ${displayList.length} of ${creations.length}`
      : "";
  }

  if (displayList.length === 0) {
    const empty = el("li", "empty-state");
    empty.appendChild(el("span", "empty-emoji", creations.length ? "🔍" : "🦋"));
    empty.appendChild(
      el(
        "p",
        "",
        creations.length
          ? "No creations match these filters."
          : "No creations could be loaded. If you opened this file directly from your computer, host it (for example on GitHub Pages) or use a local server so data/creations.json can be read."
      )
    );
    list.appendChild(empty);
  }

  let lastMonthKey = null;
  displayList.forEach((c, i) => {
    if (groupByMonth) {
      const monthKey = getCreationMonth(c) || "undated";
      if (monthKey !== lastMonthKey) {
        lastMonthKey = monthKey;
        const divider = el("li", "month-divider");
        divider.appendChild(el("span", "month-name", monthKey === "undated" ? "No date" : formatMonthLabel(monthKey)));
        divider.appendChild(el("span", "month-count", `${monthCounts[monthKey]} ${monthCounts[monthKey] === 1 ? "entry" : "entries"}`));
        list.appendChild(divider);
      }
    }

    const coming = isComingSoon(c);
    const href = coming ? "" : safeUrl(c.link);

    const li = el("li", "entry");
    li.style.setProperty("--i", Math.min(i, 14));
    if (coming) li.classList.add("is-soon");

    const row = coming || !href ? el("button", "entry-link") : el("a", "entry-link");
    if (row.tagName === "A") {
      row.href = href;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    } else {
      row.type = "button";
    }

    row.appendChild(el("span", "entry-index", pad2(i + 1)));

    const main = el("span", "entry-main");
    main.appendChild(el("span", "entry-title", c.title));
    main.appendChild(el("span", "date", formatEntryDate(c)));
    row.appendChild(main);

    const tags = el("span", "entry-tags");
    tags.appendChild(el("span", "category", c.category || "Uncategorized"));

    if (c === latest) {
      const ad = getAvailableDate(c);
      if (ad && ad >= sevenDaysAgo) {
        li.classList.add("latest");
        tags.appendChild(el("span", "new-tag", "NEW 💖"));
      }
    }

    if (coming) {
      tags.appendChild(el("span", "coming-soon-text", "Coming Soon"));
      tags.appendChild(el("span", "coming-soon-heart", "♥"));
      row.addEventListener("click", () => showComingSoonPopup(c.title, getAvailableDate(c)));
      row.setAttribute("aria-label", `${c.title} — coming soon`);
    }
    row.appendChild(tags);
    row.appendChild(el("span", "entry-go", coming ? "🔒" : "↗"));

    li.appendChild(row);
    list.appendChild(li);
  });

  updateSortButtons();
  updateStats();
  scheduleNextUnlock();
}

// ========== STATS + NEXT UNLOCK ==========
function nextUnlockEntry() {
  const now = Date.now();
  let best = null;
  creations.forEach((c) => {
    if (c._at && c._at.getTime() > now && (!best || c._at < best._at)) best = c;
  });
  return best;
}

function updateStats() {
  const total = creations.length;
  const soon = creations.filter(isComingSoon).length;
  $("statTotal").textContent = total;
  $("statLive").textContent = total - soon;
  $("statSoon").textContent = soon;
  updateNextUnlockText();
}

function updateNextUnlockText() {
  const box = $("nextUnlock");
  const text = $("nextUnlockText");
  if (!box || !text) return;
  const next = nextUnlockEntry();
  if (!next) {
    box.hidden = true;
    return;
  }
  const diff = next._at - new Date();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const eta = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(minutes, 1)}m`;
  text.textContent = `${next.title} · in ${eta}`;
  box.hidden = false;
}

// When the next "Coming Soon" moment arrives the list refreshes itself (no reload needed).
function scheduleNextUnlock() {
  clearTimeout(unlockTimer);
  const next = nextUnlockEntry();
  if (!next) return;
  const delay = Math.min(next._at.getTime() - Date.now() + 500, MAX_TIMEOUT_MS);
  unlockTimer = setTimeout(() => {
    renderList();
    updateFilterOptions();
  }, Math.max(delay, 500));
}

// ========== COMING SOON POPUP ==========
let activeModal = null;

function closeComingSoonPopup() {
  if (!activeModal) return;
  clearInterval(activeModal.timer);
  document.removeEventListener("keydown", activeModal.onKey);
  activeModal.overlay.remove();
  document.body.classList.remove("modal-open");
  if (activeModal.prevFocus && activeModal.prevFocus.focus) activeModal.prevFocus.focus();
  activeModal = null;
}

function showComingSoonPopup(title, dateObj) {
  closeComingSoonPopup();
  const prevFocus = document.activeElement;

  const overlay = el("div", "modal-overlay");
  const modal = el("div", "modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modalTitle");

  const heart = el("div", "modal-heart", "💖");
  heart.setAttribute("aria-hidden", "true");
  const h2 = el("h2", "modal-title", "Coming Soon");
  h2.id = "modalTitle";
  modal.append(heart, h2);

  modal.appendChild(el("p", "modal-lead", `"${title}" will be available on:`));

  const cells = {};
  let countdownBox = null;
  if (dateObj) {
    modal.appendChild(el("p", "modal-when", `${fullFmt.format(dateObj)} (Bangladesh time)`));
    const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (viewerTz && viewerTz !== TZ) {
      modal.appendChild(el("p", "modal-local", `Your time: ${dateObj.toLocaleString()}`));
    }

    countdownBox = el("div", "countdown-grid");
    [["d", "days"], ["h", "hours"], ["m", "minutes"], ["s", "seconds"]].forEach(([k, label]) => {
      const cell = el("div", "countdown-cell");
      cells[k] = el("span", "", "00");
      cell.append(cells[k], el("small", "", label));
      countdownBox.appendChild(cell);
    });
    modal.appendChild(countdownBox);
    modal.appendChild(el("p", "modal-note", "Countdown until release"));
  } else {
    modal.appendChild(el("p", "modal-when", "Very soon"));
  }

  const closeBtn = el("button", "modal-close", "Close");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", closeComingSoonPopup);
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeComingSoonPopup();
  });
  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");

  const tick = () => {
    if (!dateObj) return;
    const diff = dateObj - new Date();
    if (diff <= 0) {
      countdownBox.replaceChildren(el("div", "countdown-done", "Available now! 🎉"));
      clearInterval(activeModal && activeModal.timer);
      return;
    }
    const s = Math.floor(diff / 1000);
    cells.d.textContent = pad2(Math.floor(s / 86400));
    cells.h.textContent = pad2(Math.floor((s % 86400) / 3600));
    cells.m.textContent = pad2(Math.floor((s % 3600) / 60));
    cells.s.textContent = pad2(s % 60);
  };

  const onKey = (e) => {
    if (e.key === "Escape") closeComingSoonPopup();
  };
  document.addEventListener("keydown", onKey);

  activeModal = { overlay, onKey, prevFocus, timer: null };
  tick();
  if (dateObj) activeModal.timer = setInterval(tick, 1000);
  closeBtn.focus();
}

// ========== EVENT WIRING ==========
function bindFilters() {
  $("filterStatus").addEventListener("change", function () {
    statusFilter = this.value;
    updateFilterOptions();
    renderList();
  });

  $("search").addEventListener("input", function () {
    searchQuery = this.value.trim();
    updateFilterOptions();
    renderList();
  });

  $("filterYear").addEventListener("change", function () {
    yearFilter = this.value;
    if (monthFilter && yearFilter && !monthFilter.startsWith(yearFilter)) monthFilter = "";
    updateFilterOptions();
    renderList();
  });

  $("filterMonth").addEventListener("change", function () {
    monthFilter = this.value;
    if (monthFilter) yearFilter = monthFilter.slice(0, 4);
    updateFilterOptions();
    renderList();
  });

  $("filterCategory").addEventListener("change", function () {
    categoryFilter = this.value;
    updateFilterOptions();
    renderList();
  });

  $("updateBadge").addEventListener("click", () => {
    newItemsCount = 0;
    updateNewItemsBadge();
  });
}

function bindMenu() {
  const menuToggle = $("menuToggle");
  const controlsMenu = $("controlsMenu");
  if (!menuToggle || !controlsMenu) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");

  const setOpen = (open) => {
    controlsMenu.classList.toggle("hidden", !open);
    menuToggle.classList.toggle("active", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  };

  // Only re-sync when the breakpoint is crossed. (A "resize" listener also fires when a phone keyboard
  // opens, which used to slam the menu shut while typing in the search box.)
  const sync = () => setOpen(!mobileQuery.matches);
  sync();
  if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", sync);
  else mobileQuery.addListener(sync);

  const closeOnMobile = () => {
    if (mobileQuery.matches) setOpen(false);
  };

  menuToggle.addEventListener("click", () => setOpen(controlsMenu.classList.contains("hidden")));
  controlsMenu.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", closeOnMobile));
  controlsMenu.querySelectorAll("select").forEach((s) => s.addEventListener("change", closeOnMobile));
  $("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") closeOnMobile();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  bindFilters();
  bindMenu();

  const intervalInput = $("refreshInterval");
  if (intervalInput) {
    intervalInput.addEventListener("change", (e) => {
      const parsed = parseInt(e.target.value, 10) || 5;
      autoRefreshInterval = Math.max(1, Math.min(60, parsed));
      e.target.value = autoRefreshInterval;
      lsSet("diaryRefreshInterval", autoRefreshInterval);
      setupAutoRefresh();
      addUpdateHistory("Settings", `Auto-refresh interval changed to ${autoRefreshInterval} minute(s)`);
      updateStatusDisplay(`✅ Auto-refresh set to ${autoRefreshInterval} minute(s)`, "ok");
    });

    const savedInterval = parseInt(lsGet("diaryRefreshInterval"), 10);
    if (savedInterval) {
      autoRefreshInterval = Math.max(1, Math.min(60, savedInterval));
      intervalInput.value = autoRefreshInterval;
    }
  }

  const savedHistory = lsGet("diaryUpdateHistory");
  if (savedHistory) {
    try {
      updateHistory = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Error loading history:", e);
    }
  }
  updateHistoryDisplay();

  updateOnlineStatus();
  loadCreationsData();
  setupAutoRefresh();

  // keep "Last sync" and "Next surprise" fresh without needing any user action
  setInterval(() => {
    updateLastSyncDisplay();
    updateNextUnlockText();
  }, 30 * 1000);
});

// Refresh when the person comes back to the tab / window (throttled so both events don't double-fire)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    updateLastSyncDisplay();
    checkForUpdates({ auto: true });
  }
});
window.addEventListener("focus", () => {
  updateLastSyncDisplay();
  checkForUpdates({ auto: true });
});
window.addEventListener("online", () => {
  updateOnlineStatus();
  checkForUpdates({ auto: true });
});
window.addEventListener("offline", updateOnlineStatus);
