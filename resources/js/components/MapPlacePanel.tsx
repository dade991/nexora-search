import type { LocationItem } from "@/types";

interface MapPlacePanelProps {
    place: LocationItem | null;
    onBrowse: (place: LocationItem) => void;
}

export function MapPlacePanel({ place, onBrowse }: MapPlacePanelProps) {
    if (!place) {
        return (
            <aside className="rounded-[24px] border border-[#10201e]/10 bg-white p-5 dark:border-white/10 dark:bg-[#101a18]">
                <p className="text-xs font-bold tracking-[0.18em] text-[#087f6b] uppercase">
                    Map selection
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#10201e] dark:text-white">
                    Choose a marker
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#687873] dark:text-[#a8b9b4]">
                    Selecting a place updates this panel without covering the map.
                </p>
            </aside>
        );
    }

    const photo = place.photos?.[0];
    const hours = place.hours?.display;

    return (
        <aside className="overflow-hidden rounded-[24px] border border-[#10201e]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#101a18]">
            {photo ? (
                <img src={photo} alt="" className="h-32 w-full object-cover" loading="lazy" />
            ) : (
                <div className="flex h-24 items-center justify-center bg-[#e7f6f2] text-xs font-bold tracking-[0.18em] text-[#087f6b] uppercase dark:bg-[#123b37] dark:text-[#7ee2ce]">
                    {place.category || "Place"}
                </div>
            )}
            <div className="p-5">
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#087f6b] uppercase">
                    {place.category} · destination selected
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#10201e] dark:text-white">
                    {place.name}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#687873] dark:text-[#a8b9b4]">
                    {place.address || "Address unavailable"}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniFact
                        label="Rating"
                        value={place.rating ? `★ ${place.rating}` : "Not available"}
                    />
                    <MiniFact
                        label="Distance"
                        value={
                            place.distance_km ? `${place.distance_km.toFixed(1)} km` : "Route ready"
                        }
                    />
                    <MiniFact label="Hours" value={hours || "Not available"} />
                    <MiniFact
                        label="Coordinates"
                        value={`${Number(place.latitude).toFixed(3)}, ${Number(place.longitude).toFixed(3)}`}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => onBrowse(place)}
                    className="mt-4 w-full rounded-xl bg-[#087f6b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#066a5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087f6b]"
                >
                    Browse full place details
                </button>
                <p className="mt-3 text-[11px] leading-5 text-[#75847f] dark:text-[#8fa19b]">
                    Use Directions on the map to route to this destination.
                </p>
            </div>
        </aside>
    );
}

function MiniFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-[#eef3f1] p-3 dark:bg-white/5">
            <span className="block text-[10px] font-semibold text-[#75847f] dark:text-[#8fa19b]">
                {label}
            </span>
            <span className="mt-1 block truncate text-xs font-semibold text-[#10201e] dark:text-[#edf5f1]">
                {value}
            </span>
        </div>
    );
}
