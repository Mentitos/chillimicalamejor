const channelID = 'UCboXCsBUZvek5T5cCltHS5w';
const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelID}`;
const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // 1. Update Avatar
        const avatarImg = document.getElementById('hero-avatar');
        // Add error handler fallback
        if (avatarImg) {
            avatarImg.onerror = function () {
                this.src = "https://yt3.googleusercontent.com/DYwV33MwJeellbSB0bqFYLlNjFI4ZUYAnbp780GLztlcNOterlv9vV5U67Ml920ko_dtUqpywA";
            };
        }

        if (data.feed && data.feed.image) {
            if (avatarImg) avatarImg.src = data.feed.image;
        }

        // 2. Render Videos
        const videoGrid = document.getElementById('video-grid');
        if (data.items && data.items.length > 0) {
            videoGrid.innerHTML = ''; // Clear loading state

            // Take up to 4 videos
            const videosToShow = data.items.slice(0, 4);

            videosToShow.forEach(video => {
                const card = createVideoCard(video);
                videoGrid.appendChild(card);
            });
        } else {
            videoGrid.innerHTML = '<p>No se encontraron videos recientes.</p>';
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        loadBackupContent();
    }

    // Load Fan Arts
    loadFanArt();
}

async function loadFanArt() {
    const galleryGrid = document.querySelector('.fan-art-grid');
    if (!galleryGrid) return;

    // Use global fanArtData from fanart_data.js
    if (typeof fanArtData !== 'undefined') {
        galleryGrid.innerHTML = ''; // Clear placeholders

        fanArtData.forEach(art => {
            const card = document.createElement('div');
            card.className = 'art-card';
            card.innerHTML = `
                <a href="${art.link}" target="_blank">
                    <img src="${art.image}" alt="Fan Art de ${art.artist}" loading="lazy">
                    <div class="art-caption">${art.artist}</div>
                </a>
            `;
            galleryGrid.appendChild(card);
        });
    } else {
        console.warn("No se encontraron fan arts (fanArtData undefined).");
        galleryGrid.innerHTML = '<p>No se pudo cargar la galería.</p>';
    }
}

function createVideoCard(video) {
    const videoId = video.link ? video.link.split('v=')[1] : video.id; // Handle both RSS and JSON formats
    const title = video.title;
    const dateStr = new Date(video.pubDate || video.date).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const card = document.createElement('div');
    card.className = 'video-card';

    card.innerHTML = `
        <div class="video-thumbnail-container">
            <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                title="${title}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="video-info">
            <h3>${title}</h3>
            <div class="video-date">${dateStr}</div>
        </div>
    `;
    return card;
}

async function loadBackupContent() {
    console.log("Intentando cargar desde video_data.json...");
    try {
        const response = await fetch('video_data.json');
        if (!response.ok) throw new Error("No se pudo cargar video_data.json");

        const localData = await response.json();

        // 1. Update Avatar from local JSON
        if (localData.channel_avatar) {
            const avatarImg = document.getElementById('hero-avatar');
            if (avatarImg) avatarImg.src = localData.channel_avatar;
        }

        // 2. Render Video from local JSON
        const videoGrid = document.getElementById('video-grid');
        videoGrid.innerHTML = '';

        // Adapt format to match what createVideoCard expects
        // video_data.json is a single object, createVideoCard can handle it with slight modification above
        const card = createVideoCard(localData);
        videoGrid.appendChild(card);

    } catch (e) {
        console.warn("Fallo carga local, usando backup estático.", e);
        // Fallback total
        const videoGrid = document.getElementById('video-grid');
        videoGrid.innerHTML = `
            <div class="video-card">
                 <div class="video-thumbnail-container">
                    <iframe 
                        src="https://www.youtube.com/embed/ti2DIoIAjHQ" 
                        title="Video Destacado" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <h3>Descentrar las relaciones (Video Destacado)</h3>
                    <div class="video-date">Backup Video</div>
                </div>
            </div>
        `;
    }
}
