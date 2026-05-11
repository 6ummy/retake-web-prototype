# Editor Feature

Shared canvas/tool behavior belongs here as it is extracted from product flows. Good candidates include drawing overlays, stickers, text tools, eraser controls, undo/redo, brush sizing, opacity controls, and canvas utilities.

## Layering Model

Editor layering is app-wide and shared by product flows. Keep z-index tokens in `src/styles/tokens.css` and use semantic tokens instead of raw `z-index` values.

Composition/media layers should stay below app chrome and overlays:

- `--z-frame-bg: 0` transparent/checker/camera-ready background
- `--z-inviter-media-color-bg: 10` inviter-only color fill from long-press pen behavior
- `--z-inviter-media-gallery: 20` inviter gallery media, movable with two-finger transform in editing screens
- `--z-inviter-media-doodle-pen: 30` inviter locked doodle/pen strokes, not transformable
- `--z-inviter-media-sticker: 40` inviter stickers, movable with two-finger transform in editing screens
- `--z-inviter-media-transparent-pen: 50` inviter locked transparent pen strokes, not transformable

App/editor UI layers sit above all user media:

- `--z-frame-scrim: 100`
- `--z-editor-chrome: 110`
- `--z-tool-mode: 120`
- `--z-recording-indicator: 130`
- `--z-app-scrim: 200`
- `--z-sheet: 210`
- `--z-toast: 220`
- `--z-modal-scrim: 300`
- `--z-modal: 310`
- `--z-drag-handle: 400`

Do not mix live interaction layering with export logic. DOM z-index decides what the user can see and touch while editing; canvas/export composition must draw layers in the same intended visual order explicitly.

Movable media layers and locked drawing layers must remain distinct. Gallery media and stickers are movable with two-finger transform in editing screens; pen, doodle, and transparent pen layers are not movable.

When adding new editor surfaces, choose the closest semantic token. Add a new token only when the layer has a distinct interaction or composition role.
