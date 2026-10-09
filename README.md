# Love's Video Studio

Browser-based, template-driven introduction video creator for Love's employees. The goal is a concise ~60s video where one employee introduces themselves and teammates (via timed still photos with names/titles). Employees then upload the MP4 to Allego and place it in a shareable digital sales room for customers.

This is a **Phase 1 working prototype** — not a full video editor. Presentation (portrait PIP size, corner padding, fades, export settings) comes from a central template; employees choose left or right corner, content, and timing. The canvas is always 16:9 (1920×1080).

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

`npm run dev` uses webpack (more reliable than Turbopack in some preview environments). For a production-style local run: `npm run build && npm start`.

## Deploy to Vercel

This repo is configured for Vercel (`vercel.json` + Next.js).

### First-time setup (claim into your account)

1. Deploy a temporary preview:

```bash
npm run deploy:vercel
```

2. Open the printed **Temporary** URL to confirm the app works.
3. Open the printed **claim** URL (or run the claim link from the CLI JSON) and sign in to Vercel — that moves the project into your account so it stops expiring.
4. After claiming, future deploys from your machine:

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

You can also import the Git repo in the [Vercel dashboard](https://vercel.com/new) (Framework Preset: Next.js, Root Directory: `.`, Build Command: `npm run build`).

## Employee flow

1. **Prepare Your Video** — pick teammates (photos, names, titles), optionally build the Love’s Team thumbnail opener, fill script names, record or upload, trim, set PIP timing
2. **Finish & Download** — turn the opening thumbnail on/off, choose music, set volumes, **Export to MP4**

### Team thumbnail (in Step 1)
After adding teammates, frame faces on the thumbnail (photos/names/titles come from Your teammates), then **Add to start of video** and/or **Download PNG**.

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
