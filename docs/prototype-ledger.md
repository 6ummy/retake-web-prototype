# Retake Prototype Ledger

This file tracks the status quo of the prototype so GitHub can act as the source of truth while Retake is moving quickly.

## Current Checkpoint

- Date: 2026-05-11
- Branch: `codex/invitee-flow`
- Latest checkpoint commit: in progress - invitee rebuild branch
- Production URL: https://retake-prototype.vercel.app
- Local mobile test URL: https://192.168.0.72:5174/

## Product Status

- Inviter/editor flow is the active prototype.
- Invitee rebuild is in progress on `codex/invitee-flow`.
- Shared inviter/invitee camera, viewfinder, review, and control features should live in shared editor modules so changes apply to both flows unless explicitly directed otherwise.
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
/invite/:id -> invitee accept/camera/review/submit flow
/invitee?id=:id -> local invitee testing alias
```

Vercel rewrites still serve static pages for the public prototype:

```txt
/           -> landing.html
/inviter    -> retake-ig.html
/invite/:id -> index.html
/invitee    -> index.html
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
