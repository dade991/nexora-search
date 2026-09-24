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

export interface GoogleNearbyPlace {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    category: string;
    rating: number | null;
    review_count: number;
    phone: string | null;
    website: string | null;
    googleMapsUri?: string;
}

type GoogleMapsWindow = Window & {
    google?: any;
    __nexoraGoogleMapsReady?: () => void;
};

const GOOGLE_CATEGORY_TYPES: Record<string, string[]> = {
    restaurant: ["restaurant", "meal_delivery", "meal_takeaway", "fast_food_restaurant"],
    cafe: ["cafe", "coffee_shop", "bakery"],
    park: ["park", "national_park", "garden"],
    hotel: ["hotel", "lodging", "guest_house", "motel"],
    museum: ["museum", "art_gallery"],
    landmark: [
        "tourist_attraction",
        "church",
        "mosque",
        "hindu_temple",
        "library",
        "university",
        "school",
        "shopping_mall",
        "supermarket",
        "bank",
        "hospital",
        "pharmacy",
        "gas_station",
        "stadium",
        "gym",
    ],
};

function googleTypeToCategory(types: string[]): string {
    for (const type of types) {
        for (const [category, googleTypes] of Object.entries(GOOGLE_CATEGORY_TYPES)) {
            if (googleTypes.includes(type)) {
                return category;
            }
        }
    }
    return "landmark";
}

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
                        : "Your device could not provide a location. Check Windows location services and try again.";
                reject(new Error(message));
            },
            { enableHighAccuracy: true, maximumAge: 0 },
        );
    });
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

export async function findGoogleNearbyPlaces(
    center: Coordinates,
    radiusMetres = 10000,
    category?: string | null,
    maxResults = 20,
): Promise<GoogleNearbyPlace[]> {
    const google = await loadGoogleMaps();
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");

    const typesForCategory = (cat: string | null | undefined): string[] => {
        if (cat && GOOGLE_CATEGORY_TYPES[cat]) {
            return GOOGLE_CATEGORY_TYPES[cat];
        }
        return Object.values(GOOGLE_CATEGORY_TYPES).flat();
    };

    const includedTypes = typesForCategory(category);
    const clampedRadius = Math.max(200, Math.min(radiusMetres, 50000));
    const clampedCount = Math.min(maxResults, 20);

    const { places } = await Place.searchNearby({
        fields: [
            "id",
            "displayName",
            "location",
            "formattedAddress",
            "googleMapsURI",
            "types",
            "rating",
            "userRatingCount",
            "nationalPhoneNumber",
            "websiteURI",
        ],
        locationRestriction: {
            center: { lat: center.latitude, lng: center.longitude },
            radius: clampedRadius,
        },
        includedPrimaryTypes: includedTypes.slice(0, 50),
        maxResultCount: clampedCount,
        rankPreference: SearchNearbyRankPreference.DISTANCE,
    });

    return (places ?? []).flatMap((place: any) => {
        if (!place.location) {
            return [];
        }

        const lat =
            typeof place.location.lat === "function"
                ? place.location.lat()
                : place.location.lat;
        const lng =
            typeof place.location.lng === "function"
                ? place.location.lng()
                : place.location.lng;

        const types: string[] = Array.isArray(place.types) ? place.types : [];

        return [
            {
                id: place.id ?? `google_${lat}_${lng}`,
                name: place.displayName ?? "Unnamed place",
                address: place.formattedAddress ?? "",
                latitude: lat,
                longitude: lng,
                category: googleTypeToCategory(types),
                rating: place.rating ?? null,
                review_count: place.userRatingCount ?? 0,
                phone: place.nationalPhoneNumber ?? null,
                website: place.websiteURI ?? null,
                googleMapsUri: place.googleMapsURI,
            },
        ];
    });
}
