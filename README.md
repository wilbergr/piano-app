# piano-app

An interactive piano learning app: an 88-key on-screen keyboard, song playback in Demo/Practice/Challenge modes, real-time performance feedback, and music notation rendering.

**Tech stack**: React 19, Vite 7, Tone.js 15, OpenSheetMusicDisplay.

## Development

```bash
npm install
npm run dev
```

Opens a dev server at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs a production build to `dist/`.

```bash
npm run preview
```

Serves the production build locally for a final check.

## Deployment

This app deploys to **piano.gwilber.com** via Cloudflare Pages. Cloudflare is configured to run `npm run build` and serve the `dist` directory — no manual deploy steps are needed from this repo.
