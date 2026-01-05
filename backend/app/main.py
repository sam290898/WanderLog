from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import List
from uuid import UUID
from uuid import UUID
import uuid
import logging
import json
from urllib.parse import urlparse, urlunparse

from app.supabase_client import supabase
from app.models import VideoStatus  # Keep enums if possible, or move to schemas/constants
from app.schemas import (
    VideoSourceCreate,
    VideoSourceResponse,
    TripResponse,
    LocationResponse,
    EnrichLocationResponse,
    LocationUpdate
)
from app.services.processor import process_video_source
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WanderLog API", version="0.1.0")

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Database schema is managed by Supabase
    pass



def clean_instagram_url(url: str) -> str:
    """
    Removes query parameters from Instagram URLs to prevent duplicates.
    Example: https://www.instagram.com/reel/C5.../?igsh=... -> https://www.instagram.com/reel/C5.../
    """
    parsed = urlparse(url)
    # Reconstruct URL without query (params) or fragment
    clean_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
    
    # Remove trailing slash if present
    if clean_url.endswith('/'):
        clean_url = clean_url[:-1]
        
    return clean_url


async def process_video_background(video_source_id: str):
    """Background task wrapper that fetches data via Supabase client."""
    try:
        response = supabase.table("video_sources").select("*").eq("id", video_source_id).execute()
        if response.data:
            # We need to pass the raw dict or a Pydantic model to the processor
            # The current processor expects a SQLAlchemy model. We need to refactor it.
            # For now, let's assume we pass the ID and let the processor fetch what it needs
            # or we refactor the processor to take the client.
            # Best approach: Refactor processor to take ID and use Supabase client internally.
            await process_video_source(video_source_id)
    except Exception as e:
        logger.error(f"Error in background task: {e}")


@app.post("/process", response_model=VideoSourceResponse)
async def process_video(
    video_data: VideoSourceCreate,
    background_tasks: BackgroundTasks
):
    """
    Accepts Instagram Reel URL and starts background processing.
    """
    try:
        # Clean the URL to remove query parameters (deduplication)
        clean_url = clean_instagram_url(video_data.original_url)
        logger.info(f"Processing request for URL: {clean_url} (Original: {video_data.original_url})")
        
        # Check if URL already exists
        response = supabase.table("video_sources").select("*").eq("original_url", clean_url).execute()
        existing = response.data[0] if response.data else None
        
        if existing:
            # Scenario A: Found & Status='done' (Cached)
            if existing.get("status") == "done":
                logger.info(f"Using cached video: {existing['id']}")
                
                # Fetch existing locations
                loc_response = supabase.table("locations").select("*").eq("video_source_id", existing['id']).execute()
                locations = loc_response.data if loc_response.data else []
                
                existing['is_cached'] = True
                existing['locations'] = [LocationResponse.model_validate(loc) for loc in locations]
                
                return VideoSourceResponse.model_validate(existing)

            # Retry logic for failed videos
            if existing.get("status") == "failed":
                logger.info(f"Retrying failed video: {existing['id']}")
                
                # Reset status to pending
                supabase.table("video_sources").update({
                    "status": "pending", 
                    "error_message": None
                }).eq("id", existing['id']).execute()
                
                # Trigger background task again
                background_tasks.add_task(process_video_background, existing['id'])
                
                # Return updated response
                existing['status'] = 'pending'
                existing['error_message'] = None
                return VideoSourceResponse.model_validate(existing)
            
            # Pending/Processing
            existing['is_duplicate'] = True
            return VideoSourceResponse.model_validate(existing)
        
        # Create new video source
        new_video = {
            "id": str(uuid.uuid4()),
            "original_url": clean_url,
            "status": "pending", # Use string directly or enum.value
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        insert_response = supabase.table("video_sources").insert(new_video).execute()
        video_source = insert_response.data[0]
        
        # Start background processing with video source ID
        background_tasks.add_task(process_video_background, video_source['id'])
        
        return VideoSourceResponse.model_validate(video_source)

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trips/{video_id}", response_model=TripResponse)
async def get_trip(video_id: str):
    """
    Returns all locations for a video source.
    """
    # Get video source
    video_response = supabase.table("video_sources").select("*").eq("id", video_id).execute()
    video_source = video_response.data[0] if video_response.data else None
    
    if not video_source:
        raise HTTPException(status_code=404, detail="Video source not found")
    
    # Get locations
    loc_response = supabase.table("locations").select("*").eq("video_source_id", video_id).execute()
    locations = loc_response.data if loc_response.data else []
    
    return TripResponse(
        video_source=VideoSourceResponse.model_validate(video_source),
        locations=[LocationResponse.model_validate(loc) for loc in locations]
    )


@app.patch("/location/{location_id}", response_model=LocationResponse)
async def update_location_coords(location_id: str, coords: LocationUpdate):
    """
    Updates a location's coordinates (from Client-side Geocoding).
    """
    # Verify location exists
    response = supabase.table("locations").select("*").eq("id", location_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Location not found")
        
    # Update
    update_data = {
        "lat": coords.lat,
        "lng": coords.lng
    }
    
    update_response = supabase.table("locations").update(update_data).eq("id", location_id).execute()
    updated_location = update_response.data[0]
    
    return LocationResponse.model_validate(updated_location)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

