import assert from 'node:assert/strict';
import test from 'node:test';
import { isMapCenteredOnLocation } from '../../resources/js/lib/mapLocation.ts';

test('treats a camera within eight metres as centered on the user', () => {
    assert.equal(
        isMapCenteredOnLocation(
            { latitude: 6.5244, longitude: 3.3792 },
            { latitude: 6.52443, longitude: 3.37922 },
        ),
        true,
    );
});

test('treats a camera moved away from the user as not centered', () => {
    assert.equal(
        isMapCenteredOnLocation(
            { latitude: 6.5244, longitude: 3.3792 },
            { latitude: 6.5246, longitude: 3.3792 },
        ),
        false,
    );
});
