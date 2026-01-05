from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class VideoSourceCreate(BaseModel):
    original_url: str


class VideoSourceResponse(BaseModel):
    id: UUID
    original_url: str
    status: str
    created_at: str
    error_message: Optional[str] = None
    is_duplicate: bool = False
    is_cached: bool = False
    locations: Optional[List['LocationResponse']] = None
    
    class Config:
        from_attributes = True


class LocationResponse(BaseModel):
    id: UUID
    raw_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    context_location: Optional[str]
    category: Optional[str]
    summary: Optional[str] = None
    google_place_id: Optional[str]
    details_fetched: bool
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: Optional[float]
    photo_ref: Optional[str]
    address: Optional[str]
    opening_hours: Optional[str]
    price_level: Optional[int]
    
    class Config:
        from_attributes = True


class LocationUpdate(BaseModel):
    lat: float
    lng: float


class TripResponse(BaseModel):
    video_source: VideoSourceResponse
    locations: List[LocationResponse]


class EnrichLocationResponse(BaseModel):
    id: UUID
    raw_name: str
    context_location: Optional[str]
    category: Optional[str]
    google_place_id: Optional[str]
    details_fetched: bool
    lat: Optional[float]
    lng: Optional[float]
    rating: Optional[float]
    photo_ref: Optional[str]
    address: Optional[str]
    opening_hours: Optional[str]
    price_level: Optional[int]
    
    class Config:
        from_attributes = True
