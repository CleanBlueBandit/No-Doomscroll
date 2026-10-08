# No Scroll
 
A Chrome extension that blocks the infinite-scroll mechanic on short-form video feeds, so you can watch the video you came for without getting pulled into the next one, and the next one, and the next one.
 
## What it does
 
On supported sites, No Scroll takes away the ways you'd normally move to the next video:
 
- **Mouse wheel / trackpad scrolling** is blocked.
- **Arrow Down key** is blocked.
- **Touchpad scrolling** is blocked.
- **"Next video" navigation buttons** are removed from the page.

The current video stays put. You can still play, pause, seek and interact with it as usual.
 
## Installation
 
No Scroll isn't on the Chrome Web Store, so you load it as an unpacked extension:
 
1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. Open a supported site and the extension is active.
## How it works
 
The extension is built on Manifest V3 and injects a content script into matching pages.
 
| Mechanism | What it does |
| --- | --- |
| `wheel` listener | Calls `preventDefault()` in the capture phase with `passive: false`, which stops scroll-based navigation. |
| `keydown` listener | Swallows `ArrowDown` with `preventDefault()` and `stopImmediatePropagation()` before the site's own handlers see it. |
| Polling loop | Every 50 ms, looks for the site's "next video" button (by `aria-label`) and removes it from the DOM. |
 
## Project structure
 
```
No-Scroll/
├── manifest.json   # Extension manifest (MV3), content script + site matches
├── content.js      # Core logic: blocks scroll, arrow key, removes next buttons
├── popup.html      # Toolbar popup UI
├── popup.js        # Popup logic (currently a debugging stub)
├── popup.css       # Popup styles
└── icon.png        # Extension icon
```
 
## Supported sites
 
Supported sites are defined by the `matches` patterns in the `content_scripts` section of `manifest.json`. The extension is designed to grow beyond its current list.
 
## Adding support for a new site
 
1. **Add the URL pattern** to `matches` in `manifest.json`:
```json
   "matches": [
       "https://example.com/shorts/*"
   ]
```
 
2. **Add the site's "next" control selector** in `content.js`, inside the `main()` loop. Find the button in DevTools and use a stable attribute such as `aria-label`:
```js
   const scrolldown =
       document.querySelector('[aria-label="Next video"]') ||
       document.querySelector('[aria-label="Navigate to next reel"]') ||
       document.querySelector('[aria-label="Your new selector"]');
```
 
3. **Reload the extension** from `chrome://extensions` and refresh the target page.
Wheel and arrow-key blocking apply to every matched page automatically, so many sites need only steps 1 and 3.

 
## Why this approach

There is nothing inherintly wrong with viewing shorts (at least in my opinion). The issue starts when you consume shorts for dopamine, and that happens when you scroll. Since the extension doesnt block shorts completely, you can still watch a reel a friend sent you or watch a short with interesting thumbnail, but since the element of instant scrolling is disabled, you are less likely to get addicted.