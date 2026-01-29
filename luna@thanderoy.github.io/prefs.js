/**
 * Luna Extension Preferences
 *
 * GTK4/Adwaita preferences page for Luna - Moon Phase Indicator
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class LunaPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Create a preferences page
        const page = new Adw.PreferencesPage({
            title: 'Settings',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // Location settings group
        const locationGroup = new Adw.PreferencesGroup({
            title: 'Location Settings',
            description: 'Configure your viewing location',
        });
        page.add(locationGroup);

        // Hemisphere selection (ComboRow dropdown)
        const hemisphereRow = new Adw.ComboRow({
            title: 'Hemisphere',
            subtitle: 'Moon phases appear mirrored in the southern hemisphere',
            model: Gtk.StringList.new(['Northern', 'Southern']),
        });
        locationGroup.add(hemisphereRow);

        // Set initial value from settings
        const currentHemisphere = settings.get_string('hemisphere');
        hemisphereRow.selected = currentHemisphere === 'southern' ? 1 : 0;

        // Bind ComboRow to settings
        hemisphereRow.connect('notify::selected', () => {
            const value = hemisphereRow.selected === 1 ? 'southern' : 'northern';
            settings.set_string('hemisphere', value);
        });

        // Update ComboRow when settings change externally
        settings.connect('changed::hemisphere', () => {
            const value = settings.get_string('hemisphere');
            hemisphereRow.selected = value === 'southern' ? 1 : 0;
        });

        // Update settings group
        const updateGroup = new Adw.PreferencesGroup({
            title: 'Update Settings',
            description: 'Configure how often Luna recalculates moon phase data',
        });
        page.add(updateGroup);

        // Update interval row
        const intervalRow = new Adw.SpinRow({
            title: 'Update Interval',
            subtitle: 'How often to update the display (in minutes)',
            adjustment: new Gtk.Adjustment({
                lower: 15,
                upper: 1440,
                step_increment: 15,
                page_increment: 60,
                value: settings.get_int('update-interval') / 60,
            }),
        });
        updateGroup.add(intervalRow);

        // Bind the spin row to settings (convert minutes to seconds)
        intervalRow.adjustment.connect('value-changed', () => {
            const minutes = intervalRow.adjustment.value;
            settings.set_int('update-interval', minutes * 60);
        });

        // Update spin row when settings change externally
        settings.connect('changed::update-interval', () => {
            intervalRow.adjustment.value = settings.get_int('update-interval') / 60;
        });

        // About group
        const aboutGroup = new Adw.PreferencesGroup({
            title: 'About',
        });
        page.add(aboutGroup);

        // About row
        const aboutRow = new Adw.ActionRow({
            title: 'Luna - Moon Phase Indicator',
            subtitle: `Version ${this.metadata.version} • Uses astronomical calculation`,
        });
        aboutGroup.add(aboutRow);

        // GitHub link
        const githubRow = new Adw.ActionRow({
            title: 'Source Code',
            subtitle: 'github.com/thanderoy/luna',
            activatable: true,
        });
        githubRow.add_suffix(new Gtk.Image({
            icon_name: 'go-next-symbolic',
        }));
        githubRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri('https://github.com/thanderoy/luna', null);
        });
        aboutGroup.add(githubRow);

        // Donate row
        const donateRow = new Adw.ActionRow({
            title: 'Support Development',
            subtitle: 'Buy me a coffee ☕',
            activatable: true,
        });
        donateRow.add_suffix(new Gtk.Image({
            icon_name: 'go-next-symbolic',
        }));
        donateRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri('https://buymeacoffee.com/thanderoy', null);
        });
        aboutGroup.add(donateRow);
    }
}
