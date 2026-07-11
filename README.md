# couch-games.com

Static landing site for **Couch Games** — the umbrella brand for party games
where everyone plays together on the TV/screen and phones are the controllers
(scan a QR to play, no install required).

Flagship game: **HexStacker Party** (live at [hexstacker.com](https://hexstacker.com),
coming to Apple TV & Android TV). Also in development: **Tiny Track** (kart
racer) and **Powder** (skiing).

## Design

Neutral **MONO graphite chrome**, mirroring the Couch Games Controller launcher
(console-shell pattern — the game posters carry the color, the chrome stays
neutral). Stock system type, Material 3 surface values, follows the system
light/dark setting. Tokens live in `assets/theme.css`.

## Structure

- `index.html` — landing page (games, how-it-works)
- `room.html` — room join page, served at `/<CODE>#<instance>` (nginx maps any
  6-char base58 path to it). Browser fallback for the app deep links in
  `.well-known/`: resolves the code via the relay directories, shows the room,
  and offers browser play + the app stores. A join target that doesn't vet
  against the manifest's host allow-list renders as "Room not found" — we never
  link a game we can't identify. Store URLs/sizes are constants atop
  `assets/room.js` — fill them in when the apps go live.
- `games-manifest.json` — web-served counterpart of the controller apps'
  bundled manifest (same schema; art paths point at `/assets/artwork/`).
  Drives the room page's game names, art, host allow-list, and per-game
  relays; the apps are meant to fetch it at runtime later so a new game or
  banner change is one site deploy. Keep it in sync with
  `Couch-Games-Controller/android/app/src/main/assets/games-manifest.json`.
- `privacy.html` — Datenschutzerklärung (German, DSGVO; umbrella policy for
  couch-games.com and every offering on the shared infra — the web games, the
  Couch Games app and the TV apps; also covers future games on the same infra,
  regardless of the domain or subdomain they ship on)
- `imprint.html` — Impressum (German, § 5 DDG)
- `assets/theme.css` — design tokens (graphite chrome, light/dark)
- `assets/legal.css` — shared styles for the legal pages
- `assets/artwork/*.webp` — 16×9 game posters (mirrored from the controller repo)

Legal text originated from HexStacker's policy and has been broadened to the
Couch Games umbrella (couch-games.com plus all games on the shared servers/
infra), so it no longer tracks the hexstacker.com copy verbatim. Operator is
Tim Vogel, info@couch-games.com. Serve any way you like — it's fully static.

## Local preview

```sh
python3 -m http.server 8000
```
