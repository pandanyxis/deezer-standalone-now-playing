# Deezer Standalone Now Playing

Free, open-source Deezer now-playing overlays maintained by **pandanyxis**. Display the current title, artist, cover and progress without the Tuna plugin. Use the overlays in a browser or any streaming app that supports browser sources.

## Requirements

- Python 3.10 or later (no additional Python packages).
- Deezer web player at https://www.deezer.com/.
- Tampermonkey or Violentmonkey in the browser running Deezer.

## Quick start (Windows)

1. Download this repository using **Code → Download ZIP** and extract it.
2. Install Python from https://www.python.org/downloads/ if needed. Enable the Python launcher or add Python to PATH.
3. Double-click **Start.cmd**. Keep its console window open; you may minimize it.
4. Open **Deezer-Standalone.user.js** in a text editor. Copy all the code into a new script in Tampermonkey or Violentmonkey and save it. Disable your old Tuna script.
5. Reload Deezer, allow the script to connect to `127.0.0.1` if prompted, and play a song. The status badge on Deezer should say **connected**.
6. Open http://127.0.0.1:1610/ and choose your overlay.

On other platforms, run `python3 server.py` from the extracted folder. The Windows launcher is optional.

## Overlay URLs

| Style | Size | URL |
| --- | --- | --- |
| Flat | 520 × 112 | http://127.0.0.1:1610/Now-Playing-Ultra-Minimal-Flat.html |
| Glass | 540 × 118 | http://127.0.0.1:1610/Now-Playing-Ultra-Minimal-Glass.html |
| Tiny Corner | 420 × 92 | http://127.0.0.1:1610/Now-Playing-Ultra-Minimal-Tiny-Corner.html |

For OBS or similar software, add a **Browser Source**, disable **Local file**, paste the overlay URL and use the dimensions above. Open the HTML through the local server; double-clicking an HTML file does not connect it correctly. A normal browser window does not automatically float over other applications.

## How it works

The userscript reads Deezer's Media Session metadata and progress slider, then sends an update every second to the local Python server. The server listens only on `127.0.0.1:1610`; overlays poll `/state`. No hosted service, API key or Tuna installation is needed. Album artwork is loaded from the URL supplied by Deezer.

The console shows `playing | Title | Artist` when the song or status changes. `now-playing.json` is written beside the server on every received update. The on-disk file retains the last update; `/state` and `/now-playing.json` return a waiting state after 15 seconds without updates. The HTML source files themselves do not change.

Stop the server with **Ctrl+C**. No automatic startup is installed.

## Troubleshooting

- **Waiting for Deezer:** check that the userscript is enabled on Deezer, reload the tab and inspect its status badge. Starting the server alone does not provide song data.
- **No badge:** the userscript is not running. Check the extension's site access and script execution settings.
- **No connection:** keep the server running and use the HTTP overlay URL, with Local file disabled.
- **Port already in use:** stop the previous server before starting another copy.
- **Missing progress:** the script depends on Deezer's progress-slider markup. Metadata can still work without progress. Deezer updates may require selector changes.
- **Updates stop in the background:** browser tab sleeping or timer throttling may delay updates. Keep Deezer awake.
- Use one Deezer tab with this script enabled; multiple tabs overwrite each other's updates.

## Credits and license

The userscript is adapted from [Tuna by univrsal](https://github.com/univrsal/tuna), originally based on NowSniper by **Kıraç Armağan Önal**. Original author credits are retained. This standalone adaptation adds a local receiver, browser overlays, file output and connection diagnostics.

Distributed under **GNU GPL version 2 only**. See [LICENSE](LICENSE). This project is not affiliated with Deezer.
