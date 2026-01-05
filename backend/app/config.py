from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    supabase_url: str
    supabase_key: str
    
    # Google APIs
    gemini_api_key: str
    google_maps_api_key: Optional[str] = None
    
    # Optional: RapidAPI
    rapidapi_key: Optional[str] = None
    rapidapi_host: Optional[str] = "instagram-scraper-api.p.rapidapi.com"
    
    # App Settings
    environment: str = "development"
    log_level: str = "INFO"
    
    # File paths
    temp_video_dir: str = "./temp"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

