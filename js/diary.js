// ========== AUTO-UPDATE & JSON LOADING SYSTEM ==========
let creations = [];
let dataVersion = "1.0.0";
let lastUpdateCheck = null;
let lastFetchedAt = null;
let updateHistory = [];
let newItemsCount = 0;
let autoRefreshInterval = 5; // minutes
let autoRefreshTimer = null;
let previousCreationIds = new Set();
let hasInitialSnapshot = false;
let isOnline = navigator.onLine;

// Update status display
function updateStatusDisplay(message, color = "#d63384") {
  const statusText = document.getElementById("statusText");
  if (statusText) {
    statusText.textContent = message;
    statusText.style.color = color;
  }
}

// Format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Update last sync time display
function updateLastSyncDisplay() {
  const lastSyncEl = document.getElementById("lastSyncTime");
  if (lastSyncEl && lastFetchedAt) {
    const timeAgo = formatTimeAgo(new Date(lastFetchedAt));
    lastSyncEl.textContent = `Last sync: ${timeAgo}`;
  }
}

// Add to update history
function addUpdateHistory(changeType, details) {
  const historyEntry = {
    timestamp: new Date(),
    changeType: changeType,
    details: details
  };
  updateHistory.unshift(historyEntry);
  if (updateHistory.length > 10) {
    updateHistory.pop();
  }
  localStorage.setItem('diaryUpdateHistory', JSON.stringify(updateHistory));
  updateHistoryDisplay();
}

// Display update history
function updateHistoryDisplay() {
  const historyList = document.getElementById("updateHistoryList");
  if (!historyList) return;

  if (updateHistory.length === 0) {
    historyList.innerHTML = '<div class="history-item"><span class="history-change">No updates yet.</span></div>';
    return;
  }

  historyList.innerHTML = updateHistory
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `
        <div class="history-item">
          <span class="history-time">${time}</span>
          <span class="history-change">${entry.changeType}: ${entry.details}</span>
        </div>
      `;
    })
    .join("");
}

// Toggle update history panel
function toggleUpdateHistory() {
  const panel = document.getElementById("updateHistoryPanel");
  if (panel) {
    const isOpen = panel.classList.toggle("open");
    panel.setAttribute("aria-hidden", String(!isOpen));
  }
}

// Update badge for new items
function updateNewItemsBadge() {
  const badge = document.getElementById("updateBadge");
  const badgeCount = document.querySelector(".badge-count");
  if (newItemsCount > 0 && badge && badgeCount) {
    badgeCount.textContent = newItemsCount;
    badge.style.display = "inline-flex";
  } else if (badge) {
    badge.style.display = "none";
  }
}

// Check for new items
function checkForNewItems(newCreations) {
  const currentIds = new Set(newCreations.map((c) => c.title));

  // Build baseline on first load so all entries are not treated as "new".
  if (!hasInitialSnapshot) {
    previousCreationIds = currentIds;
    hasInitialSnapshot = true;
    return;
  }

  let newCount = 0;
  const newTitles = [];

  currentIds.forEach((id) => {
    if (!previousCreationIds.has(id)) {
      newCount++;
      newTitles.push(id);
    }
  });

  if (newCount > 0) {
    newItemsCount = newCount;
    updateNewItemsBadge();
    addUpdateHistory(
      "New Items",
      `${newCount} new creation(s): ${newTitles.slice(0, 2).join(", ")}${newCount > 2 ? "..." : ""}`
    );
  }

  previousCreationIds = currentIds;
}

// Offline/Online detection
function updateOnlineStatus() {
  const offlineIndicator = document.getElementById("offlineIndicator");
  isOnline = navigator.onLine;

  if (!isOnline && offlineIndicator) {
    offlineIndicator.style.display = "inline-flex";
    addUpdateHistory("Status", "Device went offline");
  } else if (isOnline && offlineIndicator) {
    offlineIndicator.style.display = "none";
    addUpdateHistory("Status", "Device is online");
  }
}

// Load data from JSON file
async function loadCreationsData() {
  try {
    updateStatusDisplay("⏳ Loading data...");
    const response = await fetch("data/creations.json?cache=" + Date.now());
    
    if (!response.ok) {
      throw new Error("Failed to fetch creations data");
    }
    
    const data = await response.json();
    creations = data.creations || [];
    dataVersion = data.version || "1.0.0";
    lastFetchedAt = new Date().toISOString();
    
    checkForNewItems(creations);
    updateLastSyncDisplay();
    
    // Initialize filters with fresh data
    updateFilterOptions();
    renderList();
    updateStatusDisplay(`✅ Last updated: ${formatTimeAgo(new Date(lastFetchedAt))}`, "#28a745");
    
    return true;
  } catch (error) {
    console.error("Error loading creations:", error);
    updateStatusDisplay("❌ Error loading data. Using cached version.", "#dc3545");
    return false;
  }
}

// Check for updates periodically
async function checkForUpdates() {
  if (!isOnline) {
    updateStatusDisplay("📡 No internet connection", "#ffc107");
    return;
  }

  try {
    updateStatusDisplay("🔄 Checking for updates...");
    
    const response = await fetch("data/creations.json?cache=" + Date.now());
    const data = await response.json();
    const newVersion = data.version || dataVersion;
    
    if (newVersion !== dataVersion) {
      updateStatusDisplay("📤 New updates available! Reloading...", "#ffc107");
      creations = data.creations || [];
      dataVersion = newVersion;
      lastFetchedAt = new Date().toISOString();
      
      checkForNewItems(creations);
      addUpdateHistory("Version Update", `Updated to v${dataVersion}`);
      
      updateFilterOptions();
      renderList();
      updateLastSyncDisplay();
      updateStatusDisplay(`✅ Updated to v${dataVersion}`, "#28a745");
    } else {
      updateStatusDisplay(`✅ You're up to date (v${dataVersion})`, "#28a745");
    }
    updateLastSyncDisplay();
  } catch (error) {
    console.error("Error checking for updates:", error);
    updateStatusDisplay("❌ Could not check for updates", "#dc3545");
  }
}

// Setup custom refresh interval
function setupAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  const intervalMinutes = Math.max(1, Math.min(60, autoRefreshInterval));
  autoRefreshTimer = setInterval(checkForUpdates, intervalMinutes * 60 * 1000);
}

// Handle refresh interval change
document.addEventListener("DOMContentLoaded", function () {
  const intervalInput = document.getElementById("refreshInterval");
  if (intervalInput) {
    intervalInput.addEventListener("change", (e) => {
      autoRefreshInterval = parseInt(e.target.value) || 5;
      localStorage.setItem("diaryRefreshInterval", autoRefreshInterval);
      setupAutoRefresh();
      addUpdateHistory("Settings", `Auto-refresh interval changed to ${autoRefreshInterval} minute(s)`);
      updateStatusDisplay(`✅ Auto-refresh set to ${autoRefreshInterval} minute(s)`, "#28a745");
    });
    
    // Load saved interval
    const savedInterval = localStorage.getItem("diaryRefreshInterval");
    if (savedInterval) {
      autoRefreshInterval = parseInt(savedInterval);
      intervalInput.value = autoRefreshInterval;
    }
  }

  // Load update history from localStorage
  const savedHistory = localStorage.getItem('diaryUpdateHistory');
  if (savedHistory) {
    try {
      updateHistory = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Error loading history:", e);
    }
  }
  updateHistoryDisplay();

  // Initial data load
  loadCreationsData();
  setupAutoRefresh();
});

// Page Visibility API - refresh when user returns to tab
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    addUpdateHistory("Focus", "User returned to tab - checking for updates");
    updateLastSyncDisplay();
    checkForUpdates();
  }
});

// Window focus event - refresh when browser regains focus
window.addEventListener("focus", function () {
  addUpdateHistory("Focus", "Browser window regained focus");
  updateLastSyncDisplay();
  checkForUpdates();
});

// Online/Offline events
window.addEventListener("online", function () {
  isOnline = true;
  updateOnlineStatus();
  checkForUpdates();
});

window.addEventListener("offline", function () {
  isOnline = false;
  updateOnlineStatus();
});

// Initial online status
updateOnlineStatus();
updateLastSyncDisplay();

// Download data as JSON
function downloadData() {
  const dataToDownload = {
    version: dataVersion,
    lastUpdated: new Date().toISOString(),
    creations: creations,
    totalCount: creations.length,
    categories: [...new Set(creations.map(c => c.category || "Uncategorized"))]
  };
  
  const jsonString = JSON.stringify(dataToDownload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DreamyDiaries_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  updateStatusDisplay("📥 Downloaded successfully!", "#28a745");
}

// ========== ORIGINAL DIARY FUNCTIONALITY WITH JSON DATA ==========

// Each creation can have:
// - date: YYYY-MM-DD (legacy)
// - availableAt: ISO datetime (YYYY-MM-DDTHH:mm) for precise availability
// If availableAt is in the future, it is Coming Soon; else it's Published.
const creationsOld = [
  {
    title: "Heartfelt Reminders",
    link: "https://basharulalammazu.github.io/HeartfeltReminders/",
    date: "2025-02-23",
    category: "Personal",
  },
  {
    title: "How is she?",
    link: "https://mazudiary.github.io/HowSheIs/",
    date: "2025-03-24",
    category: "Personal",
  },
  {
    title: "Life Galary",
    link: "https://sites.google.com/view/basharullifegallery",
    date: "2025-03-30",
    category: "Portfolio",
  },
  {
    title: "ElaraValorFlower2025",
    link: "https://mazudiary.github.io/ElaraValorFlower2025/",
    date: "2025-05-15",
    category: "Special",
  },
  {
    title: "The Finest Soul",
    link: "https://mazudiary.github.io/TheFinestSoul/",
    date: "2025-05-17",
    category: "Personal",
  },
  {
    title: "Bio Data",
    link: "https://farzinahossainlopa.github.io/biodata/",
    date: "2025-04-04",
    category: "Utility",
  },
  {
    title: "Valobashiii Valobashaa😘💖",
    link: "https://mazudiary.github.io/ValobashiiiValobasha/",
    date: "2025-06-01",
    category: "Love",
  },
  {
    title: "Dream Valobashaa😘💖",
    link: "https://mazudiary.github.io/DreamValobasha/",
    date: "2025-06-03",
    category: "Love",
  },
  {
    title: "Eid Mubarak -Financial Harmony",
    link: "https://mazudiary.github.io/EidMubarak-FinancialHarmony/",
    date: "2025-06-06",
    category: "Holiday",
  },
  {
    title: "Elara Valor Tribute 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-2Months/",
    date: "2025-06-08",
    category: "Love",
  },
  {
    title: "Elara Valor BD 2025",
    link: "https://mazudiary.github.io/ElaraValorBD2025/",
    date: "2025-06-15",
    category: "Birthday",
  },
  {
    title: "Private Love Garden 😘💖",
    link: "https://mazudiary.github.io/privatelovegarden/",
    date: "2025-06-17",
    category: "Love",
  },
  {
    title: "Primary Key 😘💖",
    link: "https://mazudiary.github.io/privatelovegarden/",
    date: "2025-06-17",
    category: "Love",
  },
  {
    title: "Forever Always Counter😘💖",
    link: "https://mazudiary.github.io/primarykey/",
    date: "2025-07-18",
    category: "Counter",
  },
  {
    title: "Love Reply",
    link: "https://mazudiary.github.io/ForeverAlwaysCounter/",
    date: "2025-07-31",
    category: "Love",
  },
  {
    title: "Premii & Idiot – 2 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-2Months/",
    date: "2025-08-17",
    category: "Anniversary",
  },
  {
    title: "Premii & Idiot – 3 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-3Months/",
    date: "2025-09-17",
    availableAt: "2025-09-17T00:00",
    category: "Anniversary",
  },
  {
    title: "Tashbih Counter",
    link: "https://mazudiary.github.io/tashbihcounter/",
    date: "2025-09-22",
    availableAt: "2025-09-22T00:00",
    category: "Counter",
  },
  {
    title: "Premii & Idiot – 4 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-4Months/",
    date: "2025-10-17",
    availableAt: "2025-10-17T00:47",
    category: "Anniversary",
  },
  {
    title: "Premii & Idiot – 5 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-5Months/",
    date: "2025-11-17",
    availableAt: "2025-11-17T00:47",
    category: "Anniversary",
  },
  {
    title: "Thanks Giving 2025",
    link: "https://mazudiary.github.io/ThanksGiving2025/",
    date: "2025-11-27",
    availableAt: "2025-11-27T00:00",
    category: "Holiday",
  },
  {
    title: "Premii & Idiot – 6 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-6Months/",
    date: "2025-12-17",
    availableAt: "2025-12-17T00:47",
    category: "Anniversary",
  },
  {
    title: "Premii & Idiot – 6 Months(Special) 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-6Months-Special/",
    date: "2025-12-17",
    availableAt: "2025-12-17T00:47",
    category: "Anniversary",
  },
  
  {
    title: "Happy New Year 2027",
    link: "https://mazudiary.github.io/HappyNewYear2026/",
    date: "2026-01-01",
    availableAt: "2026-01-01T00:00",
    category: "Holiday",
  },

  {
    title: "Premii & Idiot – 7 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-7Months/",
    date: "2026-01-17",
    availableAt: "2026-01-17T00:47",
    category: "Anniversary",
  },

    {
    title: "From Book Fair to Forever 2026",
    link: "https://mazudiary.github.io/FromBookFairtoForever2026",
    date: "2026-01-14",
    availableAt: "2026-01-14T00:00",
    category: "Story",
  },

  {
    title: "Premii & Idiot – 8 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-8Months/",
    date: "2026-02-17",
    availableAt: "2026-02-17T00:47",
    category: "Anniversary",
  },

  {
    title: "Ramadan 2026",
    link: "https://mazudiary.github.io/Ramadan2026/",
    date: "2026-02-18",
    availableAt: "2026-02-18T18:00",
    category: "Holiday",
  },
  
  {
    title: "Premii Birthday's 2026",
    link: "https://mazudiary.github.io/PremiiBD2026/",
    date: "2026-05-15",
    availableAt: "2026-05-15T00:00",
    category: "Birthday",
  },
  
];

let filtered = [];
let statusFilter = "all";
let sortOrder = "asc";
let searchQuery = "";
let yearFilter = "";
let monthFilter = "";
let categoryFilter = "";

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

function matchesFiltersWithoutMonth(c, sevenDaysAgo) {
  const coming = isComingSoon(c);

  // Status filter
  if (statusFilter === "published" && coming) return false;
  if (statusFilter === "coming" && !coming) return false;
  if (statusFilter === "new") {
    if (coming) return false;
    const ad = getAvailableDate(c);
    if (!ad || ad < sevenDaysAgo) return false;
  }

  // Search filter
  if (searchQuery) {
    const lower = searchQuery.toLowerCase();
    const dstr = c.date || (c.availableAt ? c.availableAt.slice(0, 10) : "");
    if (!c.title.toLowerCase().includes(lower) && !(dstr && dstr.includes(lower))) {
      return false;
    }
  }

  // Year filter
  const ystr = getCreationYear(c);
  if (yearFilter && ystr !== yearFilter) return false;

  // Category filter
  const catStr = c.category ? c.category : "Uncategorized";
  if (categoryFilter && catStr !== categoryFilter) return false;

  return true;
}

// Update filter options based on current data
function updateFilterOptions() {
  const filterYear = document.getElementById("filterYear");
  const filterMonth = document.getElementById("filterMonth");

  if (!filterYear || !filterMonth) return;

  const years = [...new Set(creations.map(getCreationYear).filter(Boolean))].sort(
    (a, b) => b.localeCompare(a)
  );

  const allMonths = [...new Set(creations.map(getCreationMonth).filter(Boolean))].sort(
    (a, b) => b.localeCompare(a)
  );

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Month options should reflect all active filters except month itself.
  const months = [
    ...new Set(
      creations
        .filter((c) => matchesFiltersWithoutMonth(c, sevenDaysAgo))
        .map(getCreationMonth)
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  filterYear.innerHTML = '<option value="">Filter by Year</option>';
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    filterYear.appendChild(option);
  });

  if (yearFilter && years.includes(yearFilter)) {
    filterYear.value = yearFilter;
  } else if (yearFilter) {
    yearFilter = "";
    filterYear.value = "";
  }

  filterMonth.innerHTML = '<option value="">Filter by Month</option>';
  months.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = formatMonthLabel(month);
    filterMonth.appendChild(option);
  });

  if (monthFilter && months.includes(monthFilter)) {
    filterMonth.value = monthFilter;
  } else if (monthFilter) {
    monthFilter = "";
    filterMonth.value = "";
  }

  // Update category filter
  const filterCategory = document.getElementById("filterCategory");
  if (filterCategory) {
    const categories = [...new Set(creations.map((c) => c.category || "Uncategorized"))].sort(
      (a, b) => a.localeCompare(b)
    );

    filterCategory.innerHTML = '<option value="">Filter by Category</option>';

    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      filterCategory.appendChild(option);
    });

    if (categoryFilter && categories.includes(categoryFilter)) {
      filterCategory.value = categoryFilter;
    } else if (categoryFilter) {
      categoryFilter = "";
      filterCategory.value = "";
    }
  }
}

// ---------------- Render ----------------
// Helper: parse available date
function getAvailableDate(c) {
  if (c.availableAt) return new Date(c.availableAt);
  if (c.date) return new Date(c.date + "T00:00");
  return null;
}

function isComingSoon(c) {
  const dt = getAvailableDate(c);
  if (!dt) return true; // no date means not yet
  return dt > new Date();
}

function renderList() {
  const list = document.getElementById("creationsList");
  list.innerHTML = "";

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const displayList = creations.filter((c) => {
    // Status filter
    const coming = isComingSoon(c);
    if (statusFilter === "published" && coming) return false;
    if (statusFilter === "coming" && !coming) return false;
    if (statusFilter === "new") {
      if (coming) return false;
      const ad = getAvailableDate(c);
      if (!ad || ad < sevenDaysAgo) return false;
    }

    // Search filter
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      const dstr = c.date || (c.availableAt ? c.availableAt.slice(0, 10) : "");
      if (
        !c.title.toLowerCase().includes(lower) &&
        !(dstr && dstr.includes(lower))
      )
        return false;
    }

    // Year filter
    const ystr = getCreationYear(c);
    if (yearFilter && ystr !== yearFilter) return false;

    // Month filter
    const mstr = getCreationMonth(c);
    if (monthFilter && mstr !== monthFilter) return false;

    // Category filter
    const catStr = c.category ? c.category : "Uncategorized";
    if (categoryFilter && catStr !== categoryFilter) return false;

    return true;
  });

  // Find latest for NEW tag
  let latestDate = creations.reduce((max, c) => {
    const ad = getAvailableDate(c);
    if (!ad) return max;
    const maxAd = getAvailableDate(max);
    return !maxAd || ad > maxAd ? c : max;
  }, creations[0]);

  displayList.forEach((c, i) => {
    const li = document.createElement("li");

    const dstr =
      c.date || (c.availableAt ? c.availableAt.replace("T", " ") : "");
    li.innerHTML = `${i + 1}. ${c.title} <span class="date">${
      dstr || ""
    }</span>`;

    // Category label
    const catLabel = document.createElement("span");
    catLabel.classList.add("category");
    catLabel.textContent = c.category || "Uncategorized";
    li.appendChild(catLabel);

    if (c === latestDate && !isComingSoon(c)) {
      const ad = getAvailableDate(c);
      if (ad && ad >= sevenDaysAgo) {
        li.classList.add("latest");
        const newTag = document.createElement("span");
        newTag.classList.add("new-tag");
        newTag.textContent = "NEW 💖";
        li.appendChild(newTag);
      }
    }

    if (isComingSoon(c)) {
      li.style.opacity = 0.7;

      // Add "Coming Soon" text
      const coming = document.createElement("span");
      coming.classList.add("coming-soon-text");
      coming.textContent = "Coming Soon";
      li.appendChild(coming);

      // Add blinking floating heart
      const heart = document.createElement("span");
      heart.classList.add("coming-soon-heart");
      heart.textContent = "♥";
      li.appendChild(heart);

      li.style.cursor = "pointer"; // clickable to show popup
      li.addEventListener("click", () =>
        showComingSoonPopup(c.title, getAvailableDate(c))
      );
    } else {
      li.style.cursor = "pointer";
      li.addEventListener("click", () => window.open(c.link, "_blank"));
    }

    list.appendChild(li);
  });
}

// ---------------- Status Filter ----------------
document.getElementById("filterStatus").addEventListener("change", function () {
  statusFilter = this.value;
  updateFilterOptions();
  renderList();
});

// ---------------- Search ----------------
document.getElementById("search").addEventListener("input", function () {
  searchQuery = this.value;
  updateFilterOptions();
  renderList();
});

// ---------------- Year & Month Filter ----------------
const filterYear = document.getElementById("filterYear");

filterYear.addEventListener("change", function () {
  yearFilter = this.value;

  if (monthFilter && yearFilter && !monthFilter.startsWith(yearFilter)) {
    monthFilter = "";
  }

  updateFilterOptions();
  renderList();
});

const filterMonth = document.getElementById("filterMonth");

filterMonth.addEventListener("change", function () {
  monthFilter = this.value;

  if (monthFilter) {
    yearFilter = monthFilter.slice(0, 4);
  }

  updateFilterOptions();
  renderList();
});

// ---------------- Category Filter ----------------
const filterCategory = document.getElementById("filterCategory");
if (filterCategory) {
  filterCategory.addEventListener("change", function () {
    categoryFilter = this.value;
    updateFilterOptions();
    renderList();
  });
}

// ---------------- Sorting ----------------
function sortByTitle() {
  filtered.sort((a, b) => a.title.localeCompare(b.title));
  renderList();
}
function sortByDate() {
  filtered.sort((a, b) => {
    const da = getAvailableDate(a) || 0;
    const db = getAvailableDate(b) || 0;
    return da - db;
  });
  if (sortOrder === "asc") {
    sortOrder = "desc";
    filtered.reverse();
  } else {
    sortOrder = "asc";
  }
  renderList();
}

// ---------------- Coming Soon Popup with Countdown ----------------
function formatCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    return "Available now!";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

function showComingSoonPopup(title, dateObj) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 9999;

  const popup = document.createElement("div");
  popup.style.background = "#fff0fa";
  popup.style.border = "2px solid #c93f87";
  popup.style.borderRadius = "16px";
  popup.style.padding = "2rem";
  popup.style.textAlign = "center";
  popup.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
  popup.style.minWidth = "320px";

  const when = dateObj ? dateObj.toLocaleString() : "Very soon";
  const countdownDiv = document.createElement("div");
  countdownDiv.style.fontSize = "1.8rem";
  countdownDiv.style.fontWeight = "700";
  countdownDiv.style.color = "#c93f87";
  countdownDiv.style.margin = "1rem 0";
  countdownDiv.style.fontFamily = "monospace";
  countdownDiv.style.letterSpacing = "0.05em";

  const updateCountdown = () => {
    countdownDiv.textContent = formatCountdown(dateObj);
  };

  updateCountdown();

  popup.innerHTML = `
    <h2 style="margin: 0 0 0.5rem 0; color: #111827;">Coming Soon</h2>
    <p style="margin: 0.5rem 0; color: #667085; font-size: 0.9rem;">"${title}" will be available on:</p>
    <p style="margin: 0.5rem 0 1rem 0; color: #1f2937; font-weight: 600;">${when}</p>
  `;

  popup.appendChild(countdownDiv);

  const description = document.createElement("p");
  description.style.margin = "1rem 0 1.5rem 0";
  description.style.color = "#667085";
  description.style.fontSize = "0.9rem";
  description.textContent = "Countdown until release";
  popup.appendChild(description);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.padding = "0.6rem 1.2rem";
  closeBtn.style.borderRadius = "8px";
  closeBtn.style.border = "none";
  closeBtn.style.background = "#c93f87";
  closeBtn.style.color = "#fff";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "0.9rem";
  closeBtn.style.fontWeight = "600";
  closeBtn.style.transition = "all 0.2s ease";

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.background = "#9f2f6a";
    closeBtn.style.transform = "translateY(-1px)";
  });

  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.background = "#c93f87";
    closeBtn.style.transform = "translateY(0)";
  });

  closeBtn.addEventListener("click", () => overlay.remove());
  popup.appendChild(closeBtn);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Update countdown every second
  const countdownInterval = setInterval(() => {
    updateCountdown();
    if (formatCountdown(dateObj) === "Available now!") {
      clearInterval(countdownInterval);
    }
  }, 1000);

  // Clear interval when overlay is closed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      clearInterval(countdownInterval);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true });
}

// ========== HAMBURGER MENU TOGGLE ==========
const menuToggle = document.getElementById("menuToggle");
const controlsMenu = document.getElementById("controlsMenu");

if (menuToggle && controlsMenu) {
  const syncMenuForViewport = () => {
    if (window.innerWidth <= 768) {
      controlsMenu.classList.add("hidden");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    } else {
      controlsMenu.classList.remove("hidden");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "true");
    }
  };

  menuToggle.addEventListener("click", () => {
    const isHidden = controlsMenu.classList.contains("hidden");

    if (isHidden) {
      controlsMenu.classList.remove("hidden");
      menuToggle.classList.add("active");
      menuToggle.setAttribute("aria-expanded", "true");
    } else {
      controlsMenu.classList.add("hidden");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Close menu when a button is clicked (mobile)
  const buttons = controlsMenu.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        menuToggle.classList.remove("active");
        controlsMenu.classList.add("hidden");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Close menu when a select changes (mobile)
  const selectElements = controlsMenu.querySelectorAll("select");
  selectElements.forEach((elem) => {
    elem.addEventListener("change", () => {
      if (window.innerWidth <= 768) {
        menuToggle.classList.remove("active");
        controlsMenu.classList.add("hidden");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Optional close for search on Enter
  const searchInput = controlsMenu.querySelector("#search");
  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && window.innerWidth <= 768) {
        menuToggle.classList.remove("active");
        controlsMenu.classList.add("hidden");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  syncMenuForViewport();
  window.addEventListener("resize", syncMenuForViewport);
}

// Online/Offline status handlers managed in DOMContentLoaded