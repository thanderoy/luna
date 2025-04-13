/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const UPDATE_INTERVAL_SECONDS = 3600; // Update every hour

// Moon phase constants
const MOON_PHASES = Object.freeze({
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
const PHASE_ICONS = Object.freeze({
    [MOON_PHASES.NEW_MOON]: 'luna_nueva',
    [MOON_PHASES.WAXING_CRESCENT]: 'luna_creciente',
    [MOON_PHASES.FIRST_QUARTER]: 'luna_cuarto_creciente',
    [MOON_PHASES.WAXING_GIBBOUS]: 'luna_gibosa_creciente',
    [MOON_PHASES.FULL_MOON]: 'luna_llena',
    [MOON_PHASES.WANING_GIBBOUS]: 'luna_gibosa_menguante',
    [MOON_PHASES.LAST_QUARTER]: 'luna_cuarto_menguante',
    [MOON_PHASES.WANING_CRESCENT]: 'luna_menguante'
});

// Convert phase names to array for indexing
const PHASE_NAMES = Object.values(MOON_PHASES);

const MoonPhaseIndicator = GObject.registerClass(
class MoonPhaseIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Moon Phase Indicator');

        this._extension = extension;

        // Create icon with fallback
        this.moon_phase_icon = new St.Icon({
            icon_name: 'weather-clear-night-symbolic', // Fallback icon
            style_class: 'system-status-icon',
        });
        this.add_child(this.moon_phase_icon);

        // Build the popup menu
        this._buildMenu();

        // Update moon phase immediately and set up timer
        this._updateMoonPhase();
        this._startTimer();
    }

    _startTimer() {
        // Clear any existing timer first
        this._stopTimer();

        // Set up a new timer
        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            UPDATE_INTERVAL_SECONDS,
            () => {
                this._updateMoonPhase();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopTimer() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
    }

    _buildMenu() {
        // Current phase label
        this._phaseLabel = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false
        });
        this.menu.addMenuItem(this._phaseLabel);

        // Next phase info
        this._nextPhaseLabel = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false
        });
        this.menu.addMenuItem(this._nextPhaseLabel);

        // Add percentage info
        this._percentageLabel = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false
        });
        this.menu.addMenuItem(this._percentageLabel);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Add refresh button
        const refreshItem = new PopupMenu.PopupMenuItem('Refresh');
        refreshItem.connect('activate', () => {
            this._updateMoonPhase();
        });
        this.menu.addMenuItem(refreshItem);
    }

    _updateMoonPhase() {
        try {
            // Calculate current moon phase
            const { phase, phaseName, illumination } = this._calculateMoonPhase();

            // Get icon path for the current phase
            const iconName = PHASE_ICONS[phaseName];
            const iconPath = `${this._extension.path}/icons/${iconName}.svg`;

            // Check if icon exists
            if (GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
                this.moon_phase_icon.gicon = Gio.icon_new_for_string(iconPath);
            } else {
                // Fallback to symbolic icon
                console.warn(`Moon phase icon not found: ${iconPath}`);
                this.moon_phase_icon.icon_name = 'weather-clear-night-symbolic';
            }

            // Update menu labels
            this._phaseLabel.label.text = `Current Phase: ${phaseName}`;

            // Get next phase
            const nextPhaseIndex = (PHASE_NAMES.indexOf(phaseName) + 1) % PHASE_NAMES.length;
            const nextPhaseName = PHASE_NAMES[nextPhaseIndex];
            this._nextPhaseLabel.label.text = `Next Phase: ${nextPhaseName}`;

            // Update illumination percentage
            this._percentageLabel.label.text = `Illumination: ${Math.round(illumination * 100)}%`;

            return true;
        } catch (error) {
            console.error(`Error updating moon phase: ${error.message}`);

            // Set fallback text in case of error
            this._phaseLabel.label.text = 'Error: Could not determine moon phase';
            this._nextPhaseLabel.label.text = '';
            this._percentageLabel.label.text = '';

            // Use fallback icon
            this.moon_phase_icon.icon_name = 'weather-severe-alert-symbolic';

            return true;
        }
    }

    _calculateMoonPhase() {
        // Get current date
        const now = new Date();

        // Calculate days since January 1, 2000 (a known new moon)
        const KNOWN_NEW_MOON = new Date(2000, 0, 6, 18, 14); // Jan 6, 2000, 18:14 UTC
        const LUNAR_CYCLE = 29.53058867; // Length of lunar month in days

        // Calculate time difference in milliseconds and convert to days
        const diffMillis = now - KNOWN_NEW_MOON;
        const diffDays = diffMillis / (1000 * 60 * 60 * 24);

        // Calculate the phase as a fraction [0,1]
        const phase = (diffDays % LUNAR_CYCLE) / LUNAR_CYCLE;

        // Calculate illumination (0 = new, 0.5 = quarter, 1 = full)
        const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

        // Determine phase name based on the phase value
        let phaseName;
        if (phase < 0.0625 || phase >= 0.9375) {
            phaseName = MOON_PHASES.NEW_MOON;
        } else if (phase < 0.1875) {
            phaseName = MOON_PHASES.WAXING_CRESCENT;
        } else if (phase < 0.3125) {
            phaseName = MOON_PHASES.FIRST_QUARTER;
        } else if (phase < 0.4375) {
            phaseName = MOON_PHASES.WAXING_GIBBOUS;
        } else if (phase < 0.5625) {
            phaseName = MOON_PHASES.FULL_MOON;
        } else if (phase < 0.6875) {
            phaseName = MOON_PHASES.WANING_GIBBOUS;
        } else if (phase < 0.8125) {
            phaseName = MOON_PHASES.LAST_QUARTER;
        } else {
            phaseName = MOON_PHASES.WANING_CRESCENT;
        }

        return { phase, phaseName, illumination };
    }

    destroy() {
        this._stopTimer();
        super.destroy();
    }
});

export default class MoonPhaseIndicatorExtension extends Extension {
    enable() {
        this._indicator = new MoonPhaseIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}