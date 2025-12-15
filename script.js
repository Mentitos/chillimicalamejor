const channelID = 'UCboXCsBUZvek5T5cCltHS5w';
const backupVideoId = 'ti2DIoIAjHQ';
const backupTitle = 'Descentrar las relaciones (Video Destacado)';

const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelID}`;
const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

document.addEventListener('DOMContentLoaded', cargarVideoReciente);

async function cargarVideoReciente() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Si hay al menos dos videos, muestra el segundo más reciente.
        // Si solo hay uno, muestra ese.
        if (data.items && data.items.length > 1) {
            const videoElegido = data.items[1]; // El segundo video de la lista
            const videoId = videoElegido.link.split('v=')[1];
            mostrarVideo(videoId, videoElegido.title, videoElegido.pubDate);
        } else if (data.items && data.items.length > 0) {
            console.log("Solo se encontró un video, mostrando el más reciente.");
            const videoElegido = data.items[0]; // El primer video si solo hay uno
            const videoId = videoElegido.link.split('v=')[1];
            mostrarVideo(videoId, videoElegido.title, videoElegido.pubDate);
        }
        else {
            throw new Error("No se encontraron videos en el feed.");
        }
    } catch (error) {
        console.error("Error cargando el feed de videos:", error);
        mostrarVideo(backupVideoId, backupTitle, "");
    }
}

function mostrarVideo(id, titulo, fecha) {
    document.getElementById('main-video').src = `https://www.youtube.com/embed/${id}`;
    document.getElementById('video-title').innerText = titulo;
    
    if (fecha) {
        const dateObj = new Date(fecha);
        document.getElementById('video-date').innerText = dateObj.toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
    } else {
        document.getElementById('video-date').innerText = '';
    }
}
