# 💖 Dreamy Diaries

[![Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/) [![License](https://img.shields.io/badge/license-Personal-orange)](LICENSE) [![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Professional-blue)](CODE_OF_CONDUCT.md)

**A personal, web-based diary app for storing and sharing love creations, memories, and special moments.**

Dreamy Diaries is designed for **Premii**, offering a secure, interactive, and visually romantic experience. Features include password protection, search, filtering, sorting, inline comments, and animated effects.

---

## 📖 Table of Contents

* [Overview](#overview)
* [✨ Features](#-features)
* [📂 File Structure](#-file-structure)
* [🚀 Usage](#-usage)
* [🎨 Customization](#-customization)
* [📜 Code of Conduct](#-code-of-conduct)
* [📝 License](#-license)
* [💝 Credits](#-credits)

---

## Overview

Dreamy Diaries allows you to **capture, organize, and revisit cherished memories** in a safe, personal, and visually engaging space.
The project emphasizes **privacy, personalization, and romance**, with interactive features like floating hearts, glowing UI elements, and smooth animated transitions.

---

## ✨ Features

* 🔒 **Lock Screen**: Secure access with password and hint.
* 📜 **Diary List**: Browse all creations with title, date, and direct links.
* 🔍 **Search**: Quickly find entries by title or date.
* 🗂️ **Filter**: Filter entries by year, month, and status (All, Published, New, Coming Soon).
* 📊 **Sort**: Sort entries by title or date.
* 💫 **Visual Effects**: Floating hearts, glowing UI, and animated transitions.
* 🌟 **Custom Favicon**: Displayed on all pages, including during transitions.

---

## 🆕 NEW FEATURES (v1.0.0)

### 📥 Download Data
- Export all creations as JSON with version, timestamp, and categories
- One-click backup for peace of mind
- Share data with others easily

### 🔄 Auto-Update System
- Automatic update checks every 5 minutes
- Manual update button for instant checks
- Version-based detection - only loads when data changes
- Real-time status display with color-coded messages

### 📁 JSON-Based Data Management
- Centralized data in `data/creations.json`
- Easy to add new creations without code changes
- Dynamic filtering and sorting from JSON
- Production-ready with semantic versioning

**👉 [Read the QUICKSTART.md for detailed guides!](QUICKSTART.md)**

---

## 📂 File Structure

```
index.html              — Lock screen for password entry
diary.html              — Diary list with controls and filters
data/
  └── creations.json    — Centralized creations data (NEW)
css/
  ├── index.css         — Lock screen styles
  └── diary.css         — Diary page styles
js/
  ├── index.js          — Lock screen logic
  └── diary.js          — Diary logic with auto-update (UPDATED)
assets/
  └── favicon.png       — Site icon
CODE_OF_CONDUCT.md      — Professional Code of Conduct
LICENSE                 — Strict Personal-Use License
README.md               — This file
QUICKSTART.md           — Quick start guide for new features
FEATURES.md             — Detailed feature documentation
SETUP.md                — Setup & deployment guide
JSON_SCHEMA.md          — JSON data structure reference
IMPLEMENTATION.md       — Technical implementation details
VERIFICATION.md         — Implementation verification checklist
```

---

## 📚 Documentation Guide

| Document | Purpose | For Whom |
|----------|---------|----------|
| **QUICKSTART.md** | Get started in 5 minutes | Everyone |
| **FEATURES.md** | Detailed feature explanations | Users |
| **SETUP.md** | Deployment & configuration | Developers |
| **JSON_SCHEMA.md** | Data structure reference | Developers |
| **IMPLEMENTATION.md** | Technical implementation details | Developers |
| **VERIFICATION.md** | Implementation checklist | Project leads |

👉 **Start with [QUICKSTART.md](QUICKSTART.md) to learn the new features!**

---

## 🚀 Usage

1. Open `index.html` in your browser.
2. Enter the password (hint: "What I like to call you").
3. Access your diary and creations after login.
4. Use **search, filter, and sort** to locate entries efficiently.
5. Click any entry to **add personal comments**.

---

## 🎨 Customization

* 🔑 **Password**: Update in `index.html` (update hash if needed).
* ✍️ **Add Entries**: Add new diary creations in `js/diary.js`.
* 🎨 **Styling**: Customize with `diary.css` or inline styles.

---

## 📜 Code of Conduct

This project follows a **professional Code of Conduct** to ensure a **safe, respectful, and loving environment**.
Please see [CODE\_OF\_CONDUCT.md](CODE_OF_CONDUCT.md) for the complete guidelines.

---

## 📝 License

This project is **strictly personal-use only**, exclusively for Premii.
Please see [LICENSE](LICENSE) for full legal details.

---

## 💝 Credits

Created with **love and care for Premii** 💖

