/**
 * Moon Phase Calculator
 * 
 * Calculates moon phase data using astronomical formulas based on
 * Julian Date calculations and the synodic month cycle.
 * 
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GLib from 'gi://GLib';

// Synodic month length (average time between new moons)
const SYNODIC_MONTH = 29.53058867;

// Reference new moon: January 6, 2000 at 18:14 UTC (Julian Date)
const LUNAR_EPOCH_JD = 2451550.1;

// Lunar orbital parameters
const AVERAGE_LUNAR_DISTANCE = 384400;  // km
const LUNAR_DISTANCE_AMPLITUDE = 21000; // km variation from average
const ANOMALISTIC_MONTH = 27.55455;     // days between perigees

/**
 * Convert a GLib.DateTime to Julian Date using the Meeus algorithm
 * @param {GLib.DateTime} dateTime - The date/time to convert
 * @returns {number} Julian Date
 */
function toJulianDate(dateTime) {
    const utcDateTime = dateTime.to_utc();
    
    let year = utcDateTime.get_year();
    let month = utcDateTime.get_month();
    const day = utcDateTime.get_day_of_month();
    
    // Fractional day from time
    const dayFraction = (
        utcDateTime.get_hour() + 
        utcDateTime.get_minute() / 60 + 
        utcDateTime.get_second() / 3600
    ) / 24;
    
    // Adjust year and month for January/February
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    
    // Gregorian calendar correction
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    return Math.floor(365.25 * (year + 4716)) +
           Math.floor(30.6001 * (month + 1)) +
           day + dayFraction + B - 1524.5;
}

/**
 * Calculate the lunar age (days since last new moon)
 * @param {GLib.DateTime} dateTime - The date/time to calculate for
 * @returns {number} Lunar age in days (0-29.53)
 */
function getLunarAge(dateTime) {
    const jd = toJulianDate(dateTime);
    const daysSinceEpoch = jd - LUNAR_EPOCH_JD;
    const lunarAge = daysSinceEpoch % SYNODIC_MONTH;
    
    return lunarAge < 0 ? lunarAge + SYNODIC_MONTH : lunarAge;
}

/**
 * Get moon phase index (0-7) from lunar age
 * 
 * 0 = New Moon, 1 = Waxing Crescent, 2 = First Quarter,
 * 3 = Waxing Gibbous, 4 = Full Moon, 5 = Waning Gibbous,
 * 6 = Last Quarter, 7 = Waning Crescent
 * 
 * @param {number} lunarAge - Days since last new moon
 * @returns {number} Phase index (0-7)
 */
function getPhaseIndex(lunarAge) {
    const phaseLength = SYNODIC_MONTH / 8;
    // Shift by half a phase so New Moon is centered around 0 days
    const adjustedAge = (lunarAge + phaseLength / 2) % SYNODIC_MONTH;
    return Math.floor(adjustedAge / phaseLength);
}

/**
 * Calculate moon illumination percentage using cosine approximation
 * @param {number} lunarAge - Days since last new moon
 * @returns {number} Illumination percentage (0-100)
 */
function getIllumination(lunarAge) {
    const cyclePosition = lunarAge / SYNODIC_MONTH;
    return (1 - Math.cos(2 * Math.PI * cyclePosition)) / 2 * 100;
}

/**
 * Calculate approximate moon distance from Earth
 * @param {number} lunarAge - Days since last new moon
 * @returns {number} Distance in kilometers
 */
function getMoonDistance(lunarAge) {
    // lunarAge is in days, so divide by ANOMALISTIC_MONTH to get cycle position
    // Ensure positive cycle position in [0, 1)
    let cyclePosition = (lunarAge / ANOMALISTIC_MONTH) % 1;
    if (cyclePosition < 0) cyclePosition += 1;
    
    return AVERAGE_LUNAR_DISTANCE - LUNAR_DISTANCE_AMPLITUDE * Math.cos(2 * Math.PI * cyclePosition);
}

/**
 * Calculate all moon phase data for the current moment
 * @returns {Object} Moon data with phase, illum, age, dist properties
 */
export function calculateMoonData() {
    const now = GLib.DateTime.new_now_local();
    const lunarAge = getLunarAge(now);
    
    return {
        phase: getPhaseIndex(lunarAge),
        illum: getIllumination(lunarAge),
        age: lunarAge,
        dist: getMoonDistance(lunarAge)
    };
}
