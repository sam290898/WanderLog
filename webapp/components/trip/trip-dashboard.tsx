"use client";

import { useEffect, useState, useRef } from 'react';
import { updateLocation } from '@/lib/api'; // Removed Google Maps specific calls
import { useTrip } from '@/hooks/use-trip';
// Dynamic import to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import('@/components/map/leaflet-map'), { ssr: false, loading: () => <div className="w-full h-full bg-neutral-900 animate-pulse rounded-xl" /> });
import LocationList from '@/components/trip/location-list';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Hook for sequential geocoding
// Used custom here instead of separate file for simplicity
function useGeocodingQueue(locations: any[], mutate: any) {
    const processingRef = useRef(new Set<string>());

    useEffect(() => {
        if (!locations) return;

        const processQueue = async () => {
            const missingCoords = locations.filter(l => !l.lat && !l.lng && !processingRef.current.has(l.id));

            for (const loc of missingCoords) {
                processingRef.current.add(loc.id);

                try {
                    // 1.2s delay for rate limiting
                    await new Promise(r => setTimeout(r, 1200));

                    // Construct search query
                    const query = `${loc.raw_name}, ${loc.city || ''} ${loc.country || ''}`;
                    console.log(`Geocoding: ${query}`);

                    // Helper: search
                    const search = async (q: string) => {
                        const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                            params: { q, format: 'json', limit: 1 }
                        });
                        return res.data[0];
                    }

                    let result = await search(query);

                    // Fallback: try just raw name if failed
                    if (!result && loc.city) {
                        result = await search(`${loc.raw_name} ${loc.city}`);
                    }
                    // Fallback: just raw name
                    if (!result) {
                        result = await search(loc.raw_name);
                    }

                    if (result) {
                        await updateLocation(loc.id, parseFloat(result.lat), parseFloat(result.lon));
                        mutate(); // Refresh UI
                    }

                } catch (e) {
                    console.error("Geocoding failed for", loc.raw_name, e);
                }
            }
        };

        processQueue();

    }, [locations, mutate]);
}

export default function TripDashboard({ id }: { id: string }) {
    const router = useRouter();
    const { trip, isLoading, isError, mutate } = useTrip(id);
    const [selectedLocationId, setSelectedLocationId] = useState<string>();

    // Start the queue
    useGeocodingQueue(trip?.locations || [], mutate);

    const handleSelect = async (locationId: string) => {
        setSelectedLocationId(locationId);
    };

    const handlePin = (id: string) => {
        // With the new auto-queue, this might just mean "move to it" or "prioritize it"
        // For now, let's just select it, assuming the queue picks it up eventually
        handleSelect(id);
    }

    if (isLoading || (trip && trip.video_source.status !== 'done' && trip.video_source.status !== 'failed')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Planning your trip...</h2>
                    <p className="text-muted-foreground">AI is watching the video and extracting locations.</p>
                    {trip?.video_source.status === 'processing' && (
                        <p className="text-sm text-indigo-400">Processing video...</p>
                    )}
                </div>
            </div>
        );
    }

    if (isError || trip?.video_source.status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <h2 className="text-xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground">{trip?.video_source.error_message || "Could not load trip."}</p>
                <Button onClick={() => router.push('/')}>Go Back Home</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar - List */}
            <div className="w-[400px] flex-shrink-0 h-full overflow-y-auto border-r border-border bg-card/50 backdrop-blur-sm z-10 hidden md:block">
                <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10 transition-all duration-300">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="mb-2 -ml-2 text-muted-foreground">← Back</Button>
                    <h1 className="text-xl font-bold truncate">Trip Itinerary</h1>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <p>{trip?.locations.length} locations found</p>
                        {trip?.locations.some(l => !l.lat) && (
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Finding spots...</span>
                            </div>
                        )}
                    </div>
                </div>
                <LocationList
                    locations={trip?.locations || []}
                    onSelect={handleSelect}
                    onPin={handlePin}
                    selectedId={selectedLocationId}
                />
            </div>

            {/* Main Content - Map */}
            <div className="flex-1 relative h-full">
                <LeafletMap
                    locations={trip?.locations || []}
                    selectedLocationId={selectedLocationId}
                    onLocationSelect={handleSelect}
                />
            </div>
        </div>
    );
}
