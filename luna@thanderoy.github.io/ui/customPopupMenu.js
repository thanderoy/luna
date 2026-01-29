/**
 * Custom Popup Menu for Luna
 *
 * Displays moon phase information in a styled popup layout
 * with hero section and details grid.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const CustomPopupMenu = GObject.registerClass(
class CustomPopupMenu extends PopupMenu.PopupBaseMenuItem {
    _init(onRefresh) {
        super._init({
            reactive: false,
            can_focus: false,
            style_class: 'moon-popup-container'
        });

        this._onRefresh = onRefresh;
        this._buildLayout();
    }

    _buildLayout() {
        // Main container
        this._mainContainer = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'moon-popup-content'
        });
        this.add_child(this._mainContainer);

        // =========================================
        // SECTION 1: Header (Refresh button)
        // =========================================
        const headerBox = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.END,
            x_expand: true
        });

        const refreshBtn = new St.Button({
            style_class: 'button icon-button refresh-button',
            can_focus: true
        });
        const refreshIcon = new St.Icon({
            icon_name: 'view-refresh-symbolic',
            style_class: 'popup-menu-icon'
        });
        refreshBtn.set_child(refreshIcon);
        refreshBtn.connect('clicked', () => {
            if (this._onRefresh) this._onRefresh();
        });

        headerBox.add_child(refreshBtn);
        this._mainContainer.add_child(headerBox);

        // =========================================
        // SECTION 2: Hero Section (Icon & Main Info)
        // =========================================
        const heroBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            style_class: 'hero-section'
        });

        // Moon icon (large)
        this._moonIcon = new St.Icon({
            icon_name: 'weather-clear-night-symbolic',
            icon_size: 80,
            style_class: 'moon-main-icon'
        });

        // Phase title
        this._phaseTitle = new St.Label({
            text: '',
            style_class: 'phase-title',
            x_align: Clutter.ActorAlign.CENTER
        });

        // Illumination label
        this._illuminationLabel = new St.Label({
            text: '',
            style_class: 'illumination-label',
            x_align: Clutter.ActorAlign.CENTER
        });

        heroBox.add_child(this._moonIcon);
        heroBox.add_child(this._phaseTitle);
        heroBox.add_child(this._illuminationLabel);
        this._mainContainer.add_child(heroBox);

        // =========================================
        // SECTION 3: Details Section
        // =========================================
        const detailsBox = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'details-section'
        });

        // Next Phase row (centered)
        const nextPhaseRow = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true
        });
        nextPhaseRow.add_child(new St.Label({
            text: 'Next Phase: ',
            style_class: 'dim-label'
        }));
        this._nextPhaseValue = new St.Label({
            text: '',
            style_class: 'value-label'
        });
        nextPhaseRow.add_child(this._nextPhaseValue);
        detailsBox.add_child(nextPhaseRow);

        // Two-column grid (Distance & Age)
        const columnsContainer = new St.BoxLayout({
            vertical: false,
            x_expand: true,
            style_class: 'columns-container'
        });

        // Left column (Distance)
        const distCol = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER
        });
        distCol.add_child(new St.Label({
            text: 'DISTANCE',
            style_class: 'dim-label small-caps-label',
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true
        }));
        this._distanceValue = new St.Label({
            text: '',
            style_class: 'value-label-large',
            x_align: Clutter.ActorAlign.CENTER
        });
        distCol.add_child(this._distanceValue);

        // Right column (Age)
        const ageCol = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER
        });
        ageCol.add_child(new St.Label({
            text: 'AGE',
            style_class: 'dim-label small-caps-label',
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true
        }));
        this._ageValue = new St.Label({
            text: '',
            style_class: 'value-label-large',
            x_align: Clutter.ActorAlign.CENTER
        });
        ageCol.add_child(this._ageValue);

        columnsContainer.add_child(distCol);
        columnsContainer.add_child(ageCol);
        detailsBox.add_child(columnsContainer);

        this._mainContainer.add_child(detailsBox);
    }

    updateData(data) {
        if (!data) return;

        if (data.phaseName) this._phaseTitle.text = data.phaseName;
        if (data.illumination !== undefined) {
            this._illuminationLabel.text = `${data.illumination}% Illumination`;
        }
        if (data.nextPhase) this._nextPhaseValue.text = data.nextPhase;
        if (data.distance) this._distanceValue.text = `${data.distance} km`;
        if (data.age) this._ageValue.text = `${data.age} Days`;
    }

    setMoonIcon(gicon, flipHorizontal = false) {
        if (gicon) {
            this._moonIcon.gicon = gicon;
            // Apply horizontal flip for southern hemisphere
            this._moonIcon.set_pivot_point(0.5, 0.5);
            this._moonIcon.set_scale(flipHorizontal ? -1 : 1, 1);
        }
    }
});
