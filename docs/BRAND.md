# Paddock brand

Implemented from the approved Concept 2 horse-and-P reference. The monogram is
a scalable vector recreation of the supplied JPEG, not an original vector export.
The horse profile is negative space; the curved neck is sage. The live wordmark
uses the existing Inter font so it remains accessible and crisp.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `brand-forest` | `#0F3D2E` | Primary actions, navigation, dark panels |
| `brand-sage` | `#7FB28A` | Logo accent and text/icons on forest |
| `brand-midnight` | `#0F172A` | Wordmark and primary text |
| `brand-mist` | `#F8F7F2` | Warm light surfaces and reversed mark |
| `brand-soft` | `#EAF2E9` | Supporting pale green surfaces |
| `brand-hover` | `#1B513E` | Hover state for forest buttons |

Do not use sage for small text on white or mist: use forest instead. Semantic
status colours (warnings, errors, role badges and clinical statuses) are unchanged.

## Assets

- `src/components/marketing/PaddockLogo.tsx`: shared inline mark; use `reversed`
  on dark surfaces and `decorative` when adjacent text already names Paddock.
- `src/components/marketing/PaddockWordmark.tsx`: accessible live-text lockup.
- `public/brand/paddock-logo.svg`: transparent forest/sage mark.
- `public/brand/paddock-logo-reversed.svg`: transparent mist/sage mark.
- `public/paddock-mark.svg`: one-colour reversed circular favicon.
- `public/brand/paddock-app-icon.svg`: square source for app icons; the platform
  applies its own corner mask.
- `public/brand/paddock-app-icon-512.png`: 512px raster app icon.
- `public/apple-touch-icon.png`: 180px Apple touch icon.

Keep the two mark paths identical in the component and SVG files. The brand asset
tests verify geometry, palette and PNG dimensions. No external image requests,
SVG IDs or client-side effects are needed for the logo.

## Scope

The update covers the public pages, login, desktop/mobile navigation, shared UI
theme and existing navy-branded action/link/focus styles throughout the app.
Routes, data access, permissions, authentication, form handlers, clinical status
colours and email templates are unchanged. No database migration is required.

## Validation

- TypeScript and all 54 tests pass (`npm run check`).
- Production build passes. This container requires its system CA certificates
  for the existing Google font download:
  `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build`.
  Certificate validation remains enabled; no application config was changed.
- The 512px app icon was rendered and visually inspected against the reference.
- Full desktop/mobile browser QA remains outstanding: the cloud browser blocks
  localhost and a local browser could not be installed in this environment.
- Signed-in screens were not exercised against a database or real user account.
