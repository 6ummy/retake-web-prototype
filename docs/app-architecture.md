# Retake App Architecture

Retake currently has one product flow and one shared capability area.

## Product Flows

- Inviter: creates a frame, edits canvas content, names the frame, captures Retakes, and saves or shares finished media.
- Invitee: intentionally removed on 2026-05-11 so it can be rebuilt from scratch against the updated inviter flow.
- Editor: shared canvas/tool behavior used by product flows, including drawing, stickers, text, eraser, undo/redo, brush sizing, opacity controls, and overlays.

## Target File Shape

```txt
src/
  components/
    ui/
    icons/
  features/
    editor/
      components/
      hooks/
      utils/
    inviter/
      components/
      hooks/
    invitee/
      components/
      hooks/
  lib/
    api.js
    canvas.js
  styles/
```

Pages should orchestrate flows. Hooks should own behavior. UI components should render controls and surfaces.

## Current Backend

- Vercel API routes handle signup.
- Airtable currently stores signup email records.
- Invite/frame upload API routes were removed with the old invitee flow and should be redesigned with the invitee rebuild.

## Backend Direction

Short term, centralize client calls in `src/lib/api.js` and keep secrets in server-side environment variables. Validate upload payloads, frame URLs, and failure states before adding more backend surface area.

Use Supabase later if Retake needs accounts, auth, frame ownership, invite records, permissions, row-level security, or durable product data. Keep Vercel for hosting, API routes, previews, and production environment management.

## State Direction

Flow states are defined in `src/features/inviter/state.js`, then exposed on the screen root through `data-flow-state`. Keep using these constants when adding visual states, analytics, tests, or future reducers so behavior and design stay connected.
