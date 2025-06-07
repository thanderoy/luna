import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Soup from 'gi://Soup';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { CustomPopupMenu } from '../ui/customPopupMenu.js';
import { RefreshButton } from '../ui/refreshButton.js';

// Constants
export const UPDATE_INTERVAL_SECONDS = 3600; // Update every hour
export const ICON_SIZE = 16; // Icon size in pixels
export const API_URL = 'https://api.farmsense.net/v1/moonphases/?d=';

// Canonical phase names (will be translation keys)
export const MOON_PHASE_NAMES = Object.freeze({
    NEW_MOON: 'New Moon',
    WAXING_CRESCENT: 'Waxing Crescent',
    FIRST_QUARTER: 'First Quarter',
    WAXING_GIBBOUS: 'Waxing Gibbous',
    FULL_MOON: 'Full Moon',
    WANING_GIBBOUS: 'Waning Gibbous',
    LAST_QUARTER: 'Last Quarter',
    WANING_CRESCENT: 'Waning Crescent'
});

// Map API phase names to our canonical phase names
export const API_TO_CANONICAL_PHASE = Object.freeze({
    'New Moon': MOON_PHASE_NAMES.NEW_MOON,
    'Waxing Crescent': MOON_PHASE_NAMES.WAXING_CRESCENT,
    '1st Quarter': MOON_PHASE_NAMES.FIRST_QUARTER, // API uses '1st Quarter'
    'Waxing Gibbous': MOON_PHASE_NAMES.WAXING_GIBBOUS,
    'Full Moon': MOON_PHASE_NAMES.FULL_MOON,
    'Waning Gibbous': MOON_PHASE_NAMES.WANING_GIBBOUS,
    '3rd Quarter': MOON_PHASE_NAMES.LAST_QUARTER, // API uses '3rd Quarter'
    'Waning Crescent': MOON_PHASE_NAMES.WANING_CRESCENT,
});

// Map our canonical phase names to icon filenames
export const PHASE_ICONS = Object.freeze({
    [MOON_PHASE_NAMES.NEW_MOON]: 'luna_nueva',
    [MOON_PHASE_NAMES.WAXING_CRESCENT]: 'luna_creciente',
    [MOON_PHASE_NAMES.FIRST_QUARTER]: 'luna_cuarto_creciente',
    [MOON_PHASE_NAMES.WAXING_GIBBOUS]: 'luna_gibosa_creciente',
    [MOON_PHASE_NAMES.FULL_MOON]: 'luna_llena',
    [MOON_PHASE_NAMES.WANING_GIBBOUS]: 'luna_gibosa_menguante',
    [MOON_PHASE_NAMES.LAST_QUARTER]: 'luna_cuarto_menguante',
    [MOON_PHASE_NAMES.WANING_CRESCENT]: 'luna_menguante'
});

// Array of canonical phase names for ordered operations (e.g., finding next phase)
export const ORDERED_PHASE_NAMES = Object.values(MOON_PHASE_NAMES);


export const MoonPhaseIndicator = GObject.registerClass(
class MoonPhaseIndicator extends PanelMenu.Button {
    _init(extension, gettext) {
        this._ = gettext; // Store gettext first
        super._init(0.0, this._('Moon Phase Indicator'));

        this._extension = extension;
        this._httpSession = null;
        this._initHttpSession();

        this.moon_phase_icon = new St.Icon({
            icon_name: 'weather-clear-night-symbolic', // Fallback icon
            style_class: 'system-status-icon',
            icon_size: ICON_SIZE
        });
        this.add_child(this.moon_phase_icon);

        this._buildMenu();

        this._updateMoonPhase();
        this._startTimer();
    }

    _initHttpSession() {
        if (this._httpSession === null) {
            this._httpSession = new Soup.Session();
            this._httpSession.user_agent = 'Luna - Moon Phase Indicator';
        }
    }

    _startTimer() {
        this._stopTimer();

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
        this._styledMenuItem = new CustomPopupMenu(this._);
        this.menu.addMenuItem(this._styledMenuItem);

        this._refreshButton = new RefreshButton(this._, () => {
            this._updateMoonPhase();
        });
        this.menu.addMenuItem(this._refreshButton);
    }

    _updateMoonPhase() {
        const now = Math.floor(Date.now() / 1000);

        const url = API_URL + now;

        let request = Soup.Message.new('GET', url);

        this._httpSession.send_and_read_async(
            request,
            GLib.PRIORITY_DEFAULT,
            null,
            this._onMoonDataReceived.bind(this)
        );

        return true;
    }

    _onMoonDataReceived(session, result) {
        const bytes = session.send_and_read_finish(result);
        if (bytes === null) {
            console.error('Failed to get moon phase data');
            return;
        }

        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(bytes.get_data());

        const moonData = JSON.parse(data)[0];

        if (moonData.Error !== 0) {
            console.error(`API Error: ${moonData.ErrorMsg}`);
            return;
        }

        this._updateUI(moonData);

    }


    _updateUI(moonData) {
        const apiPhaseName = moonData.Phase;
        const illumination = moonData.Illumination;
        const moonAge = moonData.Age;
        const moonDistance = moonData.Distance;

        const phaseName = API_TO_CANONICAL_PHASE[apiPhaseName] || MOON_PHASE_NAMES.NEW_MOON;

        const iconName = PHASE_ICONS[phaseName] || PHASE_ICONS[MOON_PHASE_NAMES.NEW_MOON];
        const iconPath = `${this._extension.path}/icons/${iconName}.svg`;

        if (GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
            this.moon_phase_icon.gicon = Gio.icon_new_for_string(iconPath);
        } else {
            console.warn(`Moon phase icon not found: ${iconPath}`);
            this.moon_phase_icon.icon_name = 'weather-clear-night-symbolic';
        }

        const nextPhaseIndex = (ORDERED_PHASE_NAMES.indexOf(phaseName) + 1) % ORDERED_PHASE_NAMES.length;
        const nextPhaseName = ORDERED_PHASE_NAMES[nextPhaseIndex];

        this._styledMenuItem.updateData({
            phaseName: this._(phaseName),
            illumination: Math.round(illumination * 100),
            nextPhase: this._(nextPhaseName),
            distance: Math.round(moonDistance).toLocaleString(),
            age: moonAge.toFixed(2)
        });
    }

    destroy() {
        this._stopTimer();
        if (this._httpSession !== null) {
            this._httpSession.abort();
            this._httpSession = null;
        }
        super.destroy();
    }
});