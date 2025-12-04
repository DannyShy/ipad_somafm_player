# Performance Testing Guide

## 🧪 How to Test the Performance Improvements

### 1. Basic Setup
```bash
# Start the local server
cd /Users/danny/PROJEKTY/ipad_soma_player
python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

### 2. Console Monitoring
Open browser DevTools (F12) and monitor the Console tab. You should see:

#### Initialization Logs
- `HLS manifest parsed successfully`
- `Health check:` (every 60 seconds)
- `Memory management check:` (every 5 minutes)

#### Performance Logs
- `Buffer appended:` (when HLS segments load)
- `Buffered: XX%` (when buffer progress changes)
- Network connection information

### 3. Long-Duration Test (1-3+ hours)

#### What to Watch For:
1. **No Playback Interruptions**: Stream should continue playing without stopping
2. **Memory Stability**: Browser memory usage should remain stable
3. **Buffer Management**: Console should show buffer cleanup every 5 minutes
4. **Automatic Recovery**: If network issues occur, you should see recovery attempts

#### Expected Recovery Behavior:
- `Network error, attempting recovery...`
- `Media error, attempting recovery...`
- `Stream appears stalled, attempting recovery`
- `Recovery nudge failed, reloading stream`

### 4. Stress Testing Scenarios

#### Network Interruption Test:
1. Start playing
2. Disable network (disconnect WiFi/turn off mobile data)
3. Wait 30 seconds
4. Re-enable network
5. Should see automatic recovery

#### Background Tab Test:
1. Start playing
2. Switch to another tab for 10+ minutes
3. Return to app tab
4. Should see: `Page visible - checking stream health`

#### Mobile Device Test:
1. Open on iPad/iPhone
2. Lock device for 30+ minutes
3. Unlock and check if stream continues
4. Check iOS control center media controls

### 5. Memory Monitoring

#### Chrome DevTools:
1. Right-click → Inspect
2. Go to "Performance" tab
3. Click "Record"
4. Let it run for 10+ minutes
5. Stop recording and analyze memory usage

#### What to Look For:
- Memory should not continuously increase
- Periodic garbage collection events
- Stable buffer sizes

### 6. iOS Specific Testing

#### Background Playback:
1. Start playing on iPad/iPhone
2. Press home button (app goes to background)
3. Open Control Center
4. Should see media controls with track info
5. Audio should continue playing

#### Media Session API:
1. Check that track info updates in iOS control center
2. Test play/pause from control center
3. Lock device and test playback continues

### 7. Service Worker Testing

#### Cache Behavior:
1. Load app once online
2. Go offline (DevTools → Network → Offline)
3. Reload page
4. Should load from cache (except streaming)

#### Streaming Exclusion:
1. Open DevTools → Network tab
2. Start playing
3. Should see `.m3u8` and `somafm.com` requests bypass cache
4. Should see "bypassed" status in network log

### 8. Error Simulation

#### Manual Error Testing:
```javascript
// In browser console, simulate network error:
if (window.hls) {
    window.hls.trigger(Hls.Events.ERROR, {
        type: Hls.ErrorTypes.NETWORK_ERROR,
        fatal: true,
        details: 'Manual test error'
    });
}
```

### 9. Performance Metrics to Collect

#### Before vs After Comparison:
- Memory usage over time
- Number of playback interruptions
- Recovery time after network issues
- Buffer size stability
- CPU usage during playback

### 10. Troubleshooting

#### If Issues Occur:
1. Check console for error messages
2. Verify HLS.js version is latest
3. Clear browser cache and service workers
4. Test with different network conditions
5. Try different stations

#### Debug Mode:
Add to console for extra logging:
```javascript
// Enable verbose HLS.js logging
if (window.hls) {
    window.hls.config.debug = true;
}
```

## 📊 Success Criteria

### ✅ Expected Improvements:
1. **No more sudden stops after 1-2 hours**
2. **Automatic recovery from network issues**
3. **Stable memory usage over long periods**
4. **Better iOS background playback**
5. **Improved error handling and logging**

### 📈 Performance Benchmarks:
- Memory usage: Should remain stable (no continuous growth)
- Buffer size: Should stay within configured limits (30s-10min)
- Recovery time: < 5 seconds for network issues
- Uptime: 3+ hours continuous playback

## 🐛 Report Issues

If you encounter problems during testing:
1. Copy console errors
2. Note the time when issue occurred
3. Describe network conditions
4. Mention device/browser used
5. Include any recovery attempts shown in logs