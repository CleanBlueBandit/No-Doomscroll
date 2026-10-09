# No Scroll

A Chrome extension that blocks the infinite-scroll mechanic on short-form video feeds, so you can watch the video you came for without getting pulled into the next one, and the next one, and the next one.

## What it does

On supported sites, No Scroll takes away the ways you'd normally move to the next video:

- **Mouse wheel / trackpad scrolling** is blocked.
- **Arrow Down key** is blocked.
- **Touch scrolling** (`touchmove`) is blocked.
- **"Next video" navigation buttons** are removed from the page.

So basically you can't scroll if you dont start inventing new ways to go to the next video, which if you are, why the hell would you download this extension.

The current video stays put. You can still play, pause, seek and interact with it as usual.

The toolbar popup also shows two counters: how many times the extension stepped in on a supported page, and how many scroll attempts it has blocked.

## Supported sites

| Site | Matched URL fragment | "Next" control removed |
| --- | --- | --- |
| YouTube Shorts | `www.youtube.com/shorts` | `[aria-label="Next video"]` |
| Instagram Reels | `www.instagram.com/reels` | `[aria-label="Navigate to next reel"]` |
| Facebook Reels | `www.facebook.com/reel` | `[aria-label="Next card"]` |
| TikTok | `www.tiktok.com` | `[data-key-interaction="feed_nav_next"]` |

This list lives in [`selectors.json`](selectors.json). Blocking only activates when the current URL contains one of these fragments, and it switches off again when you navigate to a page that doesn't (for example, from Shorts back to the regular YouTube home page).

## Installation

No Scroll isn't on the Chrome Web Store, so you load it as an unpacked extension:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. Open a supported site and the extension is active.

## How it works

The extension is built on Manifest V3. A content script (`content.js`) is injected into pages and decides on its own whether the current page should be blocked.

1. On load, the script fetches `selectors.json`, which maps a URL fragment to the CSS selector of that site's "next" button.
2. A loop runs every 50 ms. It checks whether the current URL contains one of the fragments. This is how it follows single-page-app navigation without a page reload.
3. On a supported page, it removes the matching "next" button from the DOM, if present.
4. While a supported page is active, the following listeners are in effect:

| Mechanism | What it does |
| --- | --- |
| `wheel` listener | Calls `preventDefault()` in the capture phase with `passive: false`, which stops scroll-based navigation. |
| `touchmove` listener | Same approach for touch input. |
| `keydown` listener | Swallows `ArrowDown` with `preventDefault()` and `stopImmediatePropagation()` before the site's own handlers see it. |

### Stats

The popup reads two values from `chrome.storage.local`:

- `totalBlocked`: incremented each time the extension detects a supported page.
- `scrollAttempts`: incremented for blocked wheel, touch and arrow-down input. Attempts are rate-limited to one per second (so one flick of the wheel counts once) and written to storage in batches.

Everything is stored locally in your browser. Nothing is sent anywhere.

## Permissions

- `storage`: saves the two counters above.
- Content script on `<all_urls>`: the script is injected everywhere so it can react when you navigate to a supported page inside a single-page app. It does nothing on pages that don't match an entry in `selectors.json`.
- `selectors.json` is exposed as a web-accessible resource so the content script can load it.

## Adding support for a new site

1. **Add an entry to `selectors.json`.** The key is a fragment of the page URL, and the value is a CSS selector for the site's "next" button. Find the button in DevTools and use a stable attribute such as `aria-label`:

   ```json
   {
       "www.example.com/shorts": "[aria-label=\"Next video\"]"
   }
   ```

2. **Reload the extension** from `chrome://extensions` and refresh the target page.

No change to `manifest.json` or `content.js` is needed. Wheel, touch and arrow-key blocking apply automatically to every site listed in `selectors.json`.

## About the statistics

I don't need anyone's analytics, the statistics are purely local. They are there to simply give you a perspective of how much you try to scroll without even realising it, which for me, was a lot before I got used to not being able to scroll. (And I kinda like those javascript stat counters that count up so I wanted to add it)

## Why this approach

There is nothing inherently wrong with watching shorts, at least in my opinion. The issue starts when you consume them for dopamine, and that happens when you scroll. Since the extension doesn't block shorts completely, you can still watch a reel a friend sent you or a short with an interesting thumbnail. But with the element of instant scrolling disabled, you are less likely to get hooked.