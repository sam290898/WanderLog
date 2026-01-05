from supabase import create_client, Client
from app.config import settings

def init_supabase() -> Client:
    url = settings.supabase_url.strip()
    key = settings.supabase_key.strip()
    return create_client(url, key)

supabase: Client = init_supabase()
