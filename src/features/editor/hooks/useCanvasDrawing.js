import { useCallback, useEffect, useRef } from 'react';
import { drawCheckerboardMasked } from './useInviterLayerStack.js';

const DOODLE_FILL_LONG_PRESS_MS = 450;
const DOODLE_FILL_MOVE_TOLERANCE = 8;
const FLOOD_FILL_TOLERANCE = 28;

function clamp01(value, fallback = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function getDoodleOpacity(doodleOpacityRef) {
  const raw = doodleOpacityRef?.current;
  const number = Number(raw);
  if (!Number.isFinite(number)) return 1;
  return clamp01(number > 1 ? number / 100 : number);
}

function colorToRgba(color, opacity = 1) {
  if (typeof color !== 'string') return [255, 255, 255, 255];
  const alphaScale = clamp01(opacity);
  const value = color.trim();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let raw = hex[1];
    if (raw.length === 3) raw = raw.split('').map(ch => ch + ch).join('');
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const a = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) : 255;
    return [r, g, b, Math.round(a * alphaScale)];
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(',').map(part => part.trim());
    const alpha = parts[3] === undefined ? 1 : Number(parts[3]);
    return [
      Math.max(0, Math.min(255, Number(parts[0]) || 0)),
      Math.max(0, Math.min(255, Number(parts[1]) || 0)),
      Math.max(0, Math.min(255, Number(parts[2]) || 0)),
      Math.round(Math.max(0, Math.min(1, alpha)) * 255 * alphaScale),
    ];
  }
  return [255, 255, 255, Math.round(255 * alphaScale)];
}

function colorsMatch(data, index, target, tolerance) {
  return (
    Math.abs(data[index] - target[0]) <= tolerance
    && Math.abs(data[index + 1] - target[1]) <= tolerance
    && Math.abs(data[index + 2] - target[2]) <= tolerance
    && Math.abs(data[index + 3] - target[3]) <= tolerance
  );
}

function blendSourceOver(data, index, source) {
  const srcA = source[3] / 255;
  const dstA = data[index + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) {
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 0;
    return;
  }
  data[index] = Math.round((source[0] * srcA + data[index] * dstA * (1 - srcA)) / outA);
  data[index + 1] = Math.round((source[1] * srcA + data[index + 1] * dstA * (1 - srcA)) / outA);
  data[index + 2] = Math.round((source[2] * srcA + data[index + 2] * dstA * (1 - srcA)) / outA);
  data[index + 3] = Math.round(outA * 255);
}

function floodFill(ctx, startX, startY, fillColor, fillOpacity = 1) {
  const { width, height } = ctx.canvas;
  const x = Math.max(0, Math.min(width - 1, Math.round(startX)));
  const y = Math.max(0, Math.min(height - 1, Math.round(startY)));
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIndex = (y * width + x) * 4;
  const target = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];
  const replacement = colorToRgba(fillColor, fillOpacity);
  if (replacement[3] <= 0) return false;
  if (replacement[3] === 255 && colorsMatch(replacement, 0, target, 3)) return false;

  const queue = new Uint32Array(width * height);
  const visited = new Uint8Array(width * height);
  let head = 0;
  let tail = 0;
  queue[tail++] = y * width + x;
  visited[y * width + x] = 1;
  let changed = false;

  while (head < tail) {
    const pos = queue[head++];
    const px = pos % width;
    const py = Math.floor(pos / width);
    const index = pos * 4;
    if (!colorsMatch(data, index, target, FLOOD_FILL_TOLERANCE)) continue;

    blendSourceOver(data, index, replacement);
    changed = true;

    if (px > 0 && !visited[pos - 1]) {
      visited[pos - 1] = 1;
      queue[tail++] = pos - 1;
    }
    if (px < width - 1 && !visited[pos + 1]) {
      visited[pos + 1] = 1;
      queue[tail++] = pos + 1;
    }
    if (py > 0 && !visited[pos - width]) {
      visited[pos - width] = 1;
      queue[tail++] = pos - width;
    }
    if (py < height - 1 && !visited[pos + width]) {
      visited[pos + width] = 1;
      queue[tail++] = pos + width;
    }
  }

  if (changed) ctx.putImageData(imageData, 0, 0);
  return changed;
}

export function useCanvasDrawing({
  canvasRef,
  ctxRef,
  activeToolRef,
  toolRadiusRef,
  eraserOpacityRef,
  doodleColorRef,
  doodleOpacityRef,
  doodleModeRef,
  penTypeRef,
  frameElRef,
  brushCursorRef,
  tmLeftPanelRef,
  stickerSys,
  pushHistory,
  syncHistoryBtns,
  setHandlePos,
  syncCursor,
  expandLeftPanel,
  applyTrackNorm,
  normFromClientY,
  onInitialIntro,
  onCommitStroke,
  onCommitCanvasFill,
}) {
  const scratchCanvasRef = useRef(null);
  const scratchCtxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const strokeBaseDataRef = useRef(null);
  const trackDraggingRef = useRef(false);
  const fillLongPressTimerRef = useRef(null);
  const fillPressRef = useRef(null);

  const getXY = useCallback((e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - r.left) * (canvas.width / r.width),
      y: (t.clientY - r.top) * (canvas.height / r.height),
    };
  }, [canvasRef]);

  const isDoodleEraseMode = useCallback(() => (
    activeToolRef.current === 'doodle' && doodleModeRef?.current === 'erase'
  ), [activeToolRef, doodleModeRef]);

  const isFreehandEraseMode = useCallback(() => (
    activeToolRef.current === 'magicPen' || isDoodleEraseMode()
  ), [activeToolRef, isDoodleEraseMode]);

  const clearActiveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (scratchCtxRef.current && scratchCanvasRef.current) {
      scratchCtxRef.current.clearRect(0, 0, scratchCanvasRef.current.width, scratchCanvasRef.current.height);
    }
  }, [canvasRef, ctxRef]);

  const paintAt = useCallback((x, y, fx, fy) => {
    const ctx = ctxRef.current;
    const scratchCtx = scratchCtxRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    const doodleOpacity = getDoodleOpacity(doodleOpacityRef);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (isFreehandEraseMode()) {
      scratchCtx.save();
      scratchCtx.beginPath(); scratchCtx.moveTo(fx, fy); scratchCtx.lineTo(x, y);
      scratchCtx.lineCap = 'round'; scratchCtx.lineJoin = 'round';
      scratchCtx.globalCompositeOperation = 'source-over';
      scratchCtx.globalAlpha = 1;
      scratchCtx.strokeStyle = 'rgba(0,0,0,1)';
      scratchCtx.lineWidth = toolRadiusRef.current * 2;
      scratchCtx.stroke();
      scratchCtx.restore();
      if (strokeBaseDataRef.current) ctx.putImageData(strokeBaseDataRef.current, 0, 0);
      if (activeToolRef.current === 'magicPen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        drawCheckerboardMasked(ctx, scratchCanvas);
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = activeToolRef.current === 'doodle' ? 1 : eraserOpacityRef.current;
        ctx.drawImage(scratchCanvas, 0, 0);
      }
    } else if (penTypeRef.current === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = doodleColorRef.current;
      ctx.lineWidth = Math.max(1, toolRadiusRef.current * 0.8);
      ctx.globalAlpha = 0.55 * doodleOpacity; ctx.stroke();
      ctx.lineWidth = toolRadiusRef.current * 1.6; ctx.globalAlpha = 0.08 * doodleOpacity; ctx.stroke();
    } else if (penTypeRef.current === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = doodleColorRef.current;
      ctx.lineWidth = toolRadiusRef.current * 3.5;
      ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
      ctx.globalAlpha = 0.38 * doodleOpacity; ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = doodleOpacity;
      ctx.strokeStyle = doodleColorRef.current;
      const n = (toolRadiusRef.current - 4) / 56;
      ctx.lineWidth = Math.max(1, 1 - 11 * n + 58 * n * n);
      ctx.stroke();
    }
    ctx.restore();
  }, [activeToolRef, ctxRef, doodleColorRef, doodleOpacityRef, eraserOpacityRef, isFreehandEraseMode, penTypeRef, toolRadiusRef]);

  const commitCurrentStroke = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const tool = activeToolRef.current;
    const type = tool === 'magicPen' ? 'magicPenStroke' : 'doodleStroke';
    const committed = onCommitStroke?.({
      type,
      sourceCanvas: canvas,
      maskCanvas: tool === 'magicPen' ? scratchCanvasRef.current : null,
    });
    clearActiveCanvas();
    return !!committed;
  }, [activeToolRef, canvasRef, clearActiveCanvas, onCommitStroke]);

  const moveCursor = useCallback((cx, cy) => {
    const r = frameElRef.current.getBoundingClientRect();
    const el = brushCursorRef.current;
    if (!el) return;
    el.style.left = (cx - r.left) + 'px';
    el.style.top = (cy - r.top) + 'px';
  }, [brushCursorRef, frameElRef]);

  const resetInteractionState = useCallback(() => {
    strokeBaseDataRef.current = null;
    clearTimeout(fillLongPressTimerRef.current);
    fillLongPressTimerRef.current = null;
    fillPressRef.current = null;
    if (scratchCtxRef.current && scratchCanvasRef.current) {
      scratchCtxRef.current.clearRect(0, 0, scratchCanvasRef.current.width, scratchCanvasRef.current.height);
    }
  }, [ctxRef]);

  const isOverLiveDecorator = useCallback((clientX, clientY) => {
    const items = stickerSys.placedStickersRef?.current || [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const rect = items[i].el?.getBoundingClientRect?.();
      if (
        rect
        && clientX >= rect.left
        && clientX <= rect.right
        && clientY >= rect.top
        && clientY <= rect.bottom
      ) return true;
    }
    return false;
  }, [stickerSys]);

  const fillEntireCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return false;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = getDoodleOpacity(doodleOpacityRef);
    ctx.fillStyle = doodleColorRef.current;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  }, [canvasRef, ctxRef, doodleColorRef, doodleOpacityRef]);

  const startFillLongPress = useCallback((point, clientX, clientY) => {
    if (activeToolRef.current !== 'doodle' || doodleModeRef?.current === 'erase') return;
    clearTimeout(fillLongPressTimerRef.current);
    fillPressRef.current = { point, clientX, clientY };
    fillLongPressTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx || activeToolRef.current !== 'doodle' || !fillPressRef.current) return;
      const baseImageData = strokeBaseDataRef.current;
      if (baseImageData) ctx.putImageData(baseImageData, 0, 0);
      const shouldFillAll = isOverLiveDecorator(clientX, clientY);
      const didFill = shouldFillAll
        ? fillEntireCanvas()
        : floodFill(ctx, point.x, point.y, doodleColorRef.current, getDoodleOpacity(doodleOpacityRef));
      fillLongPressTimerRef.current = null;
      isDrawingRef.current = false;
      fillPressRef.current = null;
      strokeBaseDataRef.current = null;
      if (scratchCtxRef.current && scratchCanvasRef.current) {
        scratchCtxRef.current.clearRect(0, 0, scratchCanvasRef.current.width, scratchCanvasRef.current.height);
      }
      if (didFill) {
        onCommitCanvasFill?.(canvas);
        clearActiveCanvas();
        pushHistory();
      }
    }, DOODLE_FILL_LONG_PRESS_MS);
  }, [activeToolRef, canvasRef, ctxRef, doodleColorRef, doodleModeRef, doodleOpacityRef, fillEntireCanvas, isOverLiveDecorator, onCommitCanvasFill, clearActiveCanvas, pushHistory]);

  const cancelFillLongPressIfMoved = useCallback((clientX, clientY) => {
    const press = fillPressRef.current;
    if (!press || !fillLongPressTimerRef.current) return;
    const dx = clientX - press.clientX;
    const dy = clientY - press.clientY;
    if (Math.sqrt(dx * dx + dy * dy) <= DOODLE_FILL_MOVE_TOLERANCE) return;
    clearTimeout(fillLongPressTimerRef.current);
    fillLongPressTimerRef.current = null;
  }, []);

  const clearFillLongPress = useCallback(() => {
    clearTimeout(fillLongPressTimerRef.current);
    fillLongPressTimerRef.current = null;
    fillPressRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const sc = document.createElement('canvas');
    sc.width = canvas.width; sc.height = canvas.height;
    scratchCanvasRef.current = sc;
    scratchCtxRef.current = sc.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    syncHistoryBtns();
    setHandlePos(0.5);
    syncCursor();

    const onMouseDown = (e) => {
      stickerSys.deselectAllStickers?.();
      if (!activeToolRef.current) return;
      const p = getXY(e);
      isDrawingRef.current = true; lastXRef.current = p.x; lastYRef.current = p.y;
      if (isFreehandEraseMode()) {
        strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        scratchCtxRef.current.clearRect(0, 0, sc.width, sc.height);
      } else {
        strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        startFillLongPress(p, e.clientX, e.clientY);
      }
      paintAt(p.x, p.y, p.x, p.y);
    };
    const onMouseMove = (e) => {
      if (!activeToolRef.current) return;
      moveCursor(e.clientX, e.clientY);
      if (activeToolRef.current && brushCursorRef.current) brushCursorRef.current.style.display = 'block';
      if (activeToolRef.current === 'doodle' && !isDoodleEraseMode()) cancelFillLongPressIfMoved(e.clientX, e.clientY);
      if (isDrawingRef.current) {
        const p = getXY(e);
        paintAt(p.x, p.y, lastXRef.current, lastYRef.current);
        lastXRef.current = p.x; lastYRef.current = p.y;
      }
    };
    const onMouseUp = (e) => {
      if (isDrawingRef.current) {
        clearFillLongPress();
        strokeBaseDataRef.current = null;
        if (commitCurrentStroke()) pushHistory();
        isDrawingRef.current = false;
      }
    };
    const onMouseLeave = () => {
      if (isDrawingRef.current) {
        clearFillLongPress();
        strokeBaseDataRef.current = null;
        if (commitCurrentStroke()) pushHistory();
        isDrawingRef.current = false;
      }
      if (brushCursorRef.current) brushCursorRef.current.style.display = 'none';
    };
    const onMouseEnter = (e) => {
      if (
        activeToolRef.current
        && (
          activeToolRef.current === 'doodle'
          || activeToolRef.current === 'magicPen'
        )
        && brushCursorRef.current
      ) {
        moveCursor(e.clientX, e.clientY);
        brushCursorRef.current.style.display = 'block';
      }
    };
    const onTouchStart = (e) => {
      stickerSys.deselectAllStickers?.();
      if (!activeToolRef.current) return; e.preventDefault();
      const p = getXY(e);
      isDrawingRef.current = true; lastXRef.current = p.x; lastYRef.current = p.y;
      if (isFreehandEraseMode()) {
        strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        scratchCtxRef.current.clearRect(0, 0, sc.width, sc.height);
      } else {
        strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const t = e.touches[0];
        startFillLongPress(p, t.clientX, t.clientY);
      }
      paintAt(p.x, p.y, p.x, p.y);
    };
    const onTouchMove = (e) => {
      if (!activeToolRef.current) return; e.preventDefault();
      if (activeToolRef.current === 'doodle' && !isDoodleEraseMode() && e.touches[0]) {
        cancelFillLongPressIfMoved(e.touches[0].clientX, e.touches[0].clientY);
      }
      if (isDrawingRef.current) {
        const p = getXY(e);
        paintAt(p.x, p.y, lastXRef.current, lastYRef.current);
        lastXRef.current = p.x; lastYRef.current = p.y;
      }
    };
    const onTouchEnd = (e) => {
      if (isDrawingRef.current) {
        clearFillLongPress();
        strokeBaseDataRef.current = null;
        if (commitCurrentStroke()) pushHistory();
        isDrawingRef.current = false;
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    const panel = tmLeftPanelRef.current;
    const onPanelMouseEnter = () => expandLeftPanel();
    const startTrackDrag = () => {
      trackDraggingRef.current = true;
      panel?.classList.add('tm-resizing');
      expandLeftPanel();
    };
    const endTrackDrag = () => {
      trackDraggingRef.current = false;
      panel?.classList.remove('tm-resizing');
      expandLeftPanel();
    };
    const onPanelMouseDown = (e) => { startTrackDrag(); applyTrackNorm(normFromClientY(e.clientY)); };
    const onDocTrackMouseMove = (e) => { if (trackDraggingRef.current) applyTrackNorm(normFromClientY(e.clientY)); };
    const onDocTrackMouseUp = () => { if (trackDraggingRef.current) endTrackDrag(); };
    const onPanelTouchStart = (e) => { startTrackDrag(); applyTrackNorm(normFromClientY(e.touches[0].clientY)); };
    const onDocTouchMove = (e) => { if (trackDraggingRef.current) applyTrackNorm(normFromClientY(e.touches[0].clientY)); };
    const onDocTouchEnd = () => { if (trackDraggingRef.current) endTrackDrag(); };

    if (panel) {
      panel.addEventListener('mouseenter', onPanelMouseEnter);
      panel.addEventListener('mousedown', onPanelMouseDown);
      panel.addEventListener('touchstart', onPanelTouchStart, { passive: true });
    }
    document.addEventListener('mousemove', onDocTrackMouseMove);
    document.addEventListener('mouseup', onDocTrackMouseUp);
    document.addEventListener('touchmove', onDocTouchMove, { passive: true });
    document.addEventListener('touchend', onDocTouchEnd, { passive: true });

    const overlay = stickerSys.stickerOverlayRef.current;
    if (overlay) overlay.addEventListener('click', stickerSys.deselectAllStickers);

    onInitialIntro();

    return () => {
      clearTimeout(fillLongPressTimerRef.current);
      fillLongPressTimerRef.current = null;
      fillPressRef.current = null;
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      if (panel) {
        panel.removeEventListener('mouseenter', onPanelMouseEnter);
        panel.removeEventListener('mousedown', onPanelMouseDown);
        panel.removeEventListener('touchstart', onPanelTouchStart);
      }
      document.removeEventListener('mousemove', onDocTrackMouseMove);
      document.removeEventListener('mouseup', onDocTrackMouseUp);
      document.removeEventListener('touchmove', onDocTouchMove);
      document.removeEventListener('touchend', onDocTouchEnd);
      if (overlay) overlay.removeEventListener('click', stickerSys.deselectAllStickers);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { resetInteractionState };
}
