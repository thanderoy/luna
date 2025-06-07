import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const RefreshButton = GObject.registerClass(
    class RefreshButton extends PopupMenu.PopupBaseMenuItem {
        _init(gettext, callback) {
            this._ = gettext;
            super._init({
                style_class: 'refresh-button-item',
                reactive: false,
                can_focus: false,
            });

            const buttonBox = new St.BoxLayout({
                x_expand: true,
                style_class: 'info-box',
                x_align: Clutter.ActorAlign.CENTER
            });
            this.add_child(buttonBox);

            this.button = new St.Button({
                label: this._('Refresh'),
                style_class: 'refresh-button',
                x_align: Clutter.ActorAlign.CENTER,
                reactive: true,
                can_focus: true,
            });

            this.button.connect('clicked', callback);
            buttonBox.add_child(this.button);
        }
    }
);
