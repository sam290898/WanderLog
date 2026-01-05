from datetime import datetime
import uuid
import logging

from app.supabase_client import supabase
from app.models import VideoStatus
from app.services.video_downloader import download_instagram_video, cleanup_video_file
from app.services.ai_extractor import extract_locations_from_video
from app.services.maps_service import find_place_basic

logger = logging.getLogger(__name__)

async def process_video_source(video_source_id: str):
    """
    Main processing function for a video source.
    Downloads video, extracts locations with AI, and saves to DB via Supabase.
    """
    try:
        # Fetch current state to get URL
        response = supabase.table("video_sources").select("*").eq("id", video_source_id).execute()
        if not response.data:
            logger.error(f"Video source {video_source_id} not found")
            return
        
        video_source = response.data[0]
        original_url = video_source.get("original_url")
        
        # Update status to processing
        supabase.table("video_sources").update({"status": VideoStatus.PROCESSING}).eq("id", video_source_id).execute()
        
        # Step A: Download video
        print(f"Downloading video from: {original_url}")
        # Use video_source_id as filename so we can reuse it if it exists
        video_path = await download_instagram_video(original_url, filename=video_source_id)
        
        if not video_path:
            supabase.table("video_sources").update({
                "status": VideoStatus.FAILED,
                "error_message": "Failed to download video"
            }).eq("id", video_source_id).execute()
            return
        
        try:
            # Step B: Extract locations with Gemini
            print("Extracting locations with Gemini...")
            extracted_locations = await extract_locations_from_video(video_path)
            
            if not extracted_locations:
                supabase.table("video_sources").update({"status": VideoStatus.DONE}).eq("id", video_source_id).execute()
                # Clean up video file since we are done, even if empty results
                await cleanup_video_file(video_path)
                return
            
            # Step C: Lightweight Google Maps search for each location
            print(f"Searching Google Maps for {len(extracted_locations)} locations...")
            locations_to_insert = []
            
            for loc_data in extracted_locations:
                name = loc_data.get("name", "").strip()
                city_context = loc_data.get("city_context", "").strip()
                category = loc_data.get("category", "other").strip()
                
                if not name:
                    continue
                
                # Skip Google Maps search (Zero-Cost flow)
                # maps_result = await find_place_basic(name, city_context)
                
                # Prepare Location record
                new_location = {
                    "id": str(uuid.uuid4()),
                    "video_source_id": video_source_id,
                    "raw_name": name,
                    "city": loc_data.get("city"),
                    "country": loc_data.get("country"),
                    "context_location": city_context if city_context else None,
                    "category": category,
                    "summary": loc_data.get("summary"),  # Save the summary!
                    "google_place_id": None, # Zero-cost: fetching this later
                    "lat": None,
                    "lng": None,
                    "details_fetched": False
                }
                locations_to_insert.append(new_location)
                
            if locations_to_insert:
                supabase.table("locations").insert(locations_to_insert).execute()
            
            # Update status to done
            supabase.table("video_sources").update({"status": VideoStatus.DONE}).eq("id", video_source_id).execute()
            
            print(f"Successfully processed video. Created {len(locations_to_insert)} locations.")
            
            # SUCCESS! Clean up video file
            await cleanup_video_file(video_path)
            
        except Exception as e:
            # Processing failed (Gemini or Maps)
            # DO NOT cleanup video file, so we can retry without re-downloading
            logger.error(f"Error processing video step B/C: {e}")
            raise e
            
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        supabase.table("video_sources").update({
            "status": VideoStatus.FAILED,
            "error_message": str(e)
        }).eq("id", video_source_id).execute()
        # We don't raise here to avoid crashing the background task runner loop, just log
