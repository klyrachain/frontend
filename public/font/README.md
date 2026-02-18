# Font assets

This folder is for **self-hosted font files** (e.g. `.woff2`, `.woff`) when you need fonts that are not available via `next/font/google`.

- Current UI fonts are loaded via Next.js font optimization in `src/app/layout.tsx` (Geist, Inter, Plus Jakarta Sans, Outfit, DM Sans, Manrope, Lexend, JetBrains Mono, IBM Plex Mono).
- To add a custom font: place the files here, then use `next/font/local` in layout and add the font to `src/config/fontPresets.ts` and theme slice.
