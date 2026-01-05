"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Location } from '@/lib/api';

interface MapViewProps {
    locations: Location[];
    selectedLocationId?: string;
    onLocationSelect: (id: string) => void;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function InternalMap({ locations, selectedLocationId, onLocationSelect }: MapViewProps) {
    const map = useMap();
    const validLocations = useMemo(() => locations.filter(l => l.lat && l.lng), [locations]);

    // Fit bounds when locations change
    useEffect(() => {
        if (map && validLocations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            validLocations.forEach(loc => {
                if (loc.lat && loc.lng) bounds.extend({ lat: loc.lat, lng: loc.lng });
            });
            map.fitBounds(bounds);

            const listener = google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom()! > 15) map.setZoom(15);
                google.maps.event.removeListener(listener);
            });
        }
    }, [map, validLocations]);

    // Pan to selected
    useEffect(() => {
        if (map && selectedLocationId) {
            const loc = validLocations.find(l => l.id === selectedLocationId);
            if (loc && loc.lat && loc.lng) {
                map.panTo({ lat: loc.lat, lng: loc.lng });
                map.setZoom(16);
            }
        }
    }, [map, selectedLocationId, validLocations]);

    return (
        <Map
            mapId="wanderlog-map"
            defaultCenter={{ lat: 20, lng: 0 }}
            defaultZoom={2}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            className="w-full h-full rounded-xl overflow-hidden shadow-2xl"
            styles={[
                {
                    "elementType": "geometry",
                    "stylers": [{ "color": "#242f3e" }]
                },
                {
                    "elementType": "labels.text.stroke",
                    "stylers": [{ "color": "#242f3e" }]
                },
                {
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#746855" }]
                },
                {
                    "featureType": "administrative.locality",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#d59563" }]
                },
                {
                    "featureType": "poi",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#d59563" }]
                },
                {
                    "featureType": "poi.park",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#263c3f" }]
                },
                {
                    "featureType": "poi.park",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#6b9a76" }]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#38414e" }]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.stroke",
                    "stylers": [{ "color": "#212a37" }]
                },
                {
                    "featureType": "road",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#9ca5b3" }]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#746855" }]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.stroke",
                    "stylers": [{ "color": "#1f2835" }]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#f3d19c" }]
                },
                {
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#17263c" }]
                },
                {
                    "featureType": "water",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#515c6d" }]
                },
                {
                    "featureType": "water",
                    "elementType": "labels.text.stroke",
                    "stylers": [{ "color": "#17263c" }]
                }
            ]}
        >
            {validLocations.map((loc) => (
                <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat!, lng: loc.lng! }}
                    onClick={() => onLocationSelect(loc.id)}
                    zIndex={selectedLocationId === loc.id ? 10 : 1}
                >
                    <Pin
                        background={selectedLocationId === loc.id ? '#6366f1' : '#e0e7ff'}
                        borderColor={selectedLocationId === loc.id ? '#4338ca' : '#a5b4fc'}
                        glyphColor={selectedLocationId === loc.id ? '#ffffff' : '#3730a3'}
                    />
                </AdvancedMarker>
            ))}
        </Map>
    );
}

export default function MapView(props: MapViewProps) {
    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <InternalMap {...props} />
        </APIProvider>
    );
}
