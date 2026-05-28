# AnimePahe Client

A desktop app that connects your [MyAnimeList](https://myanimelist.net) library with [AnimePahe](https://animepahe.pw) streaming — search, watch, and automatically sync your progress, all in one window.

> **Vibe coded** with [Claude](https://claude.ai). Expect rough edges.

## Features

- Browse and search AnimePahe
- Stream episodes in an embedded player (1080p / 720p / 480p / 360p, JP or EN dub)
- MAL OAuth integration — connect your MAL account and sync watch progress automatically
- Auto-advance status from *Plan to Watch* → *Watching* → *Completed*
- Remembers your preferred audio and resolution between sessions
- Custom frameless window with a dark UI

## Requirements

- Windows (built and tested on Windows 10/11)
- Node.js 20+
- A [MyAnimeList API application](https://myanimelist.net/apiconfig) (free, takes ~1 minute to create)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/animepahoclient.git
cd animepahoclient
npm install
```

### 2. Create a MAL API application

The app requires your own MAL OAuth credentials. This is free and only takes a moment:

1. Go to [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig)
2. Click **Create ID**
3. Fill in any app name (e.g. *AnimePahe Client*)
4. Set **App Redirect URL** to exactly: `http://localhost:18765/callback`
5. Copy your **Client ID** and **Client Secret**

You'll paste these into the app's Settings page on first launch.

### 3. Run

```bash
npm run dev
```

On first launch a browser check window will appear briefly — this is the DDoS-Guard challenge for AnimePahe, it closes automatically once solved.

## Building a distributable

```bash
npm run package
```

Output goes to `out/`. The result is a portable Windows directory (no installer).

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) for state
- [Axios](https://axios-http.com/) + [Cheerio](https://cheerio.js.org/) for AnimePahe scraping
- MAL [v2 API](https://myanimelist.net/apiconfig/references/api/v2) with PKCE OAuth 2.0

## Disclaimer

This app scrapes AnimePahe for personal use. It does not host or redistribute any content. Use responsibly and in accordance with AnimePahe's and MAL's terms of service.

## License

MIT
