import { createInertiaApp } from '@inertiajs/react';
import { initializeTheme } from '@/lib/themes';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

initializeTheme();

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#087f6b',
    },
});
