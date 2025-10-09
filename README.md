# Travel Bucket List Map

This travel bucket list map is a beautiful, responsive web app built by [Teda.dev](https://teda.dev), the simplest AI app builder for regular people. It lets you place pins on a world map, attach notes and photos, and track your progress from want to visit through planned to visited.

Features

- Click or tap the map to drop a new pin. Use the Add button or press N to start placing a pin.
- Pins store: title, status (want, planned, visited), notes, and a photo stored locally as a data URL.
- Edit, delete, and view pins. Photos and notes persist in your browser localStorage so your travel list survives reloads.
- Sidebar list, search, and filters. Progress bar shows your visited ratio.
- Accessible markup, keyboard shortcuts, reduced motion support, and touch friendly targets.

Files

- index.html - Main HTML, includes Tailwind and jQuery and a small Tailwind component layer.
- styles/main.css - Custom CSS for pins, modal preview, and accessibility.
- scripts/helpers.js - Storage and utility helpers. Exposes window.App.Storage and window.App.Utils.
- scripts/ui.js - UI rendering and event handling. Defines window.App.init and window.App.render and public methods for pin operations.
- scripts/main.js - App entry that initializes the application on document ready.

Notes and privacy

All data is stored locally in your browser localStorage. Photos are converted to data URLs and stored locally as well. No data is sent to any servers.

Enjoy and happy travels!
