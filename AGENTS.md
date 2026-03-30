## Learned User Preferences
- Prefers direct, literal implementation of requests and quickly corrects any mismatch.
- Prefers tight, gap-free visual layouts for UI compositions.
- Prefers using the exact asset location they specify instead of alternate fallback paths when the intended file exists.
- Prefers solid, non-transparent visual overlays unless transparency is explicitly requested.
- Uses gold/old-gold as the accent color for all hover states, section title highlights, and interactive elements.
- Fine-tunes positions with incremental px nudges; apply sensible values without asking.
- Hover interaction states should be mutually exclusive (e.g., description vs contact/connect section never show together).
- Admin editing should be an overlay on `index.html` via extra JS, not a separate HTML page.

## Learned Workspace Facts
- `index.html` is used as the first portfolio page entry point.
- `data.json` currently contains five categories: painting, tattoo, illustration, batik, mural.
- `assets/bookshelf.svg` exists and is used for bookshelf visuals.
- `server.js` runs an Express server at `localhost:3000`; main route is `/nina-bejo`, admin is `/nina-bejo/admin`.
- Book IDs use `{category}-{number}` format; shelves are ordered by ID with empty slots for missing books.
- Book SVG templates/styles are stored in `data.json` and can be assigned individually per book.
- Admin mode JS is in `admin.js`, loaded as an overlay alongside `index.html`.
- `assets/tattoo-overlay.png` covers the right side of the screen and triggers the Connect section on hover.
- `cv.pdf` exists and is served for the download CV button; replaceable via admin upload.

check in a browser only if i asked
http://localhost:3000/nina-bejo/admin admi panel
http://localhost:3000/ main

IF YOU UPDATE CODE MAKE RESTART USE ./restart