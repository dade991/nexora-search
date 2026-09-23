export interface MapCoordinates {
    latitude: number;
    longitude: number;
}

export function isMapCenteredOnLocation(
    location: MapCoordinates,
    center: MapCoordinates,
    toleranceMetres = 8,
): boolean {
    const latitudeDelta = ((center.latitude - location.latitude) * Math.PI) / 180;
    const longitudeDelta = ((center.longitude - location.longitude) * Math.PI) / 180;
    const latitude = (location.latitude * Math.PI) / 180;
    const centerLatitude = (center.latitude * Math.PI) / 180;
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(latitude) *
            Math.cos(centerLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;
    const distanceMetres =
        6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));

    return distanceMetres <= toleranceMetres;
}
