# WanderLog

A travel utility app that combats the "Save for Later" graveyard by extracting locations from Instagram Reels using AI.

## Project Structure

```
wanderlog/
├── backend/          # FastAPI backend (Python)
│   ├── app/
│   │   ├── models.py          # Database models
│   │   ├── main.py            # FastAPI app & Endpoints
│   │   └── services/
│   │       ├── ai_extractor.py    # Gemini AI integration
│   │       ├── maps_service.py    # Google Maps integration
│   │       └── processor.py       # Main processing logic
│   └── alembic/      # Database migrations
│
└── webapp/           # Next.js Frontend (TypeScript)
    ├── app/
    │   ├── page.tsx          # Landing page
    │   └── trip/[id]/        # Trip Dashboard
    └── components/
        └── map/              # Google Maps integration
```

## Features

1. **AI-Powered Extraction**: Uses Google Gemini 1.5 Flash to analyze videos and extract locations/text.
2. **Cost-Efficient**: Only fetches expensive Google Maps details when required.
3. **Web Interface**: Premium Next.js dashboard with interactive maps.

## Setup

### Backend

1. Navigate to `backend/` directory.
2. Install dependencies: `poetry install` (or `pip install -r requirements.txt`).
3. Set up `.env` with API Keys (Gemini, Google Maps, Supabase).
4. Start server: `poetry run uvicorn app.main:app --reload`

### Frontend (Webapp)

1. Navigate to `webapp/` directory.
2. Install dependencies: `npm install`.
3. Start dev server: `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).

## Deployment

 See [DEPLOY.md](DEPLOY.md) for details on deploying to Vercel and Render.
