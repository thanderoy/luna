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
export const API_URL = 'https://www.timeanddate.com/scripts/moonphase.php?iso=';

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


// Convert phase names to array for indexing
export const PHASE_NAMES = Object.values(MOON_PHASES);


export const MoonPhaseIndicator = GObject.registerClass(
class MoonPhaseIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Moon Phase Indicator');

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
        this._styledMenuItem = new CustomPopupMenu();
        this.menu.addMenuItem(this._styledMenuItem);

        this._refreshButton = new RefreshButton(() => {
            this._updateMoonPhase();
        });
        this.menu.addMenuItem(this._refreshButton);
    }

    _updateMoonPhase() {
        // The new API requires the date in YYYY-MM-DD format.
        const now = GLib.DateTime.new_now_local();
        const isoDate = now.format('%Y-%m-%d');
        const url = API_URL + isoDate;

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
            console.error('Failed to get moon phase data from timeanddate.com');
            return;
        }

        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(bytes.get_data());

        // ---- ADD THIS LINE FOR DEBUGGING ----
        console.log(`Received data from timeanddate.com: ${data}`);
        // ------------------------------------

        try {
            const moonData = JSON.parse(data)[0];

            // Check for a valid response
            if (moonData.phase === undefined) {
                console.error('API Error: Invalid response from timeanddate.com');
                return;
            }

            this._updateUI(moonData);
        } catch (e) {
            console.error(`Error parsing moon phase data: ${e}`);
        }
    }

    _updateUI(moonData) {
        const phaseIndex = moonData.phase;
        const illumination = moonData.illum;
        const moonAge = moonData.age;
        const moonDistance = moonData.dist;

        const phaseName = PHASE_NAMES[phaseIndex] || MOON_PHASES.NEW_MOON;

        const iconName = PHASE_ICONS[phaseName] || PHASE_ICONS[MOON_PHASES.NEW_MOON];
        const iconPath = `${this._extension.path}/icons/${iconName}.svg`;

        if (GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
            this.moon_phase_icon.gicon = Gio.icon_new_for_string(iconPath);
        } else {
            console.warn(`Moon phase icon not found: ${iconPath}`);
            this.moon_phase_icon.icon_name = 'weather-clear-night-symbolic';
        }

        const nextPhaseIndex = (phaseIndex + 1) % PHASE_NAMES.length;
        const nextPhaseName = PHASE_NAMES[nextPhaseIndex];

        this._styledMenuItem.updateData({
            phaseName: phaseName,
            illumination: Math.round(illumination),
            nextPhase: nextPhaseName,
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
