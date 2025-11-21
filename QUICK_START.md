# Quick Start Guide

## 🚀 Run Locally in 30 Seconds

### Option 1: Python (Easiest - No Installation)
```bash
cd /Users/danny/PROJEKTY/ipad_soma_player
python3 -m http.server 8000
```
**Open**: http://localhost:8000

### Option 2: Node.js
```bash
cd /Users/danny/PROJEKTY/ipad_soma_player
npx http-server -p 8000
```
**Open**: http://localhost:8000

### Option 3: PHP
```bash
cd /Users/danny/PROJEKTY/ipad_soma_player
php -S localhost:8000
```
**Open**: http://localhost:8000

---

## 📱 Test on iPad

1. **Start server** (use any option above)
2. **Find your IP**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
3. **On iPad Safari**: Open `http://YOUR_IP:8000`
4. **Install**: Tap Share → Add to Home Screen

---

## 🎵 What This App Does

- ✅ Plays SomaFM Groove Salad Classic radio
- ✅ Shows current track and recent playlist
- ✅ Play/Stop and Mute controls
- ✅ Works offline after first load (PWA)
- ✅ Optimized for iPad Mini landscape mode

---

## 🛠️ Quick Edits

### Change Station
**File**: `index.html` (line 60)
```html
<source src="https://hls.somafm.com/hls/STATION-NAME/320k/program.m3u8">
```

**File**: `app.js` (line 75)
```javascript
const playlistUrl = 'https://somafm.com/songs/STATION-NAME.xml';
```

### Change Colors
**File**: `style.css` (lines 1-8)
```css
--accent-color: #00BCD4; /* Change this */
```

### Update Service Worker Cache
**File**: `service-worker.js` (line 1)
```javascript
const CACHE_NAME = 'somafm-player-cache-v3'; // Increment version
```

---

## 📁 Project Files

```
├── index.html          # Main page
├── app.js              # Player logic
├── style.css           # Styling
├── service-worker.js   # PWA offline support
├── manifest.json       # PWA metadata
└── icons/              # App icons
```

---

## 🐛 Troubleshooting

### Audio won't play?
- Click the play button (iOS requires user interaction)
- Check browser console for errors

### Playlist not loading?
- Check internet connection
- Open browser console and look for CORS errors

### Changes not showing?
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Increment service worker cache version

---

## 📚 More Info

- **Full documentation**: See `README.md`
- **Development guide**: See `DEVELOPMENT.md`
- **SomaFM stations**: https://somafm.com/
