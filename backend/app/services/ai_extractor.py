import json
import os
import time
import google.generativeai as genai
from typing import List, Dict, Optional
from app.config import settings


# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


async def extract_locations_from_video(video_path: str) -> List[Dict[str, str]]:
    """
    Step B: Use Gemini 1.5 Flash to analyze video and extract locations.
    
    Returns:
        List of dicts with keys: name, city_context, category
    """
    try:
        # Step 1: Upload video file to Gemini
        print(f"Uploading video to Gemini: {video_path}")
        uploaded_file = genai.upload_file(path=video_path)
        
        # Step 2: Wait for file to be processed (polling)
        print("Waiting for file to be processed...")
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_file = genai.get_file(uploaded_file.name)
        
        if uploaded_file.state.name != "ACTIVE":
            raise Exception(f"File processing failed. State: {uploaded_file.state.name}")
        
        print("File is active, generating content...")
        
        # Step 3: Create model and generate content
        model = genai.GenerativeModel('gemini-2.0-flash')
        

        prompt = """Analyze this video carefully. Watch the visuals and listen to the audio.

Identify every physical location, restaurant, hotel, tourist spot, or place of interest that is:
1. Mentioned in the audio/narration
2. Shown in visual text (signs, captions, etc.)
3. Clearly displayed or discussed

IMPORTANT:
- Ignore generic terms like "the beach", "the city", "downtown" unless they refer to a specific named place
- Focus on specific named locations (e.g., "Joe's Pizza", "Empire State Building", "Hotel Plaza")
- Include the city/region context if mentioned (e.g., "Brooklyn, NY", "Paris, France")

For each place, generate a field called `summary`: an ultra-short set of bullet points (max 2-3) describing its vibe, history, or popularity.
Do NOT try to find coordinates or addresses.

Return a JSON array with this exact structure:
[
  {
    "name": "Specific place name",
    "city": "City name only (e.g. Paris)",
    "country": "Country name only (e.g. France)",
    "category": "restaurant" | "hotel" | "tourist_spot" | "attraction" | "other",
    "summary": "- Historic cafe\\n- Famous for croissants"
  }
]

If no locations are found, return an empty array: []

Return ONLY valid JSON, no markdown, no code blocks, no explanations."""

        response = model.generate_content([uploaded_file, prompt])
        
        # Step 4: Parse response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        # Parse JSON
        locations = json.loads(response_text)
        
        if not isinstance(locations, list):
            raise ValueError("Response is not a list")
        
        # Step 5: Clean up uploaded file
        try:
            genai.delete_file(uploaded_file.name)
        except:
            pass
        
        print(f"Extracted {len(locations)} locations from video")
        return locations
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Response text: {response_text}")
        return []
    except Exception as e:
        print(f"Error extracting locations: {e}")
        raise


async def cleanup_video_file(video_path: str):
    """Clean up temporary video file."""
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
            print(f"Cleaned up video file: {video_path}")
    except Exception as e:
        print(f"Error cleaning up video file: {e}")

