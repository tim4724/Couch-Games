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
