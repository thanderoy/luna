/**
 * Moon Phase Indicator
 * 
 * Main indicator component for the Luna extension.
 * Displays current moon phase in the GNOME panel with a popup menu
 * showing detailed lunar information.
 * 
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { CustomPopupMenu } from '../ui/customPopupMenu.js';
import { RefreshButton } from '../ui/refreshButton.js';
import { calculateMoonData } from './moonCalculator.js';

// Constants
const DEFAULT_UPDATE_INTERVAL = 3600; // 1 hour (seconds)
const MIN_UPDATE_INTERVAL = 900;      // 15 minutes (seconds)
const MAX_UPDATE_INTERVAL = 86400;    // 24 hours (seconds)
const ICON_SIZE = 16;

// Moon phase definitions
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

const PHASE_NAMES = Object.values(MOON_PHASES);


export const MoonPhaseIndicator = GObject.registerClass(
class MoonPhaseIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Moon Phase Indicator');

        this._extension = extension;
        this._settings = null;
        this._settingsChangedId = null;
        this._timerId = null;
        
        this._initSettings();
        this._buildUI();
        this._updateMoonPhase();
        this._startTimer();
    }

    _initSettings() {
        try {
            this._settings = this._extension.getSettings();
            
            // Listen for settings changes to restart timer with new interval
            this._settingsChangedId = this._settings.connect(
                'changed::update-interval',
                () => {
                    console.log('Luna: Update interval changed, restarting timer');
                    this._stopTimer();
                    this._startTimer();
                }
            );
        } catch (e) {
            console.log('Luna: Settings not available, using defaults');
        }
    }

    _getUpdateInterval() {
        let interval = DEFAULT_UPDATE_INTERVAL;

        if (this._settings) {
            try {
                interval = this._settings.get_int('update-interval');
            } catch (e) {
                // Setting not found, use default
                return DEFAULT_UPDATE_INTERVAL;
            }
        }

        // Validate and clamp to the documented range (900-86400 seconds)
        // to avoid pathological timer behavior
        if (!Number.isInteger(interval) || interval <= 0) {
            return DEFAULT_UPDATE_INTERVAL;
        }

        return Math.max(MIN_UPDATE_INTERVAL, Math.min(MAX_UPDATE_INTERVAL, interval));
    }

    _buildUI() {
        // Panel icon
        this._icon = new St.Icon({
            icon_name: 'weather-clear-night-symbolic',
            style_class: 'system-status-icon',
            icon_size: ICON_SIZE
        });
        this.add_child(this._icon);

        // Popup menu content
        this._menuContent = new CustomPopupMenu();
        this.menu.addMenuItem(this._menuContent);

        // Refresh button
        this._refreshButton = new RefreshButton(() => this._updateMoonPhase());
        this.menu.addMenuItem(this._refreshButton);
    }

    _startTimer() {
        this._stopTimer();

        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._getUpdateInterval(),
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

    _updateMoonPhase() {
        try {
            const moonData = calculateMoonData();
            this._displayMoonData(moonData);
        } catch (e) {
            console.error(`Luna: Calculation error: ${e.message}`);
            Main.notify('Luna', 'Error calculating moon phase');
        }
        return true;
    }

    _displayMoonData(moonData) {
        const { phase, illum, age, dist } = moonData;
        
        // Get phase name and icon
        const phaseName = PHASE_NAMES[phase] || MOON_PHASES.NEW_MOON;
        const iconName = PHASE_ICONS[phaseName] || PHASE_ICONS[MOON_PHASES.NEW_MOON];
        const iconPath = `${this._extension.path}/icons/${iconName}.svg`;

        // Update panel icon
        if (GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
            this._icon.gicon = Gio.icon_new_for_string(iconPath);
        } else {
            console.warn(`Luna: Icon not found: ${iconPath}`);
            this._icon.icon_name = 'weather-clear-night-symbolic';
        }

        // Update menu content
        const nextPhaseIndex = (phase + 1) % PHASE_NAMES.length;
        
        this._menuContent.updateData({
            phaseName: phaseName,
            illumination: Math.round(illum),
            nextPhase: PHASE_NAMES[nextPhaseIndex],
            distance: Math.round(dist).toLocaleString(),
            age: age.toFixed(2)
        });
    }

    destroy() {
        this._stopTimer();
        
        // Disconnect settings signal
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        
        this._settings = null;
        super.destroy();
    }
});
