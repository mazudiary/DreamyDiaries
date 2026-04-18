# 🚀 DreamyDiaries - Setup & Deployment Guide

## ✅ Quick Start

1. **Files are already in place**:
   - ✅ `data/creations.json` - Contains all creations data
   - ✅ `js/diary.js` - Updated with auto-update & download features
   - ✅ `diary.html` - Enhanced with new buttons
   - ✅ CSS updated for status display

2. **Test Locally**:
   - Open `diary.html` in a web server (not file://)
   - If opening locally, you may need a local server due to CORS
   - Use: `python -m http.server 8000` or Node.js `http-server`

3. **Deploy to GitHub Pages**:
   - Push all files to your GitHub repository
   - Enable GitHub Pages in repository settings
   - The `data/` folder will be served automatically

## 📂 File Structure After Setup

```
your-repo/
├── index.html
├── diary.html
├── FEATURES.md           ← New documentation
├── SETUP.md              ← This file
├── README.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── data/
│   └── creations.json    ← Your data (NEW)
├── css/
│   ├── index.css
│   └── diary.css
├── js/
│   ├── index.js
│   └── diary.js          ← Updated with new features
└── assets/
    └── favicon.png
```

## 🔧 Configuration

### Auto-Update Interval
Edit `js/diary.js` line with `setInterval`:
```javascript
setInterval(checkForUpdates, 5 * 60 * 1000);  // 5 minutes
```
Change `5 * 60 * 1000` to desired milliseconds:
- 1 minute: `1 * 60 * 1000`
- 10 minutes: `10 * 60 * 1000`
- 1 hour: `60 * 60 * 1000`

### JSON File Location
If you move `creations.json`, update the path in `js/diary.js`:
```javascript
const response = await fetch("data/creations.json?cache=" + Date.now());
// Change "data/creations.json" to your new path
```

## ➕ Adding New Creations

### Method 1: Edit JSON Directly
1. Open `data/creations.json`
2. Add to the `creations` array:
```json
{
  "title": "My New Creation",
  "link": "https://example.com",
  "date": "2026-04-18",
  "category": "Love"
}
```
3. Update version: `"version": "1.0.1"`
4. Save and commit

### Method 2: Batch Updates
Add multiple items, then update version once:
```json
{
  "version": "1.1.0",
  "lastUpdated": "2026-04-18T00:00:00Z",
  "creations": [
    // ... existing items ...
    {
      "title": "New Item 1",
      "link": "https://example.com/1",
      "date": "2026-04-18",
      "category": "Love"
    },
    {
      "title": "New Item 2",
      "link": "https://example.com/2",
      "date": "2026-04-19",
      "category": "Birthday"
    }
  ]
}
```

## 🎯 Features at a Glance

### Download Button (📥)
- Users can download all data as JSON
- Includes version, timestamp, categories
- File named: `DreamyDiaries_YYYY-MM-DD.json`

### Update Button (🔄)
- Manual update check
- Shows status: checking → found/up to date
- Displays version number

### Auto-Update
- Runs every 5 minutes in background
- No user interaction needed
- Status displayed automatically

### Status Display
- Real-time update information
- Color-coded messages:
  - Green (✅): Success
  - Yellow (📤): Updates available
  - Red (❌): Error

## 🧪 Testing

### Test Auto-Update
1. Open `diary.html`
2. Note the displayed version
3. Edit `data/creations.json`:
   - Change version (e.g., "1.0.0" → "1.0.1")
   - Add a new creation
4. Save and refresh browser
5. Wait 5 minutes or click "🔄 Update"
6. New data should load automatically

### Test Download
1. Click "📥 Download Data"
2. Check downloaded JSON file
3. Verify it contains:
   - All creations
   - Current version
   - Timestamp
   - Categories list

### Test Locally
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using Python 2
python -m SimpleHTTPServer 8000
```
Then visit: `http://localhost:8000/diary.html`

## 🐛 Troubleshooting

### Data Not Loading
**Problem**: Page shows "Error loading data"
**Solution**:
- Check if `data/creations.json` exists
- Verify JSON syntax (use jsonlint.com)
- Check browser console for errors (F12)
- Ensure you're using a web server, not file://

### Updates Not Checking
**Problem**: Status doesn't update automatically
**Solution**:
- Refresh the page
- Check browser console for errors
- Verify JSON file is valid
- Click "🔄 Update" button manually

### Download Not Working
**Problem**: Download button doesn't work
**Solution**:
- Check browser console
- Verify you have data loaded (status should be green)
- Try in a different browser
- Check if pop-ups are blocked

### CORS Errors
**Problem**: "Failed to fetch" error
**Solution**:
- Use a web server instead of file://
- Don't open HTML file directly
- For local testing: `python -m http.server 8000`

## 📊 JSON Validation

Ensure your `creations.json` is valid:

```javascript
// Test in browser console
fetch('data/creations.json')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error(e))
```

## 🌐 Deployment Checklist

- [ ] All files committed to git
- [ ] `data/creations.json` is valid JSON
- [ ] `data/` folder is included in repository
- [ ] GitHub Pages enabled in repository settings
- [ ] Test accessing site at: `https://username.github.io/repo/diary.html`
- [ ] Try downloading data
- [ ] Click update button and verify status message

## 📱 Mobile Compatibility

The site is fully responsive:
- Test on mobile devices
- Touch buttons work properly
- Download works on mobile
- Status messages display correctly

## 🔐 Security Notes

- No external dependencies (offline capable)
- SHA-256 password hashing for lock screen
- All operations are client-side
- JSON data is public (no sensitive info)

## 💡 Pro Tips

1. **Backup**: Download and save JSON files periodically
2. **Batch Updates**: Update version once for multiple changes
3. **Categories**: Add new categories as needed (auto-generates filters)
4. **Timestamps**: Use `availableAt` for future "Coming Soon" items
5. **Search**: Users can search by title or date

## 📞 Need Help?

Check:
1. Browser console (F12) for error messages
2. `FEATURES.md` for feature documentation
3. `README.md` for project overview
4. JSON syntax at jsonlint.com

---

**Successfully set up! Now you can:**
- ✅ Share the diary with auto-updating data
- ✅ Add new creations anytime
- ✅ Let users download the data
- ✅ Updates sync automatically every 5 minutes

**Made with 💖**
