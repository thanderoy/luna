import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const RefreshButton = GObject.registerClass(
class RefreshButton extends PopupMenu.PopupBaseMenuItem {
    _init(callback) {
        super._init({
            style_class: 'refresh-button-item',
        });

        const buttonBox = new St.BoxLayout({
            x_expand: true,
            style_class: 'refresh-button-box',
            x_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(buttonBox);

        this.button = new St.Button({
            label: 'Refresh',
            style_class: 'refresh-button',
            x_align: Clutter.ActorAlign.CENTER
        });

        this.button.connect('clicked', callback);
        buttonBox.add_child(this.button);
    }
});