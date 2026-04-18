# 📋 DreamyDiaries JSON Reference

## Complete JSON Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-18T00:00:00Z",
  "creations": [
    {
      "title": "string (required)",
      "link": "string (required)",
      "date": "YYYY-MM-DD (required)",
      "availableAt": "YYYY-MM-DDTHH:mm (optional)",
      "category": "string (required)"
    }
  ]
}
```

## Field Descriptions

### Root Level

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `version` | string | ✅ | Semantic version for update detection | `"1.0.0"` |
| `lastUpdated` | ISO 8601 | ✅ | UTC timestamp of last update | `"2026-04-18T12:30:00Z"` |
| `creations` | array | ✅ | Array of creation objects | See below |

### Creation Object

| Field | Type | Required | Purpose | Example |
|-------|------|----------|---------|---------|
| `title` | string | ✅ | Display name | `"Heartfelt Reminders"` |
| `link` | string | ✅ | URL to the creation | `"https://example.com/page"` |
| `date` | YYYY-MM-DD | ✅ | Publication date | `"2025-02-23"` |
| `availableAt` | ISO 8601 | ❌ | Exact datetime (for Coming Soon) | `"2026-05-15T00:00"` |
| `category` | string | ✅ | Classification | `"Love"`, `"Birthday"`, `"Personal"` |

## Usage Examples

### Basic Creation (Published)
```json
{
  "title": "My First Love",
  "link": "https://example.com/love",
  "date": "2025-06-01",
  "category": "Love"
}
```

### Creation with Exact Time
```json
{
  "title": "Special Announcement",
  "link": "https://example.com/special",
  "date": "2026-05-15",
  "availableAt": "2026-05-15T18:30",
  "category": "Birthday"
}
```

### Coming Soon Creation
```json
{
  "title": "Future Surprise",
  "link": "https://example.com/surprise",
  "date": "2026-12-25",
  "availableAt": "2026-12-25T00:00",
  "category": "Holiday"
}
```

## Rules & Constraints

### Version Field
- Must follow Semantic Versioning: `MAJOR.MINOR.PATCH`
- Example progression: `1.0.0` → `1.0.1` → `1.1.0` → `2.0.0`
- Change when:
  - **MAJOR**: Big structural changes
  - **MINOR**: New creations added
  - **PATCH**: Fixed typos or metadata

### Date Fields
- `date`: Use for past/published items
- Format: `YYYY-MM-DD` (ISO 8601)
- Example: `"2026-04-18"`

### AvailableAt Field
- Optional but recommended for future items
- Format: `YYYY-MM-DDTHH:mm` (ISO 8601 without seconds)
- If present and future: item shows as "Coming Soon"
- If present and past: item shows as published
- If omitted: uses `date` field

### Category Field
- Can be any string
- Auto-generates filter options
- Suggested categories:
  - `Personal` - Personal creations
  - `Love` - Love-related
  - `Birthday` - Birthday specials
  - `Anniversary` - Relationship milestones
  - `Holiday` - Holidays/special occasions
  - `Portfolio` - Portfolio pieces
  - `Utility` - Tools/utilities
  - `Counter` - Counter apps
  - `Story` - Stories
  - `Special` - Special projects

### Title Field
- Used in search
- Displayed in list
- Supports emojis: `"Love 💖 Story"`

### Link Field
- Must be valid URL
- Supports external links
- Examples:
  - GitHub Pages: `https://username.github.io/project/`
  - Custom domain: `https://example.com`
  - Google Sites: `https://sites.google.com/view/project`

## Data Entry Checklist

When adding a new creation:

- [ ] Title is clear and descriptive
- [ ] Link is valid URL
- [ ] Date is in YYYY-MM-DD format
- [ ] Date is not in future (unless using availableAt)
- [ ] Category is specified
- [ ] availableAt is in future (if using Coming Soon)
- [ ] Version number is updated (increment)
- [ ] No trailing commas in JSON
- [ ] All required fields present
- [ ] JSON validates at jsonlint.com

## Complete Example File

```json
{
  "version": "1.2.5",
  "lastUpdated": "2026-04-18T10:30:00Z",
  "creations": [
    {
      "title": "Heartfelt Reminders",
      "link": "https://basharulalammazu.github.io/HeartfeltReminders/",
      "date": "2025-02-23",
      "category": "Personal"
    },
    {
      "title": "Premii & Idiot – 3 Months 😘💖",
      "link": "https://mazudiary.github.io/PremiiIdiot-3Months/",
      "date": "2025-09-17",
      "availableAt": "2025-09-17T00:00",
      "category": "Anniversary"
    },
    {
      "title": "Upcoming Surprise 🎉",
      "link": "https://mazudiary.github.io/Surprise/",
      "date": "2026-12-25",
      "availableAt": "2026-12-25T00:00",
      "category": "Holiday"
    }
  ]
}
```

## Validation Tools

### Online Validators
- [JSONLint](https://jsonlint.com/) - Validate JSON syntax
- [JSON Schema Validator](https://www.jsonschemavalidator.net/) - Validate against schema

### Browser Console Test
```javascript
// Paste in browser console (F12) to test
fetch('data/creations.json')
  .then(response => response.json())
  .then(data => {
    console.log('Version:', data.version);
    console.log('Total creations:', data.creations.length);
    console.log('Data:', data);
  })
  .catch(error => console.error('Error:', error));
```

## Common Mistakes to Avoid

❌ **Missing comma after object**
```json
{
  "title": "Item 1",
  ...
}  // ← No comma here!
{
  "title": "Item 2",
  ...
}
```

✅ **Correct format**
```json
[
  {
    "title": "Item 1",
    ...
  },  // ← Comma added
  {
    "title": "Item 2",
    ...
  }
]
```

❌ **Invalid date format**
```json
"date": "4-18-2026"     // Wrong!
"date": "April 18, 2026" // Wrong!
```

✅ **Correct format**
```json
"date": "2026-04-18"
```

❌ **Missing required field**
```json
{
  "title": "My Creation",
  "link": "https://example.com",
  // Missing date and category!
}
```

✅ **Complete object**
```json
{
  "title": "My Creation",
  "link": "https://example.com",
  "date": "2026-04-18",
  "category": "Love"
}
```

## Version Control Strategy

### For Single Addition
```
1.0.0 → 1.0.1 (bug fix)
```

### For New Feature/Items
```
1.0.0 → 1.1.0 (minor change)
```

### For Major Restructure
```
1.0.0 → 2.0.0 (breaking change)
```

## Performance Notes

- Current structure supports 1000+ creations efficiently
- Filters auto-generate from data
- Search works real-time on all items
- Download creates ~2-5KB JSON file per 30 items

## Future Enhancement Ideas

Possible fields to add in future versions:
```json
{
  "title": "...",
  "link": "...",
  "date": "...",
  "category": "...",
  "tags": ["tag1", "tag2"],        // For better search
  "thumbnail": "url-to-image",     // Preview image
  "description": "Short summary",  // Display on hover
  "featured": true/false,          // Pin to top
  "hidden": false                  // Draft/hidden items
}
```

---

**Current Version**: 1.0.0
**Last Updated**: 2026-04-18

For bugs or suggestions, check the main README.
