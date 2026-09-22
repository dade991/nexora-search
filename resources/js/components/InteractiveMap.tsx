import React, { useState } from 'react';
import { LocationItem } from '@/types';

interface InteractiveMapProps {
    places: LocationItem[];
    selectedPlace: LocationItem | null;
    onSelectPlace: (place: LocationItem) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
    places,
    selectedPlace,
    onSelectPlace,
}) => {
    const [hoveredPlace, setHoveredPlace] = useState<LocationItem | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Normalize coordinates for 2D radar plane projection
    const minLat = -40;
    const maxLat = 60;
    const minLng = -125;
    const maxLng = 155;

    const getMapCoords = (lat: number, lng: number) => {
        const x = ((lng - minLng) / (maxLng - minLng)) * 88 + 6;
        const y = ((maxLat - lat) / (maxLat - minLat)) * 76 + 12;
        return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)) };
    };

    return (
        <div className="relative h-full min-h-[460px] w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl dark:border-slate-800">
            {/* Map Grid Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>

            {/* Simulated World Continent Outlines (SVG) */}
            <svg
                viewBox="0 0 100 60"
                className="absolute inset-0 h-full w-full stroke-slate-800/80 fill-slate-800/20 stroke-[0.4] pointer-events-none"
                preserveAspectRatio="none"
            >
                {/* North America */}
                <path d="M12,12 Q20,10 28,18 Q30,26 24,34 Q18,30 14,24 Z" />
                {/* South America */}
                <path d="M26,38 Q32,40 30,52 Q24,54 22,44 Z" />
                {/* Europe */}
                <path d="M46,14 Q54,12 56,22 Q48,24 45,18 Z" />
                {/* Africa */}
                <path d="M46,26 Q58,28 54,46 Q46,44 44,32 Z" />
                {/* Asia */}
                <path d="M58,12 Q80,10 82,28 Q70,36 60,26 Z" />
                {/* Australia */}
                <path d="M74,40 Q84,42 82,50 Q72,52 70,44 Z" />
            </svg>

            {/* Header / Map Telemetry Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-slate-950/80 backdrop-blur-md px-3 py-1.5 border border-slate-700/60 shadow-lg">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold tracking-wide uppercase text-slate-200">
                    Live Geocoding Radar
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                    {places.length} Nodes Plotted
                </span>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 rounded-xl bg-slate-950/80 backdrop-blur-md p-1 border border-slate-700/60 shadow-lg">
                <button
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.2, 2))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition"
                    title="Zoom In"
                >
                    <span className="text-base font-bold">+</span>
                </button>
                <button
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 0.2, 0.8))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition"
                    title="Zoom Out"
                >
                    <span className="text-base font-bold">-</span>
                </button>
            </div>

            {/* Map Markers Plane */}
            <div
                className="relative h-full w-full transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
            >
                {places.map((place) => {
                    const { x, y } = getMapCoords(place.latitude, place.longitude);
                    const isSelected = selectedPlace?.id === place.id;
                    const isHovered = hoveredPlace?.id === place.id;

                    return (
                        <div
                            key={place.id}
                            style={{ left: `${x}%`, top: `${y}%` }}
                            onMouseEnter={() => setHoveredPlace(place)}
                            onMouseLeave={() => setHoveredPlace(null)}
                            onClick={() => onSelectPlace(place)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                        >
                            {/* Pin Node Pulse */}
                            <div className="relative flex items-center justify-center">
                                {(isSelected || isHovered) && (
                                    <span className="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping"></span>
                                )}
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform duration-200 group-hover:scale-125 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-400/30'
                                            : 'bg-slate-900 text-blue-400 ring-2 ring-blue-500/50'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Hover Tooltip Popup */}
                            {(isHovered || isSelected) && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md z-30 pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        {place.photos && place.photos[0] && (
                                            <img
                                                src={place.photos[0]}
                                                alt={place.name}
                                                className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-white truncate">{place.name}</p>
                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                <span className="font-semibold text-amber-400">★ {place.rating}</span>
                                                <span className="text-slate-400 capitalize">• {place.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Mapbox Proxy Badge */}
            <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700/60">
                        EPSG:4326 WGS84
                    </span>
                    <span className="hidden sm:inline">Normalized via Mapbox & Google Places Service</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                    Click pin to view live weather & details
                </span>
            </div>
        </div>
    );
};
