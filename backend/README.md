# WanderLog Backend

FastAPI backend for the WanderLog travel utility app.

## Setup

1. Install Poetry:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
poetry install
```

3. Create `.env` file with your configuration:
```bash
# Database (Supabase)
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
# Or use transaction pooler (port 6543):
# DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres

# Google APIs
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: RapidAPI for Instagram (prioritized over yt-dlp if provided)
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=instagram-scraper-api.p.rapidapi.com

# App Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Note:** The database connection automatically handles Supabase URLs (including transaction poolers on port 6543).

4. Set up Supabase database:
   - Create a new Supabase project
   - Enable PostGIS extension in the SQL editor:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```

5. Run Alembic migrations:
```bash
poetry run alembic upgrade head
```

6. Start the server:
```bash
poetry run uvicorn app.main:app --reload
```

## API Endpoints

- `POST /process` - Process an Instagram Reel URL
- `GET /trips/{video_id}` - Get all locations for a video
- `GET /location/{location_id}/enrich` - Fetch expensive details for a location (lazy loading)
- `GET /health` - Health check

## Cost Strategy

The app uses a lazy loading strategy to save costs:
- Initial processing only fetches `place_id` and `geometry` (cheap/free)
- Expensive details (photos, reviews, opening hours) are only fetched when user clicks a location via `/location/{id}/enrich`

