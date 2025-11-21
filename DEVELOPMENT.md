# Development Guide

## 🏗️ Architecture Overview

### Application Flow

```
User Opens App
    ↓
index.html loads
    ↓
Service Worker registers (PWA support)
    ↓
HLS.js initializes audio stream
    ↓
app.js fetches playlist from SomaFM API
    ↓
UI updates with current track
    ↓
Playlist refreshes every 30 seconds
```

### Key Components

#### 1. Audio Streaming (`app.js` lines 19-29)
- Uses **HLS.js** for HTTP Live Streaming
- Fallback to native HLS for Safari/iOS
- Stream URL: `https://hls.somafm.com/hls/gs-unprocessed/320k/program.m3u8`

```javascript
if (Hls.isSupported()) {
    // Desktop/Android - use HLS.js
} else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS/Safari - native support
}
```

#### 2. Playlist Management (`app.js` lines 74-148)
- Fetches XML from SomaFM API
- Parses with DOMParser
- Updates every 30 seconds
- Shows current track + 10 recent tracks

**API Endpoint**: `https://somafm.com/songs/groovesalad.xml`

**XML Structure**:
```xml
<songs>
  <song>
    <title>Track Name</title>
    <artist>Artist Name</artist>
    <album>Album Name</album>
  </song>
  ...
</songs>
```

#### 3. Service Worker (`service-worker.js`)
- **Cache Strategy**: Cache-first with network fallback
- **Cache Name**: `somafm-player-cache-v2`
- **Cached Assets**: HTML, CSS, JS, manifest, icons

**Update Process**:
1. Change `CACHE_NAME` version (v2 → v3)
2. Old caches auto-deleted on activation
3. Hard refresh browser to see changes

#### 4. PWA Manifest (`manifest.json`)
- Defines app metadata for installation
- Icons for home screen
- Display mode: standalone (fullscreen)
- Theme colors for iOS status bar

### File Responsibilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| `index.html` | Structure & layout | Audio element, player UI, navigation |
| `app.js` | Logic & interactivity | Play/pause, mute, playlist fetch |
| `style.css` | Styling & responsive | Dark theme, landscape layout |
| `service-worker.js` | Offline support | Caching, network fallback |
| `manifest.json` | PWA metadata | Installation, icons, theme |

## 🎨 Styling System

### CSS Variables (`style.css` lines 1-8)
```css
--primary-text: #FFFFFF      /* Main text color */
--secondary-text: #BDBDBD    /* Dimmed text */
--accent-color: #00BCD4      /* Cyan highlights */
--divider-color: #424242     /* Borders */
--background-color: #212121  /* Main background */
--background-light: #121212  /* Darker background */
```

### Responsive Breakpoints

**Portrait Mode** (default):
- Max width: 414px (iPhone size)
- Vertical layout: Player → Playlist → Footer

**Landscape Mode** (`@media` at line 217):
- Min width: 768px + aspect ratio 4:3
- Horizontal layout: Player (45%) | Playlist (55%)
- Optimized for iPad Mini (1024x768)

### Safe Areas (iOS)
```css
padding-top: env(safe-area-inset-top);     /* Notch */
padding-bottom: env(safe-area-inset-bottom); /* Home indicator */
```

## 🔧 Development Workflow

### 1. Local Development Setup

```bash
# Navigate to project
cd /Users/danny/PROJEKTY/ipad_soma_player

# Start local server (choose one)
python3 -m http.server 8000
# OR
npx http-server -p 8000
```

### 2. Testing Changes

**Desktop Browser**:
1. Open `http://localhost:8000`
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Select iPad Mini or custom dimensions

**iPad Testing**:
1. Get computer's IP: `ifconfig | grep "inet "`
2. On iPad Safari: `http://YOUR_IP:8000`
3. Add to Home Screen for PWA testing

### 3. Service Worker Development

**Debugging**:
- Chrome: DevTools → Application → Service Workers
- Safari: Develop → Service Workers

**Force Update**:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
});
location.reload();
```

**Testing Offline**:
1. Load app online first
2. DevTools → Network → Offline checkbox
3. Reload page (should work from cache)

### 4. Making Changes

#### Adding a New Station

**Step 1**: Update HTML stream URL
```html
<!-- index.html line 60 -->
<source src="https://hls.somafm.com/hls/NEW-STATION/320k/program.m3u8">
```

**Step 2**: Update JS playlist URL
```javascript
// app.js line 75
const playlistUrl = 'https://somafm.com/songs/NEW-STATION.xml';
```

**Step 3**: Update header title
```html
<!-- index.html line 18 -->
<h1 class="station-title">New Station Name</h1>
```

#### Changing Theme Colors

Edit CSS variables in `style.css`:
```css
:root {
    --accent-color: #FF5722; /* Change to orange */
}
```

#### Modifying Playlist Refresh Rate

```javascript
// app.js line 152
setInterval(fetchPlaylist, 60000); // Change to 60 seconds
```

## 🐛 Common Issues & Solutions

### Issue: Audio Won't Play on iOS

**Cause**: iOS requires user interaction before audio playback

**Solution**: Already implemented - play button triggers `audio.play()`

### Issue: Playlist Shows "Loading..."

**Causes**:
1. CORS blocking request
2. SomaFM API down
3. Network error

**Debug**:
```javascript
// Check console for errors
// app.js lines 142-147 has error handling
```

**Solution**: 
- Check network tab in DevTools
- Verify XML URL is accessible
- Check CORS headers

### Issue: Service Worker Not Updating

**Cause**: Browser caching old service worker

**Solution**:
1. Increment cache version in `service-worker.js` line 1
2. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Or unregister in DevTools

### Issue: Icons Not Showing

**Cause**: Feather icons not loaded or not replaced

**Solution**:
```javascript
// app.js line 3 - ensure this runs
feather.replace();

// Call after DOM changes
feather.replace();
```

## 📦 Dependencies

### External Libraries (CDN)

1. **HLS.js** - v1.x (latest)
   - Purpose: HTTP Live Streaming support
   - CDN: `https://cdn.jsdelivr.net/npm/hls.js@latest`
   - Docs: https://github.com/video-dev/hls.js/

2. **Feather Icons** - v4.x
   - Purpose: SVG icon library
   - CDN: `https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js`
   - Docs: https://feathericons.com/

### No Build Process Required
- Pure vanilla JavaScript
- No npm dependencies
- No bundler needed
- Direct browser execution

## 🚀 Deployment

### GitHub Pages
```bash
# Push to GitHub
git add .
git commit -m "Update app"
git push origin main

# Enable GitHub Pages in repo settings
# Source: main branch, / (root)
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

### Manual Hosting
1. Upload all files to web server
2. Ensure HTTPS (required for PWA)
3. Configure server to serve `index.html` for root

## 🧪 Testing Checklist

### Functionality
- [ ] Audio plays/stops correctly
- [ ] Mute/unmute works
- [ ] Playlist loads and updates
- [ ] Current track displays
- [ ] Icons render properly

### PWA
- [ ] Service worker registers
- [ ] App works offline (after first load)
- [ ] "Add to Home Screen" prompt appears
- [ ] Standalone mode works (no browser UI)
- [ ] Icons show on home screen

### Responsive
- [ ] Portrait mode (phone)
- [ ] Landscape mode (tablet)
- [ ] Desktop browser
- [ ] iPad Mini specifically
- [ ] Safe areas respected (notch/home indicator)

### Cross-browser
- [ ] Chrome/Edge (desktop)
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox

## 📊 Performance Considerations

### Current Performance
- **Initial Load**: ~50KB (HTML + CSS + JS)
- **HLS.js**: ~200KB (CDN)
- **Feather Icons**: ~20KB (CDN)
- **Total**: ~270KB

### Optimization Opportunities
1. **Self-host libraries**: Reduce CDN dependency
2. **Minify code**: Reduce file sizes
3. **Lazy load playlist**: Only fetch when visible
4. **Image optimization**: Compress icons
5. **Code splitting**: Separate service worker logic

### Caching Strategy
- **Static assets**: Cached indefinitely (service worker)
- **Playlist API**: No cache (always fresh)
- **Audio stream**: Not cached (live stream)

## 🔐 Security Notes

### HTTPS Required
- PWA features require HTTPS
- Service workers require secure context
- Use `localhost` for development (exempt from HTTPS)

### CORS
- SomaFM API supports CORS
- No authentication required
- Public API endpoints

### Content Security Policy
Consider adding CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               connect-src https://somafm.com https://hls.somafm.com;">
```

## 📚 Additional Resources

- **SomaFM API**: https://somafm.com/
- **HLS Streaming**: https://developer.apple.com/streaming/
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## 🎯 Next Steps for Development

1. **Implement station switcher** (most requested feature)
2. **Add volume slider** (better than just mute)
3. **Create settings panel** (currently just UI)
4. **Add favorites system** (localStorage)
5. **Improve error handling** (user-friendly messages)
6. **Add loading states** (skeleton screens)
7. **Implement media session API** (iOS notifications)
8. **Add unit tests** (Jest or Vitest)
9. **Set up CI/CD** (GitHub Actions)
10. **Create build process** (optional - Vite or Parcel)
