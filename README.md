# Salesforce Enhancer

Salesforce Enhancer is a browser extension for Salesforce Lightning Experience with deep workspace and tab management for **Lightning Console apps** (such as Service Console, Sales Console, and custom Console apps) alongside Lightning-wide productivity tools like Quick Views pinning, composable Custom Plugins (`.sfe.json`), developer themes, and custom loading animations.

## Features

### Lightning Console Apps

These features activate automatically inside Lightning Console apps and stay out of the way in Standard Navigation apps and Setup:

- **Subtabs & Shortcuts**:
  - `Alt+Click` opens records as subtabs (`Alt+Shift+Click` in the background); `Cmd/Ctrl+Click` opens new primary workspace tabs (`Cmd/Ctrl+Shift+Click` in the background). Outside Console apps, native browser `Cmd/Ctrl+Click` behavior is preserved.
  - Bidirectional tab drag-and-drop to convert workspaces into subtabs, promote subtabs into workspaces, or move subtabs between workspaces, with a confirmation prompt before merging a workspace that contains multiple tabs.
  - Optional toggle for a compact Console header that hides the Console app label and condenses the active Console navigation item into an icon button.
- **Customizable Tab & Subtab Keybinds**: Navigate continuously across visible workspaces, **"More"** overflow tabs, and subtabs, reorder tabs/subtabs left or right (including pinned tabs within the pinned group), promote subtabs, move tabs across workspaces, and close active tabs via keyboard shortcuts. All shortcuts can be rebound or cleared on the Extension Site's **Keybinds** page.
- **Link Interceptor**: Routes external Salesforce Lightning and Knowledge article links (`/lightning/...`, `/articles/...`, `/lightning/articles/...`) into an open Lightning Console tab instead of spawning duplicate browser tabs. Standard Navigation tabs are never overwritten.

### All Salesforce Lightning Apps

- **Quick Views**: Pin favorite list views to the top of the List View Switcher dropdown with manual reordering and A–Z sorting.
- **Custom Plugins (`.sfe.json`, Schema v2)**: Composable, org-agnostic declarative plugin engine (zero `eval()`). Chain arbitrary `record`, `relatedList`, `dateStatus`, `classify`, `filter`, `dedupe`, `rollup`, `sort`, and `compute` steps and render SLDS-native UI blocks (`badgeRow`, `fieldGrid`, `metaRow`, `drawer`, `list`, `alert`) across **Hover Previews**, **Highlights Panels**, **Record Banners**, and **Right Panes / Record Sidebars** (on both Console and Standard Navigation pages, including cross-object target resolution).
- **Developer Themes**: Includes Classic SF, Gruvbox Dark/Light, Solarized Dark/Light, Nord, Dracula, One Dark, and Custom accent colors with optional navigation bar and Console tab accent styling.
- **Loading Animation**: Built-in plugin to replace the default Salesforce spinner with bundled offline presets (`Parrot`, `Nyan Cat`) or a custom uploaded GIF/image/URL, with configurable display size (`48px`–`128px`) and rotation. Disabled by default.

### Extension Experience

- **Multi-Page Extension Site**: Full browser-tab settings site (`options_ui`) with dedicated pages for **Plugins**, **Keybinds**, **Themes**, **Custom Plugins** (`.sfe.json` uploader, starter templates, live v2 validator, and JSON editor), and **Loading Animation**.
- **Offline and Private**: Runs locally with zero telemetry, zero analytics, and permissions scoped strictly to Salesforce domains.

## Custom Plugins (`.sfe.json` — Schema v2)

Custom plugins are declarative `.sfe.json` files (`"schemaVersion": 2`) executed safely with zero dynamic JavaScript. Built-in starter templates (Record Card, Related List, Alert Banner, and Multi-Hop Rollup) are included on the Extension Site's **Custom Plugins** page.

- **Mount targets (`mounts`)**: `hoverPanel`, `highlightsPanel`, `recordBanner`, and `rightPane` (either `true` for the target record's own sidebar or an object with `onObject` + `resolveTarget` steps to mount on a related object's sidebar).
- **Composable `data` steps**: `record`, `relatedList` (supports `forEach` fan-out & `attachAs`), `dateStatus`, `classify`, `filter`, `dedupe`, `rollup`, `sort`, and `compute` (`count`, `sum`, `min`, `max`, `first`, `last`, `unique`, `uniqueJoin`, `daysFromToday`, `coalesce`, `diff`, `cond`, `template`, `joinParts`, `cases`).
- **Declarative `view` blocks**: `badgeRow`, `fieldGrid`, `metaRow`, `drawer`, `list`, and `alert`, with safe `{{path || fallback | currency|number|date|upper|lower|join|default:...}}` interpolation and HTML escaping.
- **Note**: v1.4.0 is a clean break to `schemaVersion: 2` (`.sfe.json`). Legacy v1 `.mod.json` definitions are flagged in the UI and ignored until migrated.

## Default Keybinds

Shortcuts are active in Lightning Console apps, match by layout-independent `event.code`, ignore keypresses inside inputs/textareas/rich-text editors, and can be customized or cleared under **Keybinds** on the extension page.

| Action | Default Shortcut |
| --- | --- |
| Previous Workspace Tab | `Ctrl + Shift + [` |
| Next Workspace Tab | `Ctrl + Shift + ]` |
| Previous Subtab *(cycles workspace + subtabs)* | `Ctrl + Alt + [` |
| Next Subtab *(cycles workspace + subtabs)* | `Ctrl + Alt + ]` |
| Reorder Tab / Subtab Left *(including pinned tabs)* | `Ctrl + Alt + ,` |
| Reorder Tab / Subtab Right *(including pinned tabs)* | `Ctrl + Alt + .` |
| Promote Subtab to Workspace | `Ctrl + Shift + \` |
| Move Tab / Subtab to Previous Workspace | `Ctrl + Shift + ,` |
| Move Tab / Subtab to Next Workspace | `Ctrl + Shift + .` |
| Close Active Tab / Subtab | `Ctrl + Shift + Backspace` |

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

- **Chromium (Manifest V3)**: Declares `page-script.js` in the `MAIN` execution world (`"world": "MAIN"`), allowing direct access to Salesforce's global `window.$A` object and Console Workspace API while adhering to Salesforce's Content Security Policy (CSP).
- **Firefox (Manifest V2)**: Injects `page-script.js` into the page context and bridges settings/events with `content.js` via `window.postMessage`, validating `origin` on every event.
- **Security**: Origin validation is enforced across cross-frame communications, color inputs are validated with regular expressions, and navigation targets are sanitized to block `javascript:`, `data:`, and `vbscript:` URIs.

## License

This project is licensed under the [MIT License](LICENSE).
