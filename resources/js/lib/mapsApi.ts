export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface GoogleRouteSummary {
    path: Array<{ lat: number; lng: number }>;
    distance: string;
    duration: string;
}

export interface GoogleAirport {
    id: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
    googleMapsUri?: string;
}

type GoogleMapsWindow = Window & {
    google?: any;
    __nexoraGoogleMapsReady?: () => void;
};

let googleMapsPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
    const browserWindow = window as GoogleMapsWindow;

    if (browserWindow.google?.maps?.importLibrary) {
        return Promise.resolve(browserWindow.google);
    }

    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

    if (!apiKey) {
        return Promise.reject(new Error("The map is unavailable right now."));
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        const callbackName = "__nexoraGoogleMapsReady";
        browserWindow[callbackName] = () => {
            delete browserWindow[callbackName];
            resolve(browserWindow.google);
        };

        const script = document.createElement("script");
        script.id = "nexora-google-maps";
        script.src =
            "https://maps.googleapis.com/maps/api/js?" +
            new URLSearchParams({
                key: apiKey,
                callback: callbackName,
                loading: "async",
                v: "weekly",
            }).toString();
        script.async = true;
        script.onerror = () => {
            googleMapsPromise = null;
            delete browserWindow[callbackName];
            reject(new Error("Google Maps could not be loaded."));
        };
        document.head.append(script);
    });

    return googleMapsPromise;
}

export function getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Location is unavailable in this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                const message =
                    error.code === error.PERMISSION_DENIED
                        ? "Allow location access in your browser, then try again."
                        : error.code === error.TIMEOUT
                          ? "Getting a fresh location took too long. Try again near a window or enable device location services."
                          : "Your device could not provide a location. Check Windows location services and try again.";
                reject(new Error(message));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    });
}

export async function reverseGeocodeLocation(coordinates: Coordinates): Promise<string | null> {
    const google = await loadGoogleMaps();
    const { Geocoder } = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();
    const response = await geocoder.geocode({
        location: { lat: coordinates.latitude, lng: coordinates.longitude },
    });

    return response.results?.[0]?.formatted_address ?? null;
}

export async function computeGoogleRoute(
    origin: Coordinates,
    destination: Coordinates,
    travelMode: TravelMode,
): Promise<GoogleRouteSummary> {
    const google = await loadGoogleMaps();
    const { Route } = await google.maps.importLibrary("routes");
    const { routes } = await Route.computeRoutes({
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: {
            lat: destination.latitude,
            lng: destination.longitude,
        },
        travelMode,
        routingPreference: travelMode === "DRIVING" ? "TRAFFIC_AWARE" : undefined,
        fields: ["path", "distanceMeters", "durationMillis", "localizedValues"],
    });
    const route = routes?.[0];

    if (!route?.path?.length) {
        throw new Error("No route is available for this journey.");
    }

    return {
        path: route.path.map((point: any) => ({
            lat: typeof point.lat === "function" ? point.lat() : point.lat,
            lng: typeof point.lng === "function" ? point.lng() : point.lng,
        })),
        distance:
            route.localizedValues?.distance ??
            `${((route.distanceMeters ?? 0) / 1000).toFixed(1)} km`,
        duration:
            route.localizedValues?.duration ??
            `${Math.round((route.durationMillis ?? 0) / 60000)} min`,
    };
}

export async function findGoogleAirports(center: Coordinates): Promise<GoogleAirport[]> {
    const google = await loadGoogleMaps();
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
    const { places } = await Place.searchNearby({
        fields: ["id", "displayName", "location", "formattedAddress", "googleMapsURI"],
        locationRestriction: {
            center: { lat: center.latitude, lng: center.longitude },
            radius: 50000,
        },
        includedPrimaryTypes: ["airport"],
        maxResultCount: 8,
        rankPreference: SearchNearbyRankPreference.DISTANCE,
    });

    return (places ?? []).flatMap((place: any) => {
        if (!place.location) {
            return [];
        }

        return [
            {
                id: place.id,
                name: place.displayName ?? "Airport",
                address: place.formattedAddress ?? "",
                location: {
                    lat:
                        typeof place.location.lat === "function"
                            ? place.location.lat()
                            : place.location.lat,
                    lng:
                        typeof place.location.lng === "function"
                            ? place.location.lng()
                            : place.location.lng,
                },
                googleMapsUri: place.googleMapsURI,
            },
        ];
    });
}
