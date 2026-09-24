import assert from "node:assert/strict";
import test from "node:test";
import {
    describeLocationAccuracy,
    isMapCenteredOnLocation,
    shouldAutoLocateMap,
} from "../../resources/js/lib/mapLocation.ts";

test("treats a camera within eight metres as centered on the user", () => {
    assert.equal(
        isMapCenteredOnLocation(
            { latitude: 6.5244, longitude: 3.3792 },
            { latitude: 6.52443, longitude: 3.37922 },
        ),
        true,
    );
});

test("treats a camera moved away from the user as not centered", () => {
    assert.equal(
        isMapCenteredOnLocation(
            { latitude: 6.5244, longitude: 3.3792 },
            { latitude: 6.5246, longitude: 3.3792 },
        ),
        false,
    );
});

test("warns when the browser location is only approximate", () => {
    assert.equal(describeLocationAccuracy(1800), "Approximate location (±1.8 km)");
    assert.equal(describeLocationAccuracy(24), "Location accuracy ±24 m");
});

test("automatically locates the user only when the map has no destination", () => {
    assert.equal(shouldAutoLocateMap(null), true);
    assert.equal(
        shouldAutoLocateMap({ latitude: 6.5244, longitude: 3.3792 }),
        false,
    );
});
