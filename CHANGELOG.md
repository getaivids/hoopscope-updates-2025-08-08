# Changelog — 2025-08-08

## Summary

- Replaced client-side Gemini calls with server-side OpenAI proxy (`server.js`).
- Added improved client HTML (`index-updated.html`) with lazy image handling, accessibility, and improved AI UX.
- Added README with run and Git instructions.
- Added more robust error handling for AI calls and timeouts.

## Details

- Accessibility: added aria-live, sr-only labels, and improved focusable controls.
- Performance: lazy-load images (native + JS), reduce layout shifts, preconnect fonts.
- Security: API key moved to server env var. Do not commit keys.
- AI: prompt tuned to return JSON; server has parsing fallback.

