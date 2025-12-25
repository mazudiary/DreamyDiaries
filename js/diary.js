// Each creation can have:
// - date: YYYY-MM-DD (legacy)
// - availableAt: ISO datetime (YYYY-MM-DDTHH:mm) for precise availability
// If availableAt is in the future, it is Coming Soon; else it's Published.
const creations = [
  {
    title: "Heartfelt Reminders",
    link: "https://basharulalammazu.github.io/HeartfeltReminders/",
    date: "2025-02-23",
  },
  {
    title: "How is she?",
    link: "https://mazudiary.github.io/HowSheIs/",
    date: "2025-03-24",
  },
  {
    title: "Life Galary",
    link: "https://sites.google.com/view/basharullifegallery",
    date: "2025-03-30",
  },
  {
    title: "ElaraValorFlower2025",
    link: "https://mazudiary.github.io/ElaraValorFlower2025/",
    date: "2025-05-15",
  },
  {
    title: "The Finest Soul",
    link: "https://mazudiary.github.io/TheFinestSoul/",
    date: "2025-05-17",
  },
  {
    title: "Bio Data",
    link: "https://farzinahossainlopa.github.io/biodata/",
    date: "2025-04-04",
  },
  {
    title: "Valobashiii Valobashaa😘💖",
    link: "https://mazudiary.github.io/ValobashiiiValobasha/",
    date: "2025-06-01",
  },
  {
    title: "Dream Valobashaa😘💖",
    link: "https://mazudiary.github.io/DreamValobasha/",
    date: "2025-06-03",
  },
  {
    title: "Eid Mubarak -Financial Harmony",
    link: "https://mazudiary.github.io/EidMubarak-FinancialHarmony/",
    date: "2025-06-06",
  },
  {
    title: "Elara Valor Tribute 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-2Months/",
    date: "2025-06-08",
  },
  {
    title: "Elara Valor BD 2025",
    link: "https://mazudiary.github.io/ElaraValorBD2025/",
    date: "2025-06-15",
  },
  {
    title: "Private Love Garden 😘💖",
    link: "https://mazudiary.github.io/privatelovegarden/",
    date: "2025-06-17",
  },
  {
    title: "Primary Key 😘💖",
    link: "https://mazudiary.github.io/privatelovegarden/",
    date: "2025-06-17",
  },
  {
    title: "Forever Always Counter😘💖",
    link: "https://mazudiary.github.io/primarykey/",
    date: "2025-07-18",
  },
  {
    title: "Love Reply",
    link: "https://mazudiary.github.io/ForeverAlwaysCounter/",
    date: "2025-07-31",
  },
  {
    title: "Premii & Idiot – 2 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-2Months/",
    date: "2025-08-17",
  },
  {
    title: "Premii & Idiot – 3 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-3Months/",
    date: "2025-09-17",
    availableAt: "2025-09-17T00:00",
  },
  {
    title: "Tashbih Counter",
    link: "https://mazudiary.github.io/tashbihcounter/",
    date: "2025-09-22",
    availableAt: "2025-09-22T00:00",
  },
  {
    title: "Premii & Idiot – 4 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-4Months/",
    date: "2025-10-17",
    availableAt: "2025-10-17T00:47",
  },
  {
    title: "Premii & Idiot – 5 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-5Months/",
    date: "2025-11-17",
    availableAt: "2025-11-17T00:47",
  },
  {
    title: "Thanks Giving 2025",
    link: "https://mazudiary.github.io/ThanksGiving2025/",
    date: "2025-11-27",
    availableAt: "2025-11-27T00:00",
  },
  {
    title: "Premii & Idiot – 6 Months 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-6Months/",
    date: "2025-12-17",
    availableAt: "2025-12-17T00:47",
  },
  {
    title: "Premii & Idiot – 6 Months(Special) 😘💖",
    link: "https://mazudiary.github.io/PremiiIdiot-6Months-Special/",
    date: "2025-12-17",
    availableAt: "2025-12-17T00:47",
  },
  
  {
    title: "Happy New Year 2027",
    link: "https://mazudiary.github.io/HappyNewYear2026/",
    date: "2026-01-01",
    availableAt: "2026-01-01T00:00",
  },
  {
    title: "Premii Birthday's 2026",
    link: "https://mazudiary.github.io/PremiiBD2026/",
    date: "2026-05-15",
    availableAt: "2026-05-15T00:00",
  },
  
];

let filtered = [...creations];
let statusFilter = "all";
let sortOrder = "asc";
let searchQuery = "";
let yearFilter = "";
let monthFilter = "";

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
    const ystr = c.date
      ? c.date.slice(0, 4)
      : c.availableAt
      ? c.availableAt.slice(0, 4)
      : "";
    if (yearFilter && ystr && ystr !== yearFilter) return false;

    // Month filter
    const mstr = c.date
      ? c.date.slice(0, 7)
      : c.availableAt
      ? c.availableAt.slice(0, 7)
      : "";
    if (monthFilter && mstr && mstr !== monthFilter) return false;

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
      coming.textContent = "Coming Soon 💖";
      coming.style.marginLeft = "10px";
      coming.style.color = "#ff4da6";
      coming.style.fontWeight = "bold";
      li.appendChild(coming);

      // Add blinking floating heart
      const heart = document.createElement("span");
      heart.textContent = "💖";
      heart.style.marginLeft = "5px";
      heart.style.animation =
        "blinkHeart 1.2s infinite, floatHeart 3s ease-in-out infinite";
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
  renderList();
});

// ---------------- Search ----------------
document.getElementById("search").addEventListener("input", function () {
  searchQuery = this.value;
  renderList();
});

// ---------------- Year & Month Filter ----------------
const filterYear = document.getElementById("filterYear");
const years = [
  ...new Set(
    creations
      .map((c) => c.date)
      .filter((d) => d)
      .map((d) => d.slice(0, 4))
  ),
];
years.forEach((y) => {
  const option = document.createElement("option");
  option.value = y;
  option.textContent = y;
  filterYear.appendChild(option);
});
filterYear.addEventListener("change", function () {
  yearFilter = this.value;
  renderList();
});

const filterMonth = document.getElementById("filterMonth");
const months = [
  ...new Set(
    creations
      .map((c) => c.date)
      .filter((d) => d)
      .map((d) => d.slice(0, 7))
  ),
];
months.forEach((m) => {
  const option = document.createElement("option");
  option.value = m;
  option.textContent = m;
  filterMonth.appendChild(option);
});
filterMonth.addEventListener("change", function () {
  monthFilter = this.value;
  renderList();
});

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

// ---------------- Coming Soon Popup ----------------
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
  popup.style.border = "2px solid #ff4da6";
  popup.style.borderRadius = "16px";
  popup.style.padding = "2rem";
  popup.style.textAlign = "center";
  const dstr = coming
    ? ""
    : c.date || (c.availableAt ? c.availableAt.replace("T", " ") : "");
  popup.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

  const when = dateObj ? dateObj.toLocaleString() : "Very soon";
  popup.innerHTML = `
    <h2>💖 Coming Soon 💖</h2>
    <p>"${title}" will be available on:<br><strong>${when}</strong></p>
    <p>Stay tuned for more love and surprises 😘💖</p>
    <button style="padding:0.5rem 1rem;border-radius:8px;border:none;background:#d63384;color:#fff;cursor:pointer;font-size:1rem;">Close</button>
  `;
  popup
    .querySelector("button")
    .addEventListener("click", () => overlay.remove());
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// ---------------- Initial render ----------------
renderList();







