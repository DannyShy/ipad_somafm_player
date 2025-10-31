document.addEventListener('DOMContentLoaded', () => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered: ', registration))
                .catch(registrationError => console.log('SW registration failed: ', registrationError));
        });
    }

    // Feather Icons
    feather.replace();

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

    const streamUrl = audio.querySelector('source').getAttribute('src');

    // HLS.js Setup
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log('HLS stream loaded');
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = streamUrl;
    }

    // Play/Stop Controls
    function togglePlay() {
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

    // Fetch and Display Playlist
    const playlistUrl = 'https://somafm.com/songs/groovesalad.xml';

    function fetchPlaylist() {
        console.log('Fetching playlist...');
        fetch(playlistUrl, {
            mode: 'cors',
            cache: 'no-cache'
        })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(str => {
                console.log('XML received, parsing...');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(str, "text/xml");
                
                // Check for parsing errors
                const parserError = xmlDoc.querySelector('parsererror');
                if (parserError) {
                    throw new Error('XML parsing error');
                }
                
                const songs = Array.from(xmlDoc.querySelectorAll('song'));
                console.log('Found songs:', songs.length);
                
                if (songs.length === 0) {
                    throw new Error('No songs found in XML');
                }
                
                // Update current track info (first song in the list is currently playing)
                const currentSong = songs[0];
                const currentTitle = currentSong.querySelector('title');
                const currentArtist = currentSong.querySelector('artist');
                
                if (currentTitle && currentArtist) {
                    trackTitle.textContent = currentTitle.textContent;
                    trackArtist.textContent = currentArtist.textContent;
                    console.log('Current track:', currentTitle.textContent, '-', currentArtist.textContent);
                }

                // Update playlist history (show 10 songs that already played)
                playlistContent.innerHTML = '';
                const historySongs = songs.slice(1, 11); // Get songs 1-10 (skip the current one)
                
                historySongs.forEach((song, index) => {
                    const title = song.querySelector('title');
                    const artist = song.querySelector('artist');
                    
                    if (title && artist) {
                        const songElement = document.createElement('div');
                        songElement.classList.add('song');
                        songElement.innerHTML = `
                            <div class="song-info">
                                <div class="song-title">${title.textContent}</div>
                                <div class="song-artist">${artist.textContent}</div>
                            </div>
                        `;
                        playlistContent.appendChild(songElement);
                    }
                });
                
                console.log('Playlist updated with', historySongs.length, 'songs');
            })
            .catch(error => {
                console.error('Error fetching playlist:', error);
                trackTitle.textContent = 'Groove Salad Classic';
                trackArtist.textContent = 'Loading playlist...';
                playlistContent.innerHTML = '<p style="padding: 20px; color: #999;">Unable to load playlist. Please check your connection.</p>';
            });
    }

    // Initial fetch and periodic updates
    fetchPlaylist();
    setInterval(fetchPlaylist, 30000); // Update every 30 seconds
});