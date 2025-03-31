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

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const UPDATE_INTERVAL_SECONDS = 3600;
const ICON_SIZE = 16;

// Could be useful for future translations
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

const MoonPhaseIndicator = GObject.registerClass(
class MoonPhaseIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Moon Phase Indicator'));

        this.moon_phase_icon = new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
            icon_size: ICON_SIZE,
        })
        this.add_child(this.moon_phase_icon);

        // Create popup menu
        this._buildMenu();

        // Update moon phase every hour
        this._updateMoonPhase();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, UPDATE_INTERVAL_SECONDS, () => {
            this._updateMoonPhase();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _buildMenu() {
        // Current phase label
        this._phaseLabel = new PopupMenu.PopupMenuItem('', {
            reactive: false
        });
        this.menu.addMenuItem(this._phaseLabel);

        // Next phase info
        this._nextPhaseLabel = new PopupMenu.PopupMenuItem('', {
            reactive: false
        });
        this.menu.addMenuItem(this._nextPhaseLabel);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    }

    _updateMoonPhase() {
        try {
            const { phase, phaseName } = this._calculateMoonPhase();
            const iconName = this._getIconNameForPhase(phase);

            // Update icon
            const iconPath = `${this.path}/icons/${iconName}.svg`;

            if (!GLib.file_test(iconPath, GLib.FileTest.EXISTS)) {
                throw new Error(`Icon not found: ${iconPath}`);
            }

            this.moon_phase_icon.gicon = Gio.icon_new_for_string(iconPath);

            // Update menu labels
            this._phaseLabel.label.text = `Current Phase: ${phaseName}`;
            const nextPhase = this._getNextPhaseName(phase);
            this._nextPhaseLabel.label.text = `Next Phase: ${nextPhase}`;

            return true;
        } catch (error) {
            logError(error);
            // Set fallback text in case of error
            this._phaseLabel.label.text = 'Error: Could not determine moon phase';
            this._nextPhaseLabel.label.text = '';
            return GLib.SOURCE_CONTINUE;
;
        }
    }

    _calculateMoonPhase() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        // Calculating moon phase using Conway's algorithm
        let r = year % 100;
        r %= 19;
        if (r > 9) r -= 19;
        r = ((r * 11) % 30) + month + day;
        if (month < 3) r += 2;
        r -= ((year < 2000) ? 4 : 8.3);
        r = Math.floor(r + 0.5) % 30;

        // Convert 30 day cycle to 8 phases
        const phase = Math.floor((r / 30) * 8);
        const phaseName = this._getPhaseNameForIndex(phase);

        return { phase, phaseName };
    }

    _getPhaseNameForIndex(phase) {
        const phases = [
            'New Moon',            // luna_nueva
            'Waxing Crescent',     // luna_creciente
            'First Quarter',       // luna_cuarto_creciente
            'Waxing Gibbous',      // luna_gibosa_creciente
            'Full Moon',           // luna_llena
            'Waning Gibbous',      // luna_gibosa_menguante
            'Last Quarter',        // luna_cuarto_menguante
            'Waning Crescent'      // luna_menguante
        ];
        return phases[phase];
    }

    _getNextPhaseName(currentPhase) {
        const nextPhase = (currentPhase + 1) % 8;
        return this._getPhaseNameForIndex(nextPhase);
    }

    _getIconNameForPhase(phase) {
        const icons = [
            'luna_nueva',           // New Moon
            'luna_creciente',       // Waxing Crescent
            'luna_cuarto_creciente', // First Quarter
            'luna_gibosa_creciente', // Waxing Gibbous
            'luna_llena',           // Full Moon
            'luna_gibosa_menguante', // Waning Gibbous
            'luna_cuarto_menguante', // Last Quarter
            'luna_menguante'        // Waning Crescent
        ];
        return icons[phase];
    }

    destroy() {
        if (this._timer && GLib.Source.remove(this._timer)) {
            this._timer = null;
        }
        super.destroy();
    }
});

export default class MoonPhaseIndicatorExtension extends Extension {
    enable() {
        this._indicator = new MoonPhaseIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
