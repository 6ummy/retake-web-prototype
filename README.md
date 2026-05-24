# Retake Prototype

Retake is a mobile-first camera prototype for creating playful shared frames. The current codebase is centered on the inviter/editor flow: creating a frame, editing canvas content, naming the frame, capturing Retakes, and saving or sharing finished media.

## Current Status

- Active product flows: inviter/editor and invitee rebuild.
- Invitee flow: rebuilt from scratch to share camera/viewfinder/review components with inviter S3.
- Source of truth: this repository, especially `src/`, `docs/design-system.md`, `docs/app-architecture.md`, and `docs/prototype-ledger.md`.
- Production URL: https://retake-prototype.vercel.app
- Local mobile test URL: https://192.168.0.72:5174/

## Quick Start

```bash
npm install
npm run dev
```

For mobile Safari testing on the same Wi-Fi network:

```bash
npm run dev:https
```

Then open:

```txt
https://192.168.0.72:5174/
```

The HTTPS script uses local certificates from `.cert/` when present. The `.cert/` folder is intentionally ignored by Git.

## Project Shape

```txt
src/
  components/
    ui/              shared UI primitives
    icons/           shared icon rendering
  features/
    editor/          shared canvas, drawing, sticker, text, and transform behavior
    inviter/         active product flow
    invitee/         invite accept, camera, review, and submit flow
  hooks/             shared React hooks
  lib/               app helpers and route constants
  styles/            token, base, glass, brand, control, overlay, and route CSS
docs/
  app-architecture.md
  design-system.md
  prototype-ledger.md
api/
  signup.js
  invite.js
  upload-frame.js
  frame.js
  blob-upload.js
  retake.js
```

## Design Rules

Before UI, styling, component, layout, animation, or design-system changes, read `docs/design-system.md`.

Retake should stay mobile-first, camera-forward, playful, tool-like, and fast. Reuse the shared UI primitives before creating new components, and keep reusable styling in the appropriate CSS layer under `src/styles/`.

## Commands

```bash
npm run dev        # local Vite dev server
npm run dev:https  # HTTPS LAN server for mobile Safari testing
npm run build      # production build check
npm run preview    # preview the production build
```

## Invitee Testing

Create an invite from the inviter S3 share action, then open:

```txt
https://192.168.0.72:5174/invite/:inviteId
```

In default dev mode, invites and retakes are stored in the current browser's
`localStorage`. That means an invite created on desktop Safari/Chrome will not
exist on iPhone Safari unless the local UI is connected to a shared API.

For local UI against a deployed Vercel API, set `VITE_API_ORIGIN` before
starting Vite:

```bash
VITE_API_ORIGIN=https://YOUR-VERCEL-DEPLOYMENT.vercel.app npm run dev
```

The deployed project must have a Vercel Blob store connected, or a
`BLOB_READ_WRITE_TOKEN` environment variable configured for the target
environment. After adding Blob storage or env vars in Vercel, redeploy the app.

The API routes allow CORS from local LAN dev origins such as
`https://192.168.x.x:5174`, localhost, and Vercel preview domains so iPhone
testing can use the local HTTPS UI with shared deployed invite data.

## GitHub Workflow

- Keep `main` as the canonical checkpoint branch.
- Commit meaningful prototype checkpoints with short, plain-language messages.
- Run `npm run build` before pushing source or styling changes.
- Use `docs/prototype-ledger.md` to record the current flow state and next rebuild decisions.
- Do not commit `node_modules`, local certificates, Vercel local config, or build output.

## Legacy Prototype Files

The root still contains a few static prototype and marketing files from earlier iterations, including `landing.html`, `marketing.html`, `index-v2.html`, `index-inviter.html`, and `retake-ig.html`. Treat the React app under `src/` and the docs under `docs/` as the current working source of truth.
