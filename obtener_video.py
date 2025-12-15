import os
import json
import requests

# Configuración
API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_ID = "UCboXCsBUZvek5T5cCltHS5w" # Chillimica

def buscar_video():
    # Usamos "search" para filtrar solo videos (no playlists, no canales)
    # order=date: trae lo más nuevo
    url = f"https://www.googleapis.com/youtube/v3/search?key={API_KEY}&channelId={CHANNEL_ID}&part=snippet,id&order=date&maxResults=5&type=video"
    
    response = requests.get(url)
    data = response.json()
    
    if "items" not in data:
        print("Error en la API:", data)
        return

    video_final = None

    for item in data["items"]:
        titulo = item["snippet"]["title"].lower()
        vid_id = item["id"]["videoId"]
        
        # Filtros anti-ruido (Shorts y Lives)
        # La API de search a veces mezcla cosas, aseguramos con el título
        es_short = "#shorts" in titulo or "short" in titulo
        es_live = "en vivo" in titulo or "stream" in titulo 
        
        if not es_short and not es_live:
            video_final = {
                "id": vid_id,
                "title": item["snippet"]["title"],
                "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                "date": item["snippet"]["publishedAt"]
            }
            break # Encontramos el más reciente que cumple las reglas
    
    # Si encontramos video, lo guardamos en un JSON
    if video_final:
        with open("video_data.json", "w") as f:
            json.dump(video_final, f)
        print(f"Video actualizado: {video_final['title']}")
    else:
        print("No se encontraron videos válidos recientes.")

if __name__ == "__main__":
    buscar_video()