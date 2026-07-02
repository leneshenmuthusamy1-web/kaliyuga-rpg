# Gambling Site Blocker

A browser extension (Manifest V3 — works in Chrome, Edge, Brave, and other
Chromium-based browsers) that blocks online casinos, sportsbooks, poker rooms,
and daily-fantasy gambling sites.

## Features

- **111 known gambling domains blocked out of the box** (bet365, DraftKings,
  FanDuel, PokerStars, 888casino, Bovada, BetMGM, Stake, and more — see
  `domains.js`).
- **Add your own sites** to block from the popup or the settings page.
- **One-click pause/resume** if you need to temporarily disable blocking.
- **Blocked-attempt counter** so you can see how many times a gambling site
  was stopped.
- Uses Chrome's `declarativeNetRequest` API — blocking happens entirely
  on-device, with no browsing history sent anywhere.

## Installing it

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `gambling-blocker-extension/`
   folder.
4. Pin the extension for quick access (puzzle-piece icon → pin).

## How it works

- `rules/gambling-domains.json` is a static [declarativeNetRequest] ruleset
  that redirects top-level navigation to blocked sites to `blocked.html`, and
  blocks any sub-resource requests (ads, embeds, XHR) to the same domains.
- `background.js` is the service worker. It keeps the built-in ruleset and a
  dynamic ruleset (built from your custom blocklist in `chrome.storage.local`)
  in sync with the on/off toggle.
- The popup (`popup.html`/`.js`) and options page (`options.html`/`.js`) both
  read/write the same `chrome.storage.local` state (`enabled`,
  `customDomains`, `blockedCount`), so they always agree.

[declarativeNetRequest]: https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest

## Customizing the built-in list

Edit the `CURATED_GAMBLING_DOMAINS` array in `domains.js`, then regenerate
`rules/gambling-domains.json` from it (keeps the popup/options display and
the actual blocking rules in sync):

```js
node -e '
const fs = require("fs");
const src = fs.readFileSync("domains.js", "utf8");
const list = JSON.parse(src.match(/const CURATED_GAMBLING_DOMAINS = (\[[\s\S]*?\]);/)[1]);
const subTypes = ["sub_frame","stylesheet","script","image","font","object","xmlhttprequest","ping","media","websocket","other"];
fs.writeFileSync("rules/gambling-domains.json", JSON.stringify([
  { id: 1, priority: 2, action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } }, condition: { requestDomains: list, resourceTypes: ["main_frame"] } },
  { id: 2, priority: 1, action: { type: "block" }, condition: { requestDomains: list, resourceTypes: subTypes } }
], null, 2) + "\n");
'
```

Reload the extension from `chrome://extensions` after editing.

## Limitations

- Only covers Chromium-based browsers loaded via this extension. It does not
  block gambling apps outside the browser, or other browsers (Firefox/Safari)
  you might also have installed.
- The built-in list is a curated snapshot of well-known gambling sites, not
  an exhaustive registry — add any site that's missing via the popup or
  options page.
- A determined user can always disable or remove the extension from
  `chrome://extensions`; this tool is a friction/accountability aid, not a
  tamper-proof lock. If you want it harder to turn off yourself, consider
  asking someone you trust to hold the browser profile password or use OS-level
  parental controls in addition to this extension.
