import os
import json
import requests
import re

# Configuración
API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_ID = "UCboXCsBUZvek5T5cCltHS5w" # Chillimicaaaaa

def parse_duration(duration_str):
    """Convierte la duración ISO 8601 (ej. PT1H2M10S) a segundos para filtrar Shorts"""
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    return (hours * 3600) + (minutes * 60) + seconds

def obtener_avatar():
    """Obtiene la URL del avatar de alta calidad del canal"""
    url_channel = f"https://www.googleapis.com/youtube/v3/channels?part=snippet&id={CHANNEL_ID}&key={API_KEY}"
    try:
        resp = requests.get(url_channel)
        data = resp.json()
        if "items" in data and len(data["items"]) > 0:
            return data["items"][0]["snippet"]["thumbnails"]["high"]["url"]
    except Exception as e:
        print(f"⚠️ Error obteniendo avatar: {e}")
    return None

def buscar_video_real():
    # PASO 0: Obtener Avatar del canal
    avatar_url = obtener_avatar()
    if avatar_url:
        print(f"🖼️  Avatar encontrado: {avatar_url}")

    # PASO 1: Obtener la lista de subidas del canal
    # Truco: Cambiamos "UC" (Canal) por "UU" (Uploads Playlist) para ahorrar cuota
    uploads_id = CHANNEL_ID.replace("UC", "UU", 1)
    
    # Pedimos los ultimos 10 videos de la lista de subidas
    url_playlist = f"https://www.googleapis.com/youtube/v3/playlistItems?key={API_KEY}&playlistId={uploads_id}&part=contentDetails&maxResults=10"
    
    resp = requests.get(url_playlist)
    data = resp.json()
    
    if "items" not in data:
        print("Error obteniendo lista:", data)
        return

    # Extraemos los IDs de los videos para analizarlos en detalle
    video_ids = [item["contentDetails"]["videoId"] for item in data["items"]]
    ids_string = ",".join(video_ids)

    # PASO 2: Analizar los detalles técnicos de esos videos
    # Pedimos 'liveStreamingDetails' (para detectar directos) y 'contentDetails' (para duración)
    url_details = f"https://www.googleapis.com/youtube/v3/videos?key={API_KEY}&id={ids_string}&part=snippet,contentDetails,liveStreamingDetails"
    
    resp_details = requests.get(url_details)
    items_details = resp_details.json().get("items", [])

    video_final = None

    for item in items_details:
        titulo = item["snippet"]["title"]
        
        # --- FILTRO 1: ¿Es un Directo (Live) o Pasado? ---
        # Si existe la clave 'liveStreamingDetails', es un directo (o fue uno). ¡Lo saltamos!
        if "liveStreamingDetails" in item:
            print(f"SALTADO (Es directo): {titulo}")
            continue

        # --- FILTRO 2: ¿Es un Short? ---
        # Si dura menos de 60 segundos, es un Short. ¡Lo saltamos!
        duracion = parse_duration(item["contentDetails"]["duration"])
        if duracion < 60:
            print(f"SALTADO (Es Short): {titulo} ({duracion}s)")
            continue

        # ¡Si llegamos aquí, es un VIDEO DE VERDAD!
        video_final = {
            "id": item["id"],
            "title": titulo,
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "date": item["snippet"]["publishedAt"],
            "channel_avatar": avatar_url # Agregamos el avatar aqui
        }
        break # Ya encontramos el más reciente, dejamos de buscar

    # Guardar resultadoa
    if video_final:
        with open("video_data.json", "w") as f:
            json.dump(video_final, f)
        print(f"✅ EXITO: Guardado video: {video_final['title']}")
        if avatar_url:
             print(f"✅ EXITO: Guardado avatar en el JSON")
    else:
        print("⚠️ No se encontraron videos editados recientes (todo eran lives o shorts).")

if __name__ == "__main__":
    buscar_video_real()