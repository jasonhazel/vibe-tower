## Vibe Tower — Prototype

### Dev

```bash
npm install
npm run dev
```

- Open the printed local URL (default `http://localhost:5173`).
- Phaser is loaded from a CDN to keep the local build slim.

### Build

```bash
npm run build
npm run preview
```

### Deploying to GitHub Pages

This repo uses GitHub Actions to deploy to GitHub Pages from the `main` branch.

Steps:

1. In GitHub → Settings → Pages, choose “GitHub Actions” as the source.
2. Push to `main`. The workflow builds with Vite and publishes `dist/`.

Notes:

- The Vite `base` path is set dynamically in `vite.config.js` when running on CI to `/<repo>/`, so the app serves correctly from a subpath.
- Locally, `base` remains `/`.


