import os
import tempfile
import httpx
from typing import Optional
from app.config import settings
import yt_dlp


async def download_video_ytdlp(url: str, filename: Optional[str] = None) -> Optional[str]:
    """
    Download video using yt-dlp library.
    Returns path to downloaded file or None if failed.
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(settings.temp_video_dir, exist_ok=True)
        
        # Determine file path
        if filename:
            temp_path = os.path.join(settings.temp_video_dir, f"{filename}.mp4")
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                print(f"Video file already exists: {temp_path}")
                return temp_path
        else:
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".mp4",
                dir=settings.temp_video_dir
            )
            temp_path = temp_file.name
            temp_file.close()
        
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': temp_path,
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            return temp_path
        else:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return None
            
    except Exception as e:
        print(f"yt-dlp download failed: {e}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return None


async def download_via_rapidapi(url: str, api_key: Optional[str] = None, filename: Optional[str] = None) -> Optional[str]:
    """
    Download via RapidAPI. SKIP if file exists appropriately.
    """
    if not api_key:
        api_key = settings.rapidapi_key
    
    if not api_key:
        return None
    
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(settings.temp_video_dir, exist_ok=True)
        
        # Determine file path
        if filename:
            temp_path = os.path.join(settings.temp_video_dir, f"{filename}.mp4")
            # CHECK IF EXISTS
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                print(f"Video file already exists (skipping download): {temp_path}")
                return temp_path
        else:
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".mp4",
                dir=settings.temp_video_dir
            )
            temp_path = temp_file.name
            temp_file.close()
        
        print(f"Calling RapidAPI endpoint: get-post for {url}")
        async with httpx.AsyncClient() as client:
            # 1. Get Download URL
            response = await client.get(
                f"https://{settings.rapidapi_host}/get-post",
                headers={
                    "x-rapidapi-key": api_key,
                    "x-rapidapi-host": settings.rapidapi_host
                },
                params={"url": url},
                timeout=60.0 
            )
            
            if response.status_code != 200:
                print(f"RapidAPI request failed: {response.status_code} - {response.text}")
                return None
                
            data = response.json()
            download_url = None
            
            # Parse response format: {"media": [{"url": "..."}]}
            if "media" in data and isinstance(data["media"], list) and len(data["media"]) > 0:
                download_url = data["media"][0].get("url")
            elif "url" in data: # Fallback
                download_url = data["url"]
                
            if not download_url:
                print(f"No download URL found in RapidAPI response: {data}")
                return None
                
            print(f"Downloading video content from: {download_url[:50]}...")
            
            # 2. Download valid video content
            video_response = await client.get(download_url, timeout=300.0) 
            
            if video_response.status_code != 200:
                print(f"Failed to download video content: {video_response.status_code}")
                return None
                
            with open(temp_path, "wb") as f:
                f.write(video_response.content)
                
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            return temp_path
        else:
            return None
            
    except Exception as e:
        print(f"RapidAPI download failed: {e}")
        # Only clean up if we created the file and it failed? 
        # Actually logic above is fine, but be careful not to delete pre-existing file on error if logic was different.
        # Here we only write if we decide to download.
        if os.path.exists(temp_path):
            try:
                # If we were writing to it and failed, likely partial.
                os.remove(temp_path)
            except:
                pass
        return None


async def download_instagram_video(url: str, filename: Optional[str] = None) -> Optional[str]:
    """
    Main download function - prioritizes RapidAPI if key exists, falls back to yt-dlp.
    """
    # Priority 1: Use RapidAPI if key is available (more reliable)
    if settings.rapidapi_key:
        print("Attempting download via RapidAPI...")
        video_path = await download_via_rapidapi(url, filename=filename)
        
        if video_path:
            return video_path
        print("RapidAPI download failed, falling back to yt-dlp...")
    
    # Priority 2: Fallback to yt-dlp
    print("Attempting download via yt-dlp...")
    video_path = await download_video_ytdlp(url, filename=filename)
    
    if video_path:
        return video_path
    
    return None


async def cleanup_video_file(video_path: Optional[str]) -> None:
    """
    Clean up temporary video file after processing.
    
    Args:
        video_path: Path to the video file to delete
    """
    if not video_path:
        return
    
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
            print(f"Cleaned up video file: {video_path}")
    except Exception as e:
        print(f"Error cleaning up video file {video_path}: {e}")

