
# Kiddo Tunes

A minimal, kid-friendly web app to curate favorite nursery rhymes and search YouTube safely, plus two brain games (Memory Match and Pattern Tap).

## Features
- Curated favorites grid (edit `/frontend/data/favorites.js`)
- Locked search with parent gate (3+4 question)
- Backend proxy to YouTube Search with `safeSearch=strict` and optional channel whitelist
- Big, high-contrast UI, break reminders, session timer, autoplay toggle (off by default)
- Local settings for allowed channel IDs, theme, autoplay policy
- Mini games: Memory Match, Pattern Tap

## Quick Start

### Backend (Render free or local)
1. Get a YouTube Data API v3 key (Google Cloud → APIs & Services → Enable YouTube Data API v3 → Credentials).
2. `cd backend && npm i`
3. Copy `.env.example` to `.env` and set `YT_API_KEY`.
4. `npm start` (defaults to `http://localhost:8080`)

### Frontend (Netlify/Cloudflare Pages/Vercel static deploy)
1. Serve `/frontend` locally: `npx serve ./frontend` (or any static server)
2. In `/frontend/index.html`, set `window.__API_BASE__` to your backend origin (e.g., `"https://your-api.onrender.com"`).

### Free Hosting Tips
- **Backend**: Render.com free Web Service (Node). Add `YT_API_KEY` env var.
- **Frontend**: Netlify/Cloudflare Pages (drag-and-drop the `frontend` folder).

## Safety Notes
- Default search is locked until parent gate is passed.
- Use `whitelistOnly` toggle for channel-only results.
- Favorites are fully controlled by you; paste YouTube video IDs you trust.
- Autoplay is off by default; you can force-disable it in Settings.

## Customization
- Update favorites in `frontend/data/favorites.js`.
- Add more safe channel IDs in Settings or via `ALLOWED_CHANNELS` env on the API.
- Tweak filters in `backend/server.js` (`isKidSafeTitle`).

## License
MIT
