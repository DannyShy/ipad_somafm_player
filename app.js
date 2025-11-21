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
            // Use HLS.js for HLS streams
            hls = new Hls();
            hls.loadSource(station.streamUrl);
            hls.attachMedia(audio);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                isLoadingStation = false;
                if (wasPlaying) {
                    audio.play().catch(e => console.error('Play error:', e));
                }
            });
            
            hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS Error:', data);
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
    }
    
    // Initialize with first station
    loadStation(currentStation);

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
                trackTitle.textContent = `${title} - ${artist}`;
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