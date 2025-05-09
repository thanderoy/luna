import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Soup from 'gi://Soup';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { CustomPopupMenu } from './ui/customPopupMenu.js';
import { RefreshButton } from './ui/refreshButton.js';
import {
    UPDATE_INTERVAL_SECONDS,
    ICON_SIZE,
    API_URL,
    MOON_PHASES,
    PHASE_ICONS,
    API_PHASE_NAMES,
    PHASE_NAMES
} from './constants.js';

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

        const phaseName = API_PHASE_NAMES[apiPhaseName] || MOON_PHASES.NEW_MOON;

        const iconName = PHASE_ICONS[phaseName] || PHASE_ICONS[MOON_PHASES.NEW_MOON];
        const iconPath = `${this._extension.path}/icons/${iconName}.svg`;

        if (GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
            this.moon_phase_icon.gicon = Gio.icon_new_for_string(iconPath);
        } else {
            console.warn(`Moon phase icon not found: ${iconPath}`);
            this.moon_phase_icon.icon_name = 'weather-clear-night-symbolic';
        }

        const nextPhaseIndex = (PHASE_NAMES.indexOf(phaseName) + 1) % PHASE_NAMES.length;
        const nextPhaseName = PHASE_NAMES[nextPhaseIndex];

        this._styledMenuItem.updateData({
            phaseName: phaseName,
            illumination: Math.round(illumination * 100),
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