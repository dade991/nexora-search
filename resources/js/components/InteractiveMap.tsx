import React, { useEffect, useRef, useState } from 'react';
import {
    computeGoogleRoute,
    findGoogleAirports,
    getCurrentLocation,
    loadGoogleMaps,
    type Coordinates,
    type GoogleAirport,
    type GoogleRouteSummary,
    type TravelMode,
} from '@/lib/mapsApi';
import { isMapCenteredOnLocation } from '@/lib/mapLocation';
import type { LocationItem } from '@/types';

interface InteractiveMapProps {
    places: LocationItem[];
    selectedPlace: LocationItem | null;
    onSelectPlace: (place: LocationItem) => void;
}

type MapView = 'roadmap' | 'satellite' | 'hybrid' | 'terrain' | '3d';

const mapTypeFor = (view: MapView): string =>
    view === '3d' ? 'hybrid' : view;

const coordinatesFor = (place?: LocationItem | null): Coordinates | null => {
    const latitude = Number(place?.latitude);
    const longitude = Number(place?.longitude);

    return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : null;
};

const popupContent = (title: string, detail: string): HTMLDivElement => {
    const container = document.createElement('div');
    const heading = document.createElement('strong');
    const description = document.createElement('span');
    container.className = 'nexora-google-popup';
    heading.textContent = title;
    description.textContent = detail;
    container.append(heading, description);
    return container;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
    places,
    selectedPlace,
    onSelectPlace,
}) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const threeDContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<any>(null);
    const threeDMap = useRef<any>(null);
    const placeMarkers = useRef<any[]>([]);
    const airportMarkers = useRef<any[]>([]);
    const routeLine = useRef<any>(null);
    const locationMarker = useRef<any>(null);
    const userLocationRef = useRef<Coordinates | null>(null);
    const infoWindow = useRef<any>(null);
    const [view, setView] = useState<MapView>('roadmap');
    const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
    const [route, setRoute] = useState<GoogleRouteSummary | null>(null);
    const [airports, setAirports] = useState<GoogleAirport[]>([]);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [isCenteredOnUser, setIsCenteredOnUser] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showAirports, setShowAirports] = useState(false);
    const [showJourney, setShowJourney] = useState(false);

    const destination = selectedPlace ?? places[0] ?? null;
    const destinationCoordinates = coordinatesFor(destination);

    useEffect(() => {
        let disposed = false;
        let removeCenterListener: (() => void) | undefined;

        const initialise = async () => {
            try {
                const google = await loadGoogleMaps();
                const { Map, InfoWindow } =
                    await google.maps.importLibrary('maps');

                if (disposed || !mapContainer.current) {
                    return;
                }

                map.current = new Map(mapContainer.current, {
                    center: destinationCoordinates
                        ? {
                              lat: destinationCoordinates.latitude,
                              lng: destinationCoordinates.longitude,
                          }
                        : { lat: 9.082, lng: 8.6753 },
                    zoom: destinationCoordinates ? 14 : 6,
                    mapId: 'DEMO_MAP_ID',
                    mapTypeControl: false,
                    fullscreenControl: true,
                    streetViewControl: true,
                    zoomControl: true,
                    clickableIcons: true,
                    gestureHandling: 'greedy',
                    controlSize: 34,
                });
                const centerListener = map.current.addListener(
                    'center_changed',
                    () => {
                        const location = userLocationRef.current;
                        const center = map.current?.getCenter();

                        if (!location || !center) {
                            setIsCenteredOnUser(false);
                            return;
                        }

                        setIsCenteredOnUser(
                            isMapCenteredOnLocation(location, {
                                latitude: center.lat(),
                                longitude: center.lng(),
                            }),
                        );
                    },
                );
                removeCenterListener = () => centerListener.remove();
                infoWindow.current = new InfoWindow();
                setIsReady(true);
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : 'The map could not be loaded.',
                );
            }
        };

        void initialise();

        return () => {
            disposed = true;
            removeCenterListener?.();
            placeMarkers.current.forEach((marker) => marker.setMap?.(null));
            airportMarkers.current.forEach((marker) => marker.setMap?.(null));
        };
    }, []);

    useEffect(() => {
        if (!isReady || !map.current) {
            return;
        }

        let disposed = false;

        const renderPlaces = async () => {
            const google = await loadGoogleMaps();
            const { AdvancedMarkerElement, PinElement } =
                await google.maps.importLibrary('marker');

            if (disposed) {
                return;
            }

            placeMarkers.current.forEach((marker) => {
                marker.map = null;
            });
            placeMarkers.current = [];
            const bounds = new google.maps.LatLngBounds();

            places.forEach((place) => {
                const coordinates = coordinatesFor(place);
                if (!coordinates) {
                    return;
                }

                const position = {
                    lat: coordinates.latitude,
                    lng: coordinates.longitude,
                };
                const isSelected = destination?.id === place.id;
                const pin = new PinElement({
                    background: isSelected ? '#c45d18' : '#087f6b',
                    borderColor: '#ffffff',
                    glyphColor: '#ffffff',
                    scale: isSelected ? 1.2 : 1,
                });
                const marker = new AdvancedMarkerElement({
                    map: map.current,
                    position,
                    title: place.name,
                    gmpClickable: true,
                });
                marker.append(pin);
                marker.addEventListener('gmp-click', () => {
                    onSelectPlace(place);
                    infoWindow.current?.setContent(
                        popupContent(place.name, place.category ?? 'Place'),
                    );
                    infoWindow.current?.open({ map: map.current, anchor: marker });
                });
                placeMarkers.current.push(marker);
                bounds.extend(position);
            });

            if (places.length > 1 && !bounds.isEmpty()) {
                map.current.fitBounds(bounds, 72);
            } else if (destinationCoordinates) {
                map.current.panTo({
                    lat: destinationCoordinates.latitude,
                    lng: destinationCoordinates.longitude,
                });
                map.current.setZoom(15);
            }
        };

        void renderPlaces();

        return () => {
            disposed = true;
        };
    }, [destination?.id, isReady, onSelectPlace, places]);

    useEffect(() => {
        if (!isReady || !map.current) {
            return;
        }

        map.current.setMapTypeId(mapTypeFor(view));

        if (view !== '3d' || !threeDContainer.current) {
            if (threeDMap.current) {
                threeDMap.current.remove();
                threeDMap.current = null;
            }
            return;
        }

        let disposed = false;

        const render3D = async () => {
            const google = await loadGoogleMaps();
            const { Map3DElement } = await google.maps.importLibrary('maps3d');
            if (disposed || !threeDContainer.current) {
                return;
            }

            const center = destinationCoordinates ?? {
                latitude: 9.082,
                longitude: 8.6753,
            };
            const element = new Map3DElement({
                center: {
                    lat: center.latitude,
                    lng: center.longitude,
                    altitude: 350,
                },
                range: 1800,
                tilt: 67.5,
                heading: 20,
                mode: 'HYBRID',
            });
            element.className = 'h-full w-full';
            threeDContainer.current.replaceChildren(element);
            threeDMap.current = element;
        };

        void render3D();

        return () => {
            disposed = true;
        };
    }, [destination?.id, isReady, view]);

    const locateUser = async (): Promise<Coordinates> => {
        const google = await loadGoogleMaps();
        const coordinates = userLocation ?? (await getCurrentLocation());
        userLocationRef.current = coordinates;
        setUserLocation(coordinates);
        if (locationMarker.current) {
            locationMarker.current.map = null;
        }

        const { AdvancedMarkerElement } =
            await google.maps.importLibrary('marker');
        const locationDot = document.createElement('span');
        const locationDotCore = document.createElement('span');
        locationDot.setAttribute('aria-hidden', 'true');
        locationDot.className =
            'grid h-7 w-7 place-items-center rounded-full bg-blue-500/20';
        locationDotCore.className =
            'block h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.45)]';
        locationDot.append(locationDotCore);

        locationMarker.current = new AdvancedMarkerElement({
            map: map.current,
            position: {
                lat: coordinates.latitude,
                lng: coordinates.longitude,
            },
            title: 'Your location',
        });
        locationMarker.current.append(locationDot);
        return coordinates;
    };

    const handleLocate = async () => {
        setIsWorking(true);
        setMessage(null);
        try {
            const coordinates = await locateUser();
            map.current?.panTo({
                lat: coordinates.latitude,
                lng: coordinates.longitude,
            });
            map.current?.setZoom(15);
            setIsCenteredOnUser(true);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Your location is unavailable.',
            );
        } finally {
            setIsWorking(false);
        }
    };

    const handleRoute = async () => {
        if (!destinationCoordinates) {
            setMessage('Choose a place before requesting directions.');
            return;
        }

        setIsWorking(true);
        setMessage(null);
        try {
            const google = await loadGoogleMaps();
            const origin = await locateUser();
            const result = await computeGoogleRoute(
                origin,
                destinationCoordinates,
                travelMode,
            );
            routeLine.current?.setMap?.(null);
            routeLine.current = new google.maps.Polyline({
                map: map.current,
                path: result.path,
                strokeColor: '#2563eb',
                strokeOpacity: 0.95,
                strokeWeight: 6,
            });
            const bounds = new google.maps.LatLngBounds();
            result.path.forEach((point) => bounds.extend(point));
            map.current.fitBounds(bounds, 80);
            setRoute(result);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Directions are unavailable right now.',
            );
        } finally {
            setIsWorking(false);
        }
    };

    const handleAirports = async () => {
        if (!destinationCoordinates) {
            setMessage('Choose a place before finding nearby airports.');
            return;
        }

        if (showAirports) {
            airportMarkers.current.forEach((marker) => {
                marker.map = null;
            });
            airportMarkers.current = [];
            setAirports([]);
            setShowAirports(false);
            return;
        }

        setIsWorking(true);
        setMessage(null);
        try {
            const google = await loadGoogleMaps();
            const { AdvancedMarkerElement, PinElement } =
                await google.maps.importLibrary('marker');
            const results = await findGoogleAirports(destinationCoordinates);
            airportMarkers.current = results.map((airport) => {
                const pin = new PinElement({
                    glyphText: '✈',
                    background: '#10201e',
                    borderColor: '#ffffff',
                    glyphColor: '#e8c36a',
                });
                const marker = new AdvancedMarkerElement({
                    map: map.current,
                    position: airport.location,
                    title: airport.name,
                    gmpClickable: true,
                });
                marker.append(pin);
                marker.addEventListener('gmp-click', () => {
                    infoWindow.current?.setContent(
                        popupContent(airport.name, airport.address),
                    );
                    infoWindow.current?.open({ map: map.current, anchor: marker });
                });
                return marker;
            });
            setAirports(results);
            setShowAirports(true);
            if (!results.length) {
                setMessage('No airports were found within 50 km.');
            }
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Nearby airports are unavailable right now.',
            );
        } finally {
            setIsWorking(false);
        }
    };

    const openStreetView = () => {
        if (!destinationCoordinates || !map.current) {
            setMessage('Choose a place to open Street View.');
            return;
        }

        const panorama = map.current.getStreetView();
        panorama.setPosition({
            lat: destinationCoordinates.latitude,
            lng: destinationCoordinates.longitude,
        });
        panorama.setPov({ heading: 0, pitch: 0 });
        panorama.setVisible(true);
    };

    return (
        <section className="relative h-full min-h-[500px] w-full overflow-hidden rounded-[26px] bg-[#dfe7e4] shadow-[0_22px_70px_rgba(16,32,30,0.16)] dark:bg-[#13201d]">
            <div ref={mapContainer} className="absolute inset-0" />
            <div
                ref={threeDContainer}
                className={`absolute inset-0 bg-[#dfe7e4] dark:bg-[#13201d] ${view === '3d' ? 'z-[2]' : 'pointer-events-none opacity-0'}`}
            />

            {!isReady && !message && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-[#eef3f1] dark:bg-[#13201d]">
                    <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-[#52615e] shadow-lg dark:bg-[#10201e] dark:text-[#c8d5d1]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#087f6b] border-t-transparent" />
                        Opening the map
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-5rem)] gap-1 rounded-full bg-white/95 p-1 shadow-[0_8px_30px_rgba(16,32,30,0.16)] backdrop-blur dark:bg-[#10201e]/95">
                {(['roadmap', 'satellite', 'hybrid', 'terrain', '3d'] as MapView[]).map(
                    (option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setView(option)}
                            className={`rounded-full px-3 py-2 text-[11px] font-semibold capitalize transition ${
                                view === option
                                    ? 'bg-[#10201e] text-white dark:bg-[#e8c36a] dark:text-[#10201e]'
                                    : 'text-[#65736f] hover:bg-[#edf2f0] dark:text-[#b7c7c1] dark:hover:bg-white/10'
                            }`}
                        >
                            {option === '3d' ? '3D' : option}
                        </button>
                    ),
                )}
            </div>

            {view !== '3d' && (
                <button
                    type="button"
                    onClick={() => void handleLocate()}
                    disabled={isWorking || !isReady}
                    aria-label="Center map on my location"
                    aria-pressed={isCenteredOnUser}
                    title="Center on my location"
                    className={`absolute right-4 bottom-28 z-10 grid h-11 w-11 place-items-center rounded-full border shadow-[0_3px_12px_rgba(16,32,30,0.25)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60 ${
                        isCenteredOnUser
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-white/80 bg-white text-blue-600 hover:bg-blue-50 dark:border-white/15 dark:bg-[#10201e] dark:text-blue-400 dark:hover:bg-[#172522]'
                    }`}
                >
                    <LocationControlIcon isWorking={isWorking} />
                </button>
            )}

            <div className="absolute right-4 bottom-4 left-4 z-10 flex flex-col gap-2 sm:right-auto sm:w-[360px]">
                {message && (
                    <div className="rounded-2xl bg-white/96 px-4 py-3 text-sm text-[#52615e] shadow-lg backdrop-blur dark:bg-[#10201e]/96 dark:text-[#c8d5d1]">
                        {message}
                    </div>
                )}

                {showJourney && (
                    <div className="rounded-[22px] bg-white/96 p-4 shadow-[0_12px_40px_rgba(16,32,30,0.2)] backdrop-blur dark:bg-[#10201e]/96">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#10201e] dark:text-white">
                                    Directions
                                </p>
                                <p className="mt-1 truncate text-xs text-[#71807b] dark:text-[#a8b9b4]">
                                    From your location to {destination?.name ?? 'the selected place'}
                                </p>
                            </div>
                            {route && (
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold text-[#087f6b]">
                                        {route.duration}
                                    </p>
                                    <p className="text-xs text-[#71807b] dark:text-[#a8b9b4]">
                                        {route.distance}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-[#edf2f0] p-1 dark:bg-white/5">
                            {(
                                [
                                    ['DRIVING', 'Drive'],
                                    ['WALKING', 'Walk'],
                                    ['BICYCLING', 'Cycle'],
                                    ['TRANSIT', 'Transit'],
                                ] as Array<[TravelMode, string]>
                            ).map(([mode, label]) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setTravelMode(mode)}
                                    className={`rounded-lg px-2 py-2 text-[11px] font-semibold ${
                                        travelMode === mode
                                            ? 'bg-white text-[#10201e] shadow-sm dark:bg-[#e8c36a]'
                                            : 'text-[#71807b] dark:text-[#a8b9b4]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => void handleRoute()}
                            disabled={isWorking || !destinationCoordinates}
                            className="mt-3 w-full rounded-xl bg-[#087f6b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {isWorking ? 'Finding the best route…' : 'Get directions'}
                        </button>
                    </div>
                )}

                {airports.length > 0 && (
                    <div className="max-h-44 overflow-y-auto rounded-[22px] bg-white/96 p-3 shadow-lg backdrop-blur dark:bg-[#10201e]/96">
                        {airports.map((airport) => (
                            <button
                                key={airport.id}
                                type="button"
                                onClick={() => {
                                    map.current?.panTo(airport.location);
                                    map.current?.setZoom(13);
                                }}
                                className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#edf2f0] dark:hover:bg-white/5"
                            >
                                <span className="block text-xs font-semibold text-[#10201e] dark:text-white">
                                    {airport.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-[#71807b] dark:text-[#a8b9b4]">
                                    {airport.address}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 rounded-[18px] bg-white/96 p-2 shadow-[0_12px_36px_rgba(16,32,30,0.18)] backdrop-blur dark:bg-[#10201e]/96">
                    <MapAction onClick={() => setShowJourney((open) => !open)}>
                        Directions
                    </MapAction>
                    <MapAction onClick={openStreetView}>Street View</MapAction>
                    <MapAction onClick={() => void handleAirports()}>
                        {showAirports ? 'Hide airports' : 'Airports'}
                    </MapAction>
                </div>
            </div>
        </section>
    );
};

const MapAction: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
}> = ({ children, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="rounded-xl px-3 py-2 text-xs font-semibold text-[#43534e] transition hover:bg-[#edf2f0] hover:text-[#087f6b] dark:text-[#c8d5d1] dark:hover:bg-white/10 dark:hover:text-[#7ee2ce]"
    >
        {children}
    </button>
);

const LocationControlIcon = ({ isWorking }: { isWorking: boolean }) => (
    <svg
        className={`h-5 w-5 ${isWorking ? 'animate-pulse' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="3.25" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
);
