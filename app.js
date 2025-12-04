document.addEventListener('DOMContentLoaded', () => {
    // Feather Icons
    feather.replace();

    // Stations Configuration
    const stations = [
        {
            id: 'groovesalad',
            name: 'Groove Salad Classic',
            streamUrl: 'https://hls.somafm.com/hls/gs-unprocessed/320k/program.m3u8',
            playlistUrl: 'https://somafm.com/songs/groovesalad.xml'
        },
        {
            id: 'cliqhop',
            name: 'Cliqhop',
            streamUrl: 'https://corsproxy.io/?https://ice1.somafm.com/cliqhop-128-aac',
            playlistUrl: 'https://somafm.com/songs/cliqhop.xml'
        }
    ];

    let currentStation = stations[0];
    let hls = null;
    let playlistInterval = null;
    let isLoadingStation = false;
    let healthCheckInterval = null;
    let memoryCleanupInterval = null;

    // Player Elements
    const audio = document.getElementById('audio-player');
    const playBtn = document.querySelector('.play-btn');
    const playIcon = document.querySelector('.play-icon');
    const stopIcon = document.querySelector('.stop-icon');
    const volumeBtn = document.querySelector('.volume-btn');
    const volumeOn = document.querySelector('.volume-on');
    const volumeOff = document.querySelector('.volume-off');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playlistContent = document.getElementById('playlist-content');
    const stationTitle = document.querySelector('.station-title');
    const stationsBtn = document.querySelectorAll('footer nav a')[1]; // Stations button

    // Function to load a station
    // NOTE: Some SomaFM streams (direct MP3/AAC) require CORS proxy due to missing Access-Control-Allow-Origin headers
    // HLS streams work directly, but direct streams need proxy like: https://corsproxy.io/?[stream-url]
    function loadStation(station) {
        isLoadingStation = true;
        currentStation = station;
        const wasPlaying = !audio.paused;
        
        // Update station title
        stationTitle.textContent = station.name;
        
        // Stop current playback
        audio.pause();
        
        // Destroy existing HLS instance if it exists
        if (hls) {
            hls.destroy();
            hls = null;
        }
        
        // Detect stream type
        const isHLS = station.streamUrl.includes('.m3u8');
        
        // Remove all source elements first
        const sources = audio.querySelectorAll('source');
        sources.forEach(source => source.remove());
        
        // Clear the audio element
        audio.removeAttribute('src');
        
        // Load new stream
        if (isHLS && Hls.isSupported()) {
            // Use HLS.js for HLS streams with buffer management
            hls = new Hls({
                maxBufferLength: 30,        // Max 30 seconds buffer
                maxMaxBufferLength: 600,    // Absolute max 10 minutes
                maxBufferSize: 60 * 1000 * 1000,  // 60MB max buffer
                maxBufferHole: 0.5,        // Max buffer hole duration
                highBufferWatchdogPeriod: 2,  // Check buffer every 2 seconds
                nudgeOffset: 0.1,           // Small nudge to keep stream alive
                nudgeMaxRetry: 3,           // Max nudges before recovery
                backBufferLength: 90        // Keep 90 seconds behind
            });
            
            hls.loadSource(station.streamUrl);
            hls.attachMedia(audio);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                isLoadingStation = false;
                if (wasPlaying) {
                    audio.play().catch(e => console.error('Play error:', e));
                }
                console.log('HLS manifest parsed successfully');
            });
            
            hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS Error:', data);
                
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, attempting recovery...');
                            try {
                                hls.startLoad();
                            } catch (e) {
                                console.error('Failed to restart stream:', e);
                                setTimeout(() => loadStation(station), 3000);
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, attempting recovery...');
                            try {
                                hls.recoverMediaError();
                            } catch (e) {
                                console.error('Media recovery failed:', e);
                                setTimeout(() => loadStation(station), 3000);
                            }
                            break;
                        default:
                            console.error('Fatal error, reloading stream in 3 seconds');
                            setTimeout(() => loadStation(station), 3000);
                            break;
                    }
                }
            });
            
            // Buffer monitoring
            hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
                console.log('Buffer appended:', {
                    duration: data.duration,
                    size: data.size,
                    buffered: audio.buffered.length
                });
            });
            
            hls.on(Hls.Events.BUFFER_EOS, () => {
                console.log('End of stream reached');
            });
        } else if (isHLS && audio.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            audio.src = station.streamUrl;
            audio.load();
            isLoadingStation = false;
            if (wasPlaying) {
                audio.play().catch(e => console.error('Play error:', e));
            }
        } else {
            // Direct MP3/AAC stream
            audio.src = station.streamUrl;
            audio.load();
            isLoadingStation = false;
            
            if (wasPlaying) {
                audio.play().catch(e => console.error('Play error:', e));
            }
        }
        
        // Clear and restart playlist fetching
        if (playlistInterval) {
            clearInterval(playlistInterval);
        }
        fetchPlaylist();
        playlistInterval = setInterval(fetchPlaylist, 30000);
        
        // Setup health check, memory management, and media session
        setupHealthCheck();
        setupMemoryManagement();
        setupMediaSession();
    }
    
    // Initialize with first station
    loadStation(currentStation);
    
    // Setup performance monitoring once
    setupPerformanceMonitoring();

    // Play/Stop Controls
    function togglePlay() {
        if (isLoadingStation) {
            return; // Wait for station to finish loading
        }
        
        if (audio.paused) {
            audio.play().catch(e => console.error('Play error:', e));
        } else {
            audio.pause();
            audio.currentTime = 0; // Reset to beginning when stopped
        }
    }

    audio.addEventListener('play', () => {
        playIcon.style.display = 'none';
        stopIcon.style.display = 'block';
        feather.replace();
    });

    audio.addEventListener('pause', () => {
        playIcon.style.display = 'block';
        stopIcon.style.display = 'none';
        feather.replace();
    });
    
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', audio.error ? audio.error.code : 'unknown');
    });
    
    playBtn.addEventListener('click', togglePlay);

    // Volume/Mute Controls
    let isMuted = false;

    function toggleMute() {
        isMuted = !isMuted;
        audio.muted = isMuted;
        
        if (isMuted) {
            volumeOn.style.display = 'none';
            volumeOff.style.display = 'block';
        } else {
            volumeOn.style.display = 'block';
            volumeOff.style.display = 'none';
        }
        feather.replace();
    }

    volumeBtn.addEventListener('click', toggleMute);

    // Fetch and display playlist
    async function fetchPlaylist() {
        try {
            const response = await fetch(currentStation.playlistUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const songs = xmlDoc.querySelectorAll('song');
            
            // Get current track (first song)
            if (songs.length > 0) {
                const currentSong = songs[0];
                const title = currentSong.querySelector('title')?.textContent || 'Unknown Track';
                const artist = currentSong.querySelector('artist')?.textContent || 'Unknown Artist';
                trackTitle.textContent = title;
                trackArtist.textContent = artist;
            }
            
            // Display last 10 songs (history)
            const playlistItems = Array.from(songs).slice(0, 10).map(song => {
                const title = song.querySelector('title')?.textContent || 'Unknown Track';
                const artist = song.querySelector('artist')?.textContent || 'Unknown Artist';
                return `
                    <div class="playlist-item">
                        <div class="song-title">${title}</div>
                        <div class="song-artist">${artist}</div>
                    </div>
                `;
            }).join('');
            
            playlistContent.innerHTML = playlistItems;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            trackTitle.textContent = currentStation.name;
            playlistContent.innerHTML = '<p style="padding: 20px; color: #999;">Unable to load playlist.</p>';
        }
    }

    // Health Check Function
    function setupHealthCheck() {
        // Clear existing health check
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
        }
        
        healthCheckInterval = setInterval(() => {
            if (!audio.paused && audio.readyState > 0) {
                // Check if stream appears stalled
                const currentTime = audio.currentTime;
                const buffered = audio.buffered;
                
                // Log current state for debugging
                console.log('Health check:', {
                    paused: audio.paused,
                    readyState: audio.readyState,
                    currentTime: currentTime,
                    bufferedRanges: buffered.length,
                    networkState: audio.networkState
                });
                
                // Check if we have buffered data but playback is stuck
                if (buffered.length > 0) {
                    const bufferedEnd = buffered.end(buffered.length - 1);
                    const timeDiff = bufferedEnd - currentTime;
                    
                    // If we're more than 10 seconds behind buffer end, we might be stalled
                    if (timeDiff > 10) {
                        console.warn('Stream appears stalled, attempting recovery');
                        console.log('Buffer end:', bufferedEnd, 'Current time:', currentTime, 'Diff:', timeDiff);
                        
                        // Try to nudge playback
                        audio.currentTime = currentTime + 0.1;
                        
                        // If still stuck after 2 seconds, reload
                        setTimeout(() => {
                            if (audio.currentTime === currentTime) {
                                console.log('Recovery nudge failed, reloading stream');
                                loadStation(currentStation);
                            }
                        }, 2000);
                    }
                }
                
                // Check if we've lost connection completely
                if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                    console.warn('Network state indicates no source, reloading');
                    loadStation(currentStation);
                }
            }
        }, 60000); // Check every minute
    }

    // Memory Management Function
    function setupMemoryManagement() {
        // Clear existing memory cleanup
        if (memoryCleanupInterval) {
            clearInterval(memoryCleanupInterval);
        }
        
        memoryCleanupInterval = setInterval(() => {
            if (hls && hls.bufferController) {
                // Log buffer status for debugging
                const bufferInfo = {
                    buffered: audio.buffered.length,
                    currentTime: audio.currentTime,
                    readyState: audio.readyState,
                    networkState: audio.networkState
                };
                
                // Get detailed buffer info if available
                if (audio.buffered.length > 0) {
                    bufferInfo.bufferStart = audio.buffered.start(0);
                    bufferInfo.bufferEnd = audio.buffered.end(audio.buffered.length - 1);
                    bufferInfo.bufferDuration = bufferInfo.bufferEnd - bufferInfo.bufferStart;
                }
                
                console.log('Memory management check:', bufferInfo);
                
                // Force garbage collection hint if available
                if (window.gc) {
                    window.gc();
                    console.log('Forced garbage collection');
                }
                
                // If buffer is getting too large, trigger cleanup
                if (bufferInfo.bufferDuration && bufferInfo.bufferDuration > 600) { // 10 minutes
                    console.warn('Buffer size excessive, triggering cleanup');
                    if (hls.bufferController) {
                        try {
                            hls.bufferController.flushBuffer();
                        } catch (e) {
                            console.error('Buffer flush failed:', e);
                        }
                    }
                }
            }
        }, 300000); // Every 5 minutes
    }

    // iOS Media Session API for better background playback
    function setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'SomaFM Player',
                artist: currentStation.name,
                album: 'Internet Radio',
                artwork: [
                    { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
                    { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
                    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
                    { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
                    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            
            // Update media session when track changes
            navigator.mediaSession.setActionHandler('play', () => {
                audio.play().catch(e => console.error('Media session play error:', e));
            });
            
            navigator.mediaSession.setActionHandler('pause', () => {
                audio.pause();
            });
            
            navigator.mediaSession.setActionHandler('stop', () => {
                audio.pause();
                audio.currentTime = 0;
            });
            
            // Update metadata when station changes
            if (trackTitle && trackArtist) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: trackTitle.textContent,
                    artist: trackArtist.textContent,
                    album: currentStation.name
                });
            }
        }
    }

    // Enhanced Performance Monitoring
    function setupPerformanceMonitoring() {
        // Monitor audio element events
        audio.addEventListener('stalled', () => {
            console.error('Audio stalled at:', audio.currentTime);
        });
        
        audio.addEventListener('waiting', () => {
            console.warn('Audio waiting for data at:', audio.currentTime);
        });
        
        audio.addEventListener('seeking', () => {
            console.log('Audio seeking to:', audio.currentTime);
        });
        
        audio.addEventListener('seeked', () => {
            console.log('Audio seeked to:', audio.currentTime);
        });
        
        audio.addEventListener('progress', () => {
            if (audio.buffered.length > 0) {
                const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
                const duration = audio.duration || 0;
                const bufferedPercent = (bufferedEnd / duration) * 100;
                
                // Only log significant buffer changes
                if (bufferedPercent % 10 < 1) {
                    console.log(`Buffered: ${bufferedPercent.toFixed(1)}%`);
                }
            }
        });
        
        // Monitor page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden - stream may be throttled');
            } else {
                console.log('Page visible - checking stream health');
                // Quick health check when page becomes visible
                if (!audio.paused && audio.currentTime === 0) {
                    console.warn('Stream stalled while page was hidden, recovering');
                    loadStation(currentStation);
                }
            }
        });
        
        // Monitor network connection
        if ('connection' in navigator) {
            const connection = navigator.connection;
            console.log('Network connection:', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            });
            
            connection.addEventListener('change', () => {
                console.log('Network connection changed:', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                });
            });
        }
    }

    // Station Selector Modal
    function showStationModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'station-modal';
        modal.innerHTML = `
            <div class="station-modal-content">
                <h2>Select Station</h2>
                <div class="station-list">
                    ${stations.map(station => `
                        <div class="station-item ${station.id === currentStation.id ? 'active' : ''}" data-station-id="${station.id}">
                            <span>${station.name}</span>
                            ${station.id === currentStation.id ? '<i data-feather="check"></i>' : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="close-modal">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        feather.replace();
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelectorAll('.station-item').forEach(item => {
            item.addEventListener('click', () => {
                const stationId = item.dataset.stationId;
                const station = stations.find(s => s.id === stationId);
                if (station && station.id !== currentStation.id) {
                    loadStation(station);
                }
                modal.remove();
            });
        });
    }
    
    // Add click handler to Stations button
    stationsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showStationModal();
    });
});