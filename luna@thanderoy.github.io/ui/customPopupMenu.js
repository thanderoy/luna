import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const CustomPopupMenu = GObject.registerClass(
class CustomPopupMenu extends PopupMenu.PopupBaseMenuItem {
    _init(gettext) {
        this._ = gettext;
        super._init({
            reactive: false,
            can_focus: false,
            style_class: 'styled-menu-item moon-phase-menu'
        });

        // Container for all content
        this.container = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'styled-container'
        });
        this.add_child(this.container);

        // Current Phase Label
        this.headerLabel = new St.Label({
            text: this._('CURRENT PHASE:'),
            style_class: 'header-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        this.container.add_child(this.headerLabel);

        // Current Phase Value
        this.phaseLabel = new St.Label({
            text: '',
            style_class: 'phase-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        this.container.add_child(this.phaseLabel);

        // Illumination info
        this.illuminationLabel = new St.Label({
            text: '',
            style_class: 'illumination-label',
            x_align: Clutter.ActorAlign.CENTER
        });
        this.container.add_child(this.illuminationLabel);

        // Next phase section
        this.nextPhaseBox = new St.BoxLayout({
            style_class: 'next-phase-box info-box',
            x_expand: true
        });
        this.container.add_child(this.nextPhaseBox);

        this.nextPhaseLabel = new St.Label({
            text: this._('NEXT PHASE:'),
            style_class: 'next-phase-label info-label',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.nextPhaseBox.add_child(this.nextPhaseLabel);

        this.nextPhaseValue = new St.Label({
            text: '',
            style_class: 'next-phase-value info-value',
            x_expand: false,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.nextPhaseBox.add_child(this.nextPhaseValue);

        // Separator
        this.separator = new St.BoxLayout({
            style_class: 'separator'
        });
        this.container.add_child(this.separator);

        // Distance section
        this.distanceBox = new St.BoxLayout({
            style_class: 'distance-box info-box',
            x_expand: true
        });
        this.container.add_child(this.distanceBox);

        this.distanceLabel = new St.Label({
            text: this._('DISTANCE:'),
            style_class: 'distance-label info-label',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.distanceBox.add_child(this.distanceLabel);

        this.distanceValue = new St.Label({
            text: '',
            style_class: 'distance-value info-value',
            x_expand: false,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.distanceBox.add_child(this.distanceValue);

        // Age section
        this.ageBox = new St.BoxLayout({
            style_class: 'age-box info-box',
            x_expand: true
        });
        this.container.add_child(this.ageBox);

        this.ageLabel = new St.Label({
            text: this._('AGE:'),
            style_class: 'age-label info-label',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.ageBox.add_child(this.ageLabel);

        this.ageValue = new St.Label({
            text: '',
            style_class: 'age-value info-value',
            x_expand: false,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.ageBox.add_child(this.ageValue);

        // Final separator
        this.separator2 = new St.BoxLayout({
            style_class: 'separator'
        });
        this.container.add_child(this.separator2);
    }

    updateData(data) {
        if (!data) return;

        if (data.phaseName) this.phaseLabel.text = data.phaseName;
        if (Object.prototype.hasOwnProperty.call(data, 'illumination')) this.illuminationLabel.text = this._('(Illumination: {value}%)').replace('{value}', data.illumination);
        if (data.nextPhase) this.nextPhaseValue.text = data.nextPhase;
        if (Object.prototype.hasOwnProperty.call(data, 'distance')) this.distanceValue.text = this._('{value} km').replace('{value}', data.distance);
        if (Object.prototype.hasOwnProperty.call(data, 'age')) this.ageValue.text = this._('{value} Days').replace('{value}', data.age);
    }

    setPhase(phaseName) {
        this.phaseLabel.text = phaseName;
    }

    setIllumination(value) {
        this.illuminationLabel.text = `(Illumination: ${value}%)`;
    }

    setNextPhase(phaseName) {
        this.nextPhaseValue.text = phaseName;
    }

    setDistance(distance) {
        this.distanceValue.text = `${distance} km`;
    }

    setAge(age) {
        this.ageValue.text = `${age} Days`;
    }
});