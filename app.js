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
    const pauseIcon = document.querySelector('.pause-icon');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playlistContent = document.getElementById('playlist-content');

    const streamUrl = audio.querySelector('source').getAttribute('src');

    // HLS.js Setup
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = streamUrl;
    }

    // Player Controls
    function togglePlay() {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }

    audio.addEventListener('play', () => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    });

    audio.addEventListener('pause', () => {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    });

    playBtn.addEventListener('click', togglePlay);

    // Fetch and Display Playlist
    const playlistUrl = 'https://somafm.com/songs/groovesalad.xml';

    function fetchPlaylist() {
        fetch(playlistUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                const songs = Array.from(data.querySelectorAll('song'));
                
                // Update current track info (first song in the list)
                if (songs.length > 0) {
                    const currentSong = songs[0];
                    trackTitle.textContent = currentSong.querySelector('title').textContent;
                    trackArtist.textContent = currentSong.querySelector('artist').textContent;
                }

                // Update playlist history (the rest of the songs)
                playlistContent.innerHTML = '';
                const historySongs = songs.slice(1, 5); // Display next 4 songs
                historySongs.forEach(song => {
                    const title = song.querySelector('title').textContent;
                    const artist = song.querySelector('artist').textContent;
                    const songElement = document.createElement('div');
                    songElement.classList.add('song');
                    songElement.innerHTML = `
                        <div class="song-info">
                            <div class="song-title">${title}</div>
                            <div class="song-artist">${artist}</div>
                        </div>
                    `;
                    playlistContent.appendChild(songElement);
                });
            })
            .catch(error => {
                console.error('Error fetching playlist:', error);
                trackTitle.textContent = 'Error';
                trackArtist.textContent = 'Could not load playlist.';
            });
    }

    fetchPlaylist();
    setInterval(fetchPlaylist, 15000); // Update every 15 seconds
});