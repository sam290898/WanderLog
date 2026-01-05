"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '@/lib/api';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, Utensils, Mountain, Landmark, Camera, Coffee, ShoppingBag } from 'lucide-react';

interface LeafletMapProps {
    locations: Location[];
    selectedLocationId?: string;
    onLocationSelect: (id: string) => void;
}

// Fix Leaflet Icons (run once)
// We check window to be safe, though this component is client-only now
if (typeof window !== 'undefined') {
    // @ts-expect-error - private property
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Helper to get icon for category
const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
        case 'food': return <Utensils className="w-5 h-5 text-white" />;
        case 'nature': return <Mountain className="w-5 h-5 text-white" />;
        case 'landmark': return <Landmark className="w-5 h-5 text-white" />;
        case 'cafe': return <Coffee className="w-5 h-5 text-white" />;
        case 'shop': return <ShoppingBag className="w-5 h-5 text-white" />;
        default: return <MapPin className="w-5 h-5 text-white" />;
    }
}

// Helper to get color for category
const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
        case 'food': return 'bg-orange-500';
        case 'nature': return 'bg-green-500';
        case 'landmark': return 'bg-blue-500';
        case 'cafe': return 'bg-amber-700';
        case 'shop': return 'bg-pink-500';
        default: return 'bg-indigo-500';
    }
}

// Controller Component (Must be child of MapContainer)
const MapController = ({ selectedLocationId, locations }: { selectedLocationId?: string, locations: Location[] }) => {
    const map = useMap(); // Correctly used as a Hook now!

    useEffect(() => {
        if (!map) return;

        // 1. Handle "Fly To" Selection
        if (selectedLocationId) {
            const loc = locations.find(l => l.id === selectedLocationId);
            if (loc && loc.lat && loc.lng) {
                map.flyTo([loc.lat, loc.lng], 16, {
                    animate: true,
                    duration: 1.5
                });
            }
        }

        // 2. Initial Bounds Fit (only if no selection)
        const valid = locations.filter(l => l.lat && l.lng);
        if (valid.length > 0 && !selectedLocationId) {
            const bounds = L.latLngBounds(valid.map(l => [l.lat!, l.lng!]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [selectedLocationId, locations, map]);

    return null;
}

export default function LeafletMap({ locations, selectedLocationId, onLocationSelect }: LeafletMapProps) {
    // Standard Leaflet render
    // Since this file is loaded dynamically with ssr: false, we don't need 'isMounted' checks for import handling

    const validLocations = useMemo(() => locations.filter(l => l.lat && l.lng), [locations]);

    // Create Custom Icon
    const createCustomIcon = (loc: Location) => {
        const iconMarkup = renderToStaticMarkup(
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 border-white ${getCategoryColor(loc.category)} transform transition-transform hover:scale-110`}>
                {getCategoryIcon(loc.category)}
            </div>
        );

        return L.divIcon({
            html: iconMarkup,
            className: '', // Remove default class to allow our custom tailwind
            iconSize: [40, 40],
            iconAnchor: [20, 40], // center bottom
            popupAnchor: [0, -42]
        });
    };

    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={true}
            className="w-full h-full rounded-xl overflow-hidden shadow-2xl z-0"
            style={{ width: '100%', height: '100%', background: '#aad3df' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapController selectedLocationId={selectedLocationId} locations={validLocations} />

            {validLocations.map(loc => (
                <Marker
                    key={loc.id}
                    position={[loc.lat!, loc.lng!]}
                    icon={createCustomIcon(loc)}
                    eventHandlers={{
                        click: () => onLocationSelect(loc.id),
                    }}
                >
                    <Popup className="glass-popup-clean" closeButton={false} offset={[0, 4]}>
                        <div className="w-64 p-0 rounded-lg overflow-hidden font-sans">
                            {/* Header Image Placeholder */}
                            <div className={`h-24 ${getCategoryColor(loc.category)} flex items-center justify-center relative`}>
                                {getCategoryIcon(loc.category)}
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>

                            {/* Content */}
                            <div className="p-4 bg-white">
                                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-gray-900">{loc.raw_name}</h3>
                                <div className="flex items-center text-xs text-gray-500 mb-3">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {loc.city ? `${loc.city}, ` : ''}{loc.country}
                                </div>

                                {loc.summary && (
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {loc.summary}
                                    </p>
                                )}

                                <div className="mt-3 flex gap-2">
                                    <span className={`text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide font-medium`}>
                                        {loc.category || 'Place'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
