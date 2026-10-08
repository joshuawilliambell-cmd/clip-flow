# Love's Video Studio

Browser-based, template-driven introduction video creator for Love's Enterprise Sales. Employees upload one talking-head video, drop in team photos, drag simple timing blocks, and export a branded ~60s MP4 for Allego.

This is a **Phase 1 working prototype** — not a full video editor. Presentation (PIP size, position, fades, export settings) comes from a central template; employees only control content and timing.

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Employee flow

1. **Add Your Video** — upload MP4/MOV, trim with timeline handles, scrub/play
2. **Add Your Team** — upload photos, enter name/title, drag photo blocks on the timeline
3. **Preview & Download** — choose 1 of 3 music tracks, adjust video + music volume, **Export to MP4**

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS
- Remotion Player for live preview
- `@remotion/web-renderer` for in-browser 1920×1080 MP4 export
- Template config in `src/lib/template.ts` (PIP geometry, branding, timing defaults)

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local app on port 43123 |
| `npm run build` | Production build |
| `npm run remotion:studio` | Optional Remotion Studio for template work |

## Prototype notes

- No authentication or Allego API integration yet (architecture stubs in `src/lib/future-architecture.ts`)
- Media stays in the browser via object URLs for local demos
- Background tracks in `public/music/` are generated placeholders — replace with licensed Love's-approved audio before production
- Sample branding uses Love's-inspired red; swap official assets when approved
- Chrome/Edge recommended for export (WebCodecs)

## Sample media

Optional local fixtures (if present):

- `public/samples/sample-intro.mp4`
- `public/samples/team-*.jpg`
