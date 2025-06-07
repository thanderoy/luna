# 🌙 Luna - Moon Phase Indicator

Luna is a simple GNOME Shell extension that displays the current moon phase directly in your top bar. With beautiful custom icons and real-time updates, Luna helps you stay attuned to lunar cycles throughout your day.

---

## ✨ Features

- Shows the current moon phase as a panel icon
- Hoverable popup with:
  - Current phase name
  - Next phase
  - Illumination percentage
  - Distance (Meridian)
  - Age of the moon phase
- Refresh button for manual updates
- Updates automatically every hour
- Lightweight and unobtrusive

---

## 📷 Screenshots

> On top bar

![alt text](src/images/TopBar.png)

> Next phase, illumination %

![alt text](<src/images/PanelMenu.png>)

---

## 🛠 Installation

### 🔌 From GNOME Extensions Website

Once published, you’ll be able to install Luna from [extensions.gnome.org](https://extensions.gnome.org).
Make sure you have [GNOME Shell integration](https://wiki.gnome.org/Projects/GnomeShellIntegration) enabled for your browser.

### 💻 Manual Installation (Development or Sideloading)

```bash
git clone https://github.com/thanderoy/luna.git
cp -r luna/ ~/.local/share/gnome-shell/extensions/luna@thanderoy.github.io
gnome-extensions enable luna@thanderoy.github.io
```

---

## Adding Translations

This extension supports internationalization and can be translated into multiple languages. Translations are managed using Gettext `.po` files located in the `luna@thanderoy.github.io/po/` directory.

To add a new translation for your language:

1.  **Identify your language code:** Use the standard ISO 639-1 two-letter code (e.g., `es` for Spanish, `de` for German).
2.  **Create your language file:**
    *   Navigate to the `luna@thanderoy.github.io/po/` directory.
    *   Copy the translation template `luna.pot` to a new file named `<your_language_code>.po`. For example, for Spanish, you would copy `luna.pot` to `es.po`.
3.  **Translate the strings:**
    *   Open your new `<your_language_code>.po` file in a text editor that supports UTF-8 encoding.
    *   **Update the header:**
        *   Modify the `PO-Revision-Date` to the current date and time (e.g., `2024-03-17 15:00+0000`).
        *   Change `Last-Translator` to your name and email address.
        *   Update `Language-Team` to reflect the language (e.g., `Spanish <your_email@example.com>`).
        *   Set the `Language` field to your language code (e.g., `es`).
        *   Verify and update `Plural-Forms` if your language has different pluralization rules than English. You can find information on common plural forms [here](https://www.gnu.org/software/gettext/manual/html_node/Plural-forms.html).
        *   Ensure the line `#, fuzzy` is removed if it appears directly above `msgid ""`.
    *   **Translate messages:** For each `msgid` (original English string), provide the translation in the `msgstr` field directly below it.
        Example:
        ```po
        #: ../utils/moonPhaseIndicator.js
        msgid "New Moon"
        msgstr "Luna Nueva"
        ```
4.  **Save the file:** Ensure the file is saved with UTF-8 encoding.

Once your `.po` file is correctly placed in the `po/` directory, GNOME Shell should automatically use it if the system language matches the language of your translation.
For more detailed information on the `.po` file format and Gettext, you can consult the [GNU Gettext Manual](https://www.gnu.org/software/gettext/manual/).
