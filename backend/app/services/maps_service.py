import googlemaps
from typing import Optional, Dict, Any
from app.config import settings


# Initialize Google Maps client
gmaps = googlemaps.Client(key=settings.google_maps_api_key)


async def find_place_basic(name: str, city_context: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Step C: Lightweight search using Google Maps "Find Place" API.
    Only requests place_id and geometry (cheaper/free).
    
    Returns:
        Dict with place_id and geometry, or None if not found
    """
    try:
        # Build search query
        query = name
        if city_context:
            query = f"{name}, {city_context}"
        
        # Find Place API - only request place_id and geometry
        result = gmaps.find_place(
            input=query,
            input_type="textquery",
            fields=["place_id", "geometry"]
        )
        
        if result.get("status") == "OK" and result.get("candidates"):
            candidate = result["candidates"][0]
            geometry = candidate.get("geometry", {})
            location = geometry.get("location", {})
            
            return {
                "place_id": candidate.get("place_id"),
                "lat": location.get("lat"),
                "lng": location.get("lng")
            }
        
        return None
        
    except Exception as e:
        print(f"Error finding place: {e}")
        return None


async def get_place_details(place_id: str) -> Optional[Dict[str, Any]]:
    """
    Get full place details from Google Places API.
    This is the expensive call - only use when user clicks!
    
    Returns:
        Dict with full place details including photos, reviews, etc.
    """
    try:
        result = gmaps.place(
            place_id=place_id,
            fields=[
                "name",
                "formatted_address",
                "geometry",
                "rating",
                "photos",
                "opening_hours",
                "price_level",
                "types"
            ]
        )
        
        if result.get("status") == "OK":
            place = result.get("result", {})
            geometry = place.get("geometry", {})
            location = geometry.get("location", {})
            
            # Get first photo reference if available
            photo_ref = None
            photos = place.get("photos", [])
            if photos:
                photo_ref = photos[0].get("photo_reference")
            
            # Format opening hours
            opening_hours = None
            if "opening_hours" in place:
                opening_hours = place.get("opening_hours", {})
            
            return {
                "name": place.get("name"),
                "address": place.get("formatted_address"),
                "lat": location.get("lat"),
                "lng": location.get("lng"),
                "rating": place.get("rating"),
                "photo_ref": photo_ref,
                "opening_hours": opening_hours,
                "price_level": place.get("price_level"),
                "types": place.get("types", [])
            }
        
        return None
        
    except Exception as e:
        print(f"Error getting place details: {e}")
        return None


async def get_coordinates(name: str, city_context: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Step C: Targeted coordinate fetch. Call this only when user pins a location.
    Uses 'Find Place' API with minimal fields to minimize cost.
    """
    return await find_place_basic(name, city_context)
