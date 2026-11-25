# Feedly Floating Navigation

A Chrome extension that adds three draggable, transparent circular buttons to Feedly.

## Features

- Previous topic button (default: `K`)
- Mark read / unread button (default: `M`)
- Next topic button (default: `N`)
- Customizable single-character keyboard shortcuts
- Drag any button to move the entire button stack
- Automatically remembers the button position and shortcut settings
- Automatically displays Traditional Chinese or English based on Chrome's UI language
- Unsupported languages fall back to English
- Chrome Extension Manifest V3

## Installation

1. Download and extract the ZIP package from GitHub Releases.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `Feedly-Floating-Navigation` folder containing `manifest.json`.
6. Refresh the Feedly tab.

## Usage

- Click the top button for the previous topic (default: `K`).
- Click the middle letter button to mark an item read / unread (default: `M`).
- Click the bottom button for the next topic (default: `N`).
- Press and drag any button to move the entire button stack. Its position is saved automatically.
- Click the extension icon in Chrome's toolbar to customize all three shortcuts.
- The letter shown on the middle button always reflects its current shortcut.

## Localization

The extension uses Chrome's built-in i18n system:

- `zh_TW`: Traditional Chinese
- `en`: English (default and fallback)

The language follows Chrome's UI language. No manual language setting is required.

## Notes

The extension dispatches synthetic keyboard events so Feedly can handle actions using its own shortcut logic. Browser or website changes may affect how synthetic keyboard events are handled.
