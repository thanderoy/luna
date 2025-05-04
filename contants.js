export const UPDATE_INTERVAL_SECONDS = 3600; // Update every hour
export const ICON_SIZE = 16; // Icon size in pixels
export const API_URL = 'https://api.farmsense.net/v1/moonphases/?d=';

// Moon phase constants
export const MOON_PHASES = Object.freeze({
    NEW_MOON: 'New Moon',
    WAXING_CRESCENT: 'Waxing Crescent',
    FIRST_QUARTER: 'First Quarter',
    WAXING_GIBBOUS: 'Waxing Gibbous',
    FULL_MOON: 'Full Moon',
    WANING_GIBBOUS: 'Waning Gibbous',
    LAST_QUARTER: 'Last Quarter',
    WANING_CRESCENT: 'Waning Crescent'
});

// Map phase names to icon filenames
export const PHASE_ICONS = Object.freeze({
    [MOON_PHASES.NEW_MOON]: 'luna_nueva',
    [MOON_PHASES.WAXING_CRESCENT]: 'luna_creciente',
    [MOON_PHASES.FIRST_QUARTER]: 'luna_cuarto_creciente',
    [MOON_PHASES.WAXING_GIBBOUS]: 'luna_gibosa_creciente',
    [MOON_PHASES.FULL_MOON]: 'luna_llena',
    [MOON_PHASES.WANING_GIBBOUS]: 'luna_gibosa_menguante',
    [MOON_PHASES.LAST_QUARTER]: 'luna_cuarto_menguante',
    [MOON_PHASES.WANING_CRESCENT]: 'luna_menguante'
});

// API Phase Names mapping
export const API_PHASE_NAMES = Object.freeze({
    'New Moon': MOON_PHASES.NEW_MOON,
    'Waxing Crescent': MOON_PHASES.WAXING_CRESCENT,
    '1st Quarter': MOON_PHASES.FIRST_QUARTER,
    'Waxing Gibbous': MOON_PHASES.WAXING_GIBBOUS,
    'Full Moon': MOON_PHASES.FULL_MOON,
    'Waning Gibbous': MOON_PHASES.WANING_GIBBOUS,
    '3rd Quarter': MOON_PHASES.LAST_QUARTER,
    'Waning Crescent': MOON_PHASES.WANING_CRESCENT,
});

// Convert phase names to array for indexing
export const PHASE_NAMES = Object.values(MOON_PHASES);