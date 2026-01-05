"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Navigation, Info } from "lucide-react";
import { Location } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LocationListProps {
    locations: Location[];
    onSelect: (id: string) => void;
    onPin: (id: string) => void;
    selectedId?: string;
}

export default function LocationList({ locations, onSelect, onPin, selectedId }: LocationListProps) {
    return (
        <div className="space-y-4 p-4 pb-20">
            {locations.map((loc, index) => (
                <motion.div
                    key={loc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card
                        className={cn(
                            "cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30 overflow-hidden",
                            selectedId === loc.id ? "border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-50/5 dark:bg-indigo-950/20" : ""
                        )}
                        onClick={() => onSelect(loc.id)}
                    >
                        <CardContent className="p-0">
                            {loc.photo_ref && loc.details_fetched && (
                                <div className="h-48 w-full overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                    {/* Placeholder for image */}
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600">
                                        <MapPin className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="absolute bottom-3 left-4 z-20">
                                        <h3 className="text-white font-bold text-lg drop-shadow-md">{loc.raw_name}</h3>
                                        <div className="flex items-center text-indigo-200 text-sm">
                                            <Star className="w-3 h-3 fill-indigo-400 text-indigo-400 mr-1" />
                                            {loc.rating || "N/A"} • {loc.address?.split(',')[0]}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4">
                                {!loc.details_fetched && (
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{loc.raw_name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{loc.context_location || loc.summary || "No description available."}</p>
                                        </div>
                                    </div>
                                )}

                                {loc.details_fetched && !loc.photo_ref && (
                                    <div>
                                        <h3 className="font-semibold text-lg">{loc.raw_name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{loc.address}</p>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    {!loc.lat && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPin(loc.id);
                                            }}
                                        >
                                            <MapPin className="w-4 h-4 mr-2" /> Show on Map
                                        </Button>
                                    )}
                                    {loc.lat && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(loc.id);
                                            }}
                                        >
                                            <Navigation className="w-4 h-4 mr-2" /> Fly to
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
