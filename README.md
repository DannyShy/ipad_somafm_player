# SomaFM Player for iPad

A Progressive Web App (PWA) for streaming SomaFM radio stations, optimized for iPad Mini and mobile devices.

## 🎵 Current Features

### Core Functionality
- **Live Audio Streaming**: Plays SomaFM Groove Salad Classic station via HLS streaming
- **Real-time Playlist**: Displays currently playing track and recent song history (last 10 tracks)
- **Play/Stop Controls**: Simple playback controls with visual feedback
- **Mute/Unmute**: Volume control with mute toggle
- **Auto-refresh**: Playlist updates every 30 seconds automatically

### PWA Features
- **Offline Support**: Service Worker caching for offline functionality
- **Install to Home Screen**: Works as a standalone app on iOS/iPad
- **Responsive Design**: Optimized for both portrait and landscape modes
- **iPad Mini Optimized**: Special landscape layout (1024x768)

### UI/UX
- **Dark Theme**: Modern dark interface with cyan accents
- **iOS-style Design**: Native iOS look and feel
- **Safe Area Support**: Handles notches and home indicators
- **Feather Icons**: Clean, modern iconography
- **Bottom Navigation**: Home, Stations, Settings tabs (UI only)

## 🚀 Quick Start

### Running Locally

Since this is a static web app, you need a local web server. Choose one of these methods:

#### Option 1: Python (Recommended - Built-in)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

#### Option 2: Node.js http-server
```bash
# Install globally (one time)
npm install -g http-server

# Run server
http-server -p 8000
```

#### Option 3: PHP
```bash
php -S localhost:8000
```

#### Option 4: VS Code Live Server Extension
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Testing on iPad

1. Run local server on your computer
2. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```
3. On iPad, open Safari and navigate to: `http://YOUR_IP:8000`
4. Tap Share → Add to Home Screen

## 📁 Project Structure

```
ipad_soma_player/
├── index.html          # Main HTML structure
├── app.js              # Application logic and player controls
├── style.css           # Styling and responsive design
├── manifest.json       # PWA manifest for installation
├── service-worker.js   # Service worker for offline support
├── sw.js               # Alternative service worker (duplicate)
└── icons/              # App icons for PWA
    ├── icon-192x192.png
    ├── icon-512x512.png
    └── apple-touch-icon.png
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Audio**: HLS.js for HTTP Live Streaming
- **Icons**: Feather Icons
- **PWA**: Service Worker API, Web App Manifest
- **API**: SomaFM XML playlist API

## 🎯 Potential New Features to Add

### High Priority
1. **Multiple Station Support**: Switch between different SomaFM stations
2. **Station Browser**: Grid/list view of all available stations with images
3. **Favorites**: Save favorite stations for quick access
4. **Volume Slider**: Granular volume control (not just mute/unmute)
5. **Sleep Timer**: Auto-stop playback after set duration

### Medium Priority
6. **Now Playing Notifications**: iOS media notifications with controls
7. **Station Search**: Search stations by name or genre
8. **Theme Switcher**: Light/dark mode toggle
9. **Equalizer**: Basic audio EQ controls
10. **Share Track**: Share currently playing song on social media
11. **Track History**: View full listening history
12. **Settings Panel**: Functional settings page (audio quality, cache, etc.)

### Low Priority
13. **Lyrics Display**: Show lyrics for current track (if available)
14. **Album Art**: Display album covers when available
15. **Crossfade**: Smooth transitions between tracks
16. **Chromecast Support**: Cast to external devices
17. **Keyboard Shortcuts**: Desktop keyboard controls
18. **Analytics**: Track listening habits and stats

### Technical Improvements
19. **Error Handling**: Better error messages and recovery
20. **Loading States**: Skeleton screens and better loading indicators
21. **Offline Playlist**: Cache recent tracks for offline viewing
22. **Performance**: Optimize bundle size and loading time
23. **Accessibility**: ARIA labels, keyboard navigation
24. **Testing**: Unit tests and E2E tests

## 🔧 Configuration

### Changing Station
Edit the stream URL in `index.html`:
```html
<source src="https://hls.somafm.com/hls/STATION-NAME/320k/program.m3u8" type="application/x-mpegURL">
```

And playlist URL in `app.js`:
```javascript
const playlistUrl = 'https://somafm.com/songs/STATION-NAME.xml';
```

### Available SomaFM Stations
- `groovesalad` - Groove Salad Classic (current)
- `defcon` - DEF CON Radio
- `dronezone` - Drone Zone
- `lush` - Lush
- `secretagent` - Secret Agent
- And many more at https://somafm.com/

## 📝 Important Notes

### Service Worker Cache
- Cache version is set in `service-worker.js` as `CACHE_NAME`
- Increment version (v2, v3, etc.) when deploying updates
- Old caches are automatically cleaned up

### CORS Issues
- SomaFM API supports CORS, but some browsers may block it
- If playlist doesn't load, check browser console for CORS errors
- Running on `localhost` or `127.0.0.1` usually works fine

### iOS Limitations
- Audio autoplay is blocked by iOS (requires user interaction)
- Background audio requires proper media session API implementation
- PWA must be added to home screen for full standalone experience

## 🐛 Troubleshooting

### Audio Won't Play
- Check if HLS.js loaded correctly (browser console)
- Verify stream URL is accessible
- iOS requires user interaction before playing audio

### Playlist Not Loading
- Check network connection
- Verify CORS is not blocking the request
- SomaFM API might be temporarily down

### Service Worker Issues
- Clear browser cache and reload
- Unregister old service workers in DevTools
- Check service worker console for errors

## 📄 License

This is a personal project for educational purposes. SomaFM content and streams are property of SomaFM.com.

## 🔗 Resources

- [SomaFM Official Site](https://somafm.com/)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
