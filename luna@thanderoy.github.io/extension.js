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

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { MoonPhaseIndicator } from './utils/moonPhaseIndicator.js';

export default class MoonPhaseIndicatorExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new MoonPhaseIndicator(this);
        this._addToPanel();

        this._positionChangedId = this._settings.connect(
            'changed::panel-position',
            () => this._repositionIndicator()
        );
    }

    disable() {
        if (this._positionChangedId) {
            this._settings.disconnect(this._positionChangedId);
            this._positionChangedId = null;
        }
        this._settings = null;

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    _addToPanel() {
        const box = this._settings.get_string('panel-position');
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, box);
    }

    _repositionIndicator() {
        // Unregister from statusArea without destroying the indicator
        delete Main.panel.statusArea[this.uuid];

        // Remove from whichever box currently holds the indicator
        for (const box of [Main.panel._leftBox, Main.panel._centerBox, Main.panel._rightBox]) {
            if (box.contains(this._indicator)) {
                box.remove_child(this._indicator);
                break;
            }
        }

        this._addToPanel();
    }
}
