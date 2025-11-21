# CORS Issue and Solution

## Problem

When attempting to play SomaFM direct audio streams (MP3/AAC) from a web application, the browser blocks the requests with a **403 Forbidden** error due to CORS (Cross-Origin Resource Sharing) policy.

### Error Details
```
Access to XMLHttpRequest at 'https://ice1.somafm.com/cliqhop-256-mp3' from origin 'http://localhost:8000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Why This Happens
- SomaFM's direct stream URLs work fine when opened directly in a browser
- However, when accessed from a web application (JavaScript), the server returns 403 Forbidden
- This is because SomaFM doesn't include the `Access-Control-Allow-Origin` header in responses to direct stream requests
- Modern browsers enforce CORS policy and block such requests for security reasons

## Solution

### Option 1: Use HLS Streams (Preferred)
HLS streams from SomaFM include proper CORS headers and work without issues:
```javascript
streamUrl: 'https://hls.somafm.com/hls/groovesalad/320k/program.m3u8'
```

**Pros:**
- No proxy needed
- Better quality and adaptive bitrate
- Official SomaFM format

**Cons:**
- Not all stations may have HLS streams available
- Requires HLS.js library for non-Safari browsers

### Option 2: Use CORS Proxy (For Direct Streams)
For stations where HLS is not available, use a CORS proxy service:
```javascript
streamUrl: 'https://corsproxy.io/?https://ice1.somafm.com/cliqhop-128-aac'
```

**How it works:**
1. The proxy server receives your request
2. It fetches the stream from SomaFM
3. It adds the `Access-Control-Allow-Origin: *` header
4. Returns the stream to your application

**Available CORS Proxies:**
- `https://corsproxy.io/?[url]` - Free, reliable
- `https://api.allorigins.win/raw?url=[url]` - Alternative
- Self-hosted proxy (for production use)

**Pros:**
- Works with any direct stream
- Simple to implement

**Cons:**
- Depends on third-party service
- May have rate limits
- Slight latency increase

## Implementation in This Project

### Stations Configuration
```javascript
const stations = [
    {
        id: 'groovesalad',
        name: 'Groove Salad Classic',
        streamUrl: 'https://hls.somafm.com/hls/gs-unprocessed/320k/program.m3u8', // HLS - works directly
        playlistUrl: 'https://somafm.com/songs/groovesalad.xml'
    },
    {
        id: 'cliqhop',
        name: 'Cliqhop',
        streamUrl: 'https://corsproxy.io/?https://ice1.somafm.com/cliqhop-128-aac', // Direct stream via proxy
        playlistUrl: 'https://somafm.com/songs/cliqhop.xml'
    }
];
```

### Stream Detection
The `loadStation()` function automatically detects stream type:
- If URL contains `.m3u8` → Use HLS.js
- Otherwise → Use direct audio element (works with proxy URLs)

## For Production

For a production deployment, consider:

1. **Check if HLS is available** for all your stations first
2. **Self-host a CORS proxy** if you need direct streams (more reliable than public proxies)
3. **Add error handling** to fall back to alternative streams if one fails
4. **Respect SomaFM's terms of service** - consider supporting them if you use their streams

## Testing

To verify CORS is working:
1. Open browser DevTools → Console
2. Switch stations
3. Look for any CORS errors
4. Check Network tab to see if streams load successfully

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [SomaFM Stream URLs](https://somafm.com/listen/)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
