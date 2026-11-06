# Salesforce Enhancer

Salesforce Enhancer is a browser extension for Salesforce Lightning Experience and Service Cloud Console that adds workspace subtab management, quick view navigation, developer themes, and optional loading screen customization.

## Features

- **Workspace Subtab Management**: Automatically opens records (such as Cases) as subtabs within an existing workspace tab (such as an Account) using the Salesforce Console `workspaceAPI`. Falls back to standard navigation when operating outside a console app.
- **Quick Views Menu**: Provides a dropdown list in the extension popup to navigate directly to frequently accessed list views, queues, and object pages.
- **Developer Themes**: Offers low-strain color palettes including Gruvbox, Solarized Dark, Solarized Light, Nord, and Dracula. Styles are scoped to maintain contrast and visibility for Salesforce Lightning Design System (SLDS) progress bars, path stages, and status badges.
- **Custom Loading Screen**: Allows replacing the standard Salesforce loading animation with bundled offline presets (Party Parrot, Nyan Cat) or a custom GIF. Disabled by default.
- **Standalone Uploader Window**: Uses an independent popup window for GIF selection, supporting file browsing, drag-and-drop, and direct clipboard paste without closing when focus changes.
- **Offline and Private**: Runs entirely locally with zero telemetry, zero analytics, and no external network calls. Permissions are strictly scoped to Salesforce domains.

## Installation

### Chromium-Based Browsers (Chrome, Edge, Brave, Arc)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/etherlucid/salesforce-enhancer.git
   ```
2. Navigate to `chrome://extensions` in your browser.
3. Enable **Developer mode** in the upper-right corner.
4. Click **Load unpacked** and select the `chrome/` directory.

### Firefox

1. Clone or download this repository:
   ```bash
   git clone https://github.com/etherlucid/salesforce-enhancer.git
   ```
2. Navigate to `about:debugging#/runtime/this-firefox` in Firefox.
3. Click **Load Temporary Add-on...** and select `firefox/manifest.json`.

Packaged `.zip` archives are also available under [Releases](https://github.com/etherlucid/salesforce-enhancer/releases).

## Building from Source

To package distribution archives for both browsers:

```bash
chmod +x build.sh
./build.sh
```

Output `.zip` files are generated in the `dist/` directory:
- `dist/salesforce-enhancer-chrome.zip`
- `dist/salesforce-enhancer-firefox.zip`

## Technical Details

- **Chromium (Manifest V3)**: Declares `page-script.js` in the `MAIN` execution world (`"world": "MAIN"`), allowing direct access to Salesforce's global `window.$A` object and console APIs while adhering to Salesforce's strict Content Security Policy (CSP).
- **Firefox (Manifest V3)**: Injects the page script bridge into the DOM and communicates with the content script via `window.postMessage`, validating `origin` and `source` on every event.
- **Security**: Strict origin validation is enforced across cross-frame communications, color inputs are validated with regular expressions, and navigation targets are sanitized to prevent `javascript:` and `data:` URI execution.

## License

This project is licensed under the [MIT License](LICENSE).
