if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const audio = document.querySelector('audio');
    const source = audio.querySelector('source');
    const streamUrl = source.getAttribute('src');

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            audio.play();
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = streamUrl;
        audio.addEventListener('loadedmetadata', function () {
            audio.play();
        });
    }

    const playlistContent = document.getElementById('playlist-content');
    const playlistUrl = 'https://somafm.com/songs/groovesalad.xml';

    function fetchPlaylist() {
        // Use a proxy to avoid CORS issues if running locally
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        fetch(proxyUrl + playlistUrl)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                playlistContent.innerHTML = ''; // Clear previous list
                const songs = data.querySelectorAll('song');
                songs.forEach(song => {
                    const title = song.querySelector('title').textContent;
                    const artist = song.querySelector('artist').textContent;
                    const songElement = document.createElement('div');
                    songElement.classList.add('song');
                    songElement.innerHTML = `
                        <div class="song-title">${title}</div>
                        <div class="song-artist">${artist}</div>
                    `;
                    playlistContent.appendChild(songElement);
                });
            })
            .catch(error => {
                console.error('Error fetching playlist:', error);
                playlistContent.innerHTML = '<p>Could not load playlist.</p>';
            });
    }

    fetchPlaylist();
    setInterval(fetchPlaylist, 20000); // Update every 20 seconds
});