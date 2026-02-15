# FutureCreek

Interactive map experience for Styx Creek, built for GitHub Pages.

## Update map base image
- Keep the main hand-drawn map at `assets/Map.jpg`.
- If you replace it, keep the same filename for zero code changes.

## Add or update media points
- Edit `data/media.json`.
- Each item uses map-relative coordinates:
  - `x`: horizontal percentage from left (0-100)
  - `y`: vertical percentage from top (0-100)
- `src` can point to an image (`.jpg`, `.png`, `.webp`) or video (`.mp4`, `.webm`).

## Local preview
```bash
python3 -m http.server 4174
```
Open `http://127.0.0.1:4174`.

## GitHub Pages
This repo is intended to publish from `main` branch, root (`/`).
