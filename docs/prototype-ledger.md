# Retake Prototype Ledger

This file tracks the status quo of the prototype so GitHub can act as the source of truth while Retake is moving quickly.

## Current Checkpoint

- Date: 2026-05-11
- Branch: `main`
- Latest checkpoint commit: `8c92caa` - `Remove invitee flow for rebuild`
- Production URL: https://retake-prototype.vercel.app
- Local mobile test URL: https://192.168.0.72:5174/

## Product Status

- Inviter/editor flow is the active prototype.
- Invitee flow has been removed intentionally.
- Next invitee work should start from a fresh implementation that matches the updated inviter visual language, component structure, and interaction model.
- Signup remains available through `api/signup.js`.

## Source Of Truth

- Product structure: `docs/app-architecture.md`
- Product identity and UI rules: `docs/design-system.md`
- Current status and checkpoints: this file
- Active app code: `src/`
- Legacy/static exploration files: root-level HTML and image assets

## Current Flow Map

```txt
/           -> local React entry, redirects to /inviter
/inviter    -> active frame creator and editor prototype
```

Vercel rewrites still serve static pages for the public prototype:

```txt
/           -> landing.html
/inviter    -> retake-ig.html
/signup     -> api/signup.js
```

## Rebuild Notes

When invitee restarts:

- Use the inviter flow as the visual and interaction baseline.
- Reuse shared UI primitives from `src/components/ui`.
- Reuse editor behavior from `src/features/editor` where it makes sense.
- Add invitee-specific behavior under `src/features/invitee` only after the new flow is defined.
- Keep route-specific layout in a dedicated route CSS file only when shared CSS layers are not appropriate.

## Checkpoint Routine

Before saving a major checkpoint:

```bash
npm run build
git status
git add -A
git commit -m "Short checkpoint message"
git push origin main
```

For a portable source-of-truth backup file after committing:

```bash
git bundle create archive/retake-checkpoint.bundle --all
```
