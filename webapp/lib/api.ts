import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Location {
    id: string;
    raw_name: string;
    city?: string;
    country?: string;
    context_location?: string;
    category?: string;
    summary?: string;
    google_place_id?: string;
    details_fetched: boolean;
    lat?: number;
    lng?: number;
    rating?: number;
    photo_ref?: string;
    address?: string;
    opening_hours?: string;
    price_level?: number;
}

export interface VideoSource {
    id: string;
    original_url: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    error_message?: string;
    is_cached?: boolean;
    created_at?: string;
    locations?: Location[];
}

export interface TripResponse {
    video_source: VideoSource;
    locations: Location[];
}

export const processVideo = async (url: string): Promise<VideoSource> => {
    const response = await api.post('/process', { original_url: url });
    return response.data;
};

export const getTrip = async (videoId: string): Promise<TripResponse> => {
    const response = await api.get(`/trips/${videoId}`);
    return response.data;
};

export const pinLocation = async (locationId: string): Promise<Location> => {
    const response = await api.post(`/location/${locationId}/pin`);
    return response.data;
};

export const enrichLocation = async (locationId: string): Promise<Location> => {
    const response = await api.get(`/location/${locationId}/enrich`);
    return response.data;
};

export const updateLocation = async (locationId: string, lat: number, lng: number): Promise<Location> => {
    const response = await api.patch(`/location/${locationId}`, { lat, lng });
    return response.data;
};
