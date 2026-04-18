# 🌹 Dreamy Diaries - Enhanced Features

A love diary/portfolio site with **auto-update**, **JSON-based data management**, and **download functionality**.

## ✨ New Features

### 1. **Auto-Update System** 🔄
- **Automatic Update Checks**: The site checks for data updates every 5 minutes
- **Manual Update Button**: Click the "🔄 Update" button to check for updates immediately
- **Version Control**: Data includes version tracking to detect when new content is available
- **Status Display**: Real-time status messages showing:
  - ✅ Success messages (data loaded/updated)
  - ⏳ Loading status
  - ❌ Error alerts
  - 📤 Update available notifications

### 2. **JSON-Based Data System** 📁
- All creations data is stored in `data/creations.json`
- Centralized data management makes it easy to:
  - Add new creations without editing HTML/JS
  - Update existing creations
  - Manage version numbers
- Dynamic loading from JSON file
- Auto-fetches data on page load
- Real-time data refresh capability

### 3. **Download Functionality** 📥
- Click the "📥 Download Data" button to download:
  - All creations in JSON format
  - Current version number
  - Last update timestamp
  - Category list
  - Total count of creations
- File format: `DreamyDiaries_YYYY-MM-DD.json`
- Useful for backup, sharing, or offline access

## 🗂️ Project Structure

```
DreamyDiaries/
├── index.html              # Lock screen (password protected)
├── diary.html              # Main diary page
├── data/
│   └── creations.json      # All creations data (NEW)
├── css/
│   ├── index.css          # Lock screen styles
│   └── diary.css          # Diary page styles
├── js/
│   ├── index.js           # Lock screen functionality
│   └── diary.js           # Diary logic with auto-update
├── assets/
│   └── favicon.png        # Site icon
└── README.md              # This file
```

## 🔧 How to Add New Creations

1. Open `data/creations.json`
2. Add a new object to the `creations` array:

```json
{
  "title": "Your Creation Title",
  "link": "https://link-to-creation.com",
  "date": "2026-04-18",
  "availableAt": "2026-04-18T12:00",
  "category": "Love"
}
```

3. Update the `version` field (e.g., "1.0.0" → "1.0.1")
4. Save the file
5. The changes will auto-load on the next page visit or update check

## 📋 Creation Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | ✅ | Title of the creation |
| `link` | string | ✅ | URL to the creation |
| `date` | string | ✅ | Date in YYYY-MM-DD format |
| `availableAt` | string | ❌ | ISO datetime for future releases (YYYY-MM-DDTHH:mm) |
| `category` | string | ✅ | Category (Personal, Love, Birthday, etc.) |

## 🌐 Features Overview

### Filtering & Search
- Search by title or date
- Filter by status (All, Published, New, Coming Soon)
- Filter by year, month, and category
- Sort by title or date

### Visual Indicators
- **NEW** badge for items published within 7 days
- **Coming Soon** label for future items
- Glowing animation for the latest item
- Opacity change for unpublished items

### Status Messages
- Last update timestamp
- Update availability notifications
- Error handling with user-friendly messages

## 🚀 Auto-Update Technical Details

- **Update Check Interval**: Every 5 minutes
- **Trigger**: Automatic in background + manual button click
- **Version Control**: Compares version numbers in JSON
- **Cache Busting**: Uses timestamp query parameter to prevent browser cache issues
- **Error Recovery**: Falls back to cached version if update fails

## 📥 Download Format

When you download data, you get:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-18T10:30:00Z",
  "creations": [...],
  "totalCount": 29,
  "categories": ["Personal", "Love", "Birthday", ...]
}
```

## 🔐 Security Notes

- Lock screen password uses SHA-256 hashing
- Data is loaded from local JSON file (no external API dependencies)
- All functionality is client-side

## 📱 Responsive Design

- Mobile-friendly layout
- Touch-optimized buttons
- Responsive controls layout
- Tested on various screen sizes

## 💡 Tips & Tricks

1. **Regular Backups**: Download data periodically for backup
2. **Quick Updates**: Update the version number in JSON to trigger all clients
3. **Batch Additions**: Add multiple creations at once, then update version once
4. **Share Data**: Share downloaded JSON file with others who want to see your creations

## 🎨 Customization

To customize:
- Colors: Edit `css/diary.css` (main color: `#d63384`, accent: `#ff4da6`)
- Password: Hash new password with SHA-256 and update in `js/index.js`
- Update interval: Change `5 * 60 * 1000` in `js/diary.js` to different milliseconds
- JSON location: Update fetch path in `loadCreationsData()` function

## 📞 Support

For issues or questions:
- Check the status messages displayed on page
- Open browser console (F12) for detailed logs
- Verify JSON file is valid JSON format
- Ensure all required properties are included in creations

---

**Made with 💖 for Premii**
