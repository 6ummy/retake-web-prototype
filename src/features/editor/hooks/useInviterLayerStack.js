import { useCallback, useRef } from 'react';
import { drawImageItemToContext, drawTextItemToContext, loadItemImage } from './useStickerSystem.js';

const CREATIVE_Z_BASE = 30;

function copyCanvas(source) {
  if (!source) return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d').drawImage(source, 0, 0);
  return canvas;
}

function hasVisiblePixels(canvas) {
  if (!canvas) return false;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true;
  }
  return false;
}

function normalizeOpacity(opacity) {
  const number = Number(opacity);
  if (!Number.isFinite(number)) return 1;
  return Math.max(0, Math.min(1, number));
}

function makePreviewCanvas(source, order) {
  const canvas = copyCanvas(source);
  if (!canvas) return null;
  canvas.className = 'creative-layer-canvas';
  canvas.style.zIndex = String(CREATIVE_Z_BASE + order);
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

export function drawCheckerboardMasked(ctx, maskCanvas, opacity = 1, options = {}) {
  if (!maskCanvas) return;
  const temp = document.createElement('canvas');
  temp.width = maskCanvas.width;
  temp.height = maskCanvas.height;
  const tCtx = temp.getContext('2d');
  tCtx.fillStyle = options.light || '#e8e8e8';
  tCtx.fillRect(0, 0, temp.width, temp.height);
  tCtx.fillStyle = options.dark || '#d0d0d0';
  const size = options.size || 20;
  for (let y = 0; y < temp.height; y += size) {
    for (let x = 0; x < temp.width; x += size) {
      if (((x / size) + (y / size)) % 2 === 0) tCtx.fillRect(x, y, size, size);
    }
  }
  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.drawImage(maskCanvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = normalizeOpacity(opacity);
  ctx.drawImage(temp, 0, 0);
  ctx.restore();
}

export default function useInviterLayerStack({
  frameElRef,
  canvasRef,
  drawGalleryBase,
}) {
  const layersRef = useRef([]);
  const orderRef = useRef(0);
  const canvasFillRef = useRef(null);
  const canvasFillElRef = useRef(null);

  const nextOrder = useCallback(() => {
    orderRef.current += 1;
    return orderRef.current;
  }, []);

  const applyLayerOrder = useCallback((layer) => {
    const z = String(CREATIVE_Z_BASE + layer.order);
    if (layer.previewEl) layer.previewEl.style.zIndex = z;
    if (layer.item?.el) layer.item.el.style.zIndex = z;
  }, []);

  const addStrokeLayer = useCallback(({ type, sourceCanvas, maskCanvas, opacity = 1 }) => {
    if (!sourceCanvas || !hasVisiblePixels(sourceCanvas)) return false;
    const order = nextOrder();
    const id = `${type}-${Date.now()}-${order}`;
    const source = copyCanvas(sourceCanvas);
    const mask = maskCanvas ? copyCanvas(maskCanvas) : null;
    const strokeOpacity = normalizeOpacity(opacity);
    const layer = { id, type, order, source, mask, opacity: strokeOpacity };
    const previewEl = type === 'magicPenStroke' && mask
      ? makePreviewCanvas(mask, order)
      : makePreviewCanvas(source, order);
    if (previewEl && type === 'magicPenStroke' && mask) {
      const previewCtx = previewEl.getContext('2d');
      previewCtx.clearRect(0, 0, previewEl.width, previewEl.height);
      drawCheckerboardMasked(previewCtx, mask, strokeOpacity);
    }
    layer.previewEl = previewEl;
    layersRef.current = [...layersRef.current, layer];
    if (previewEl && frameElRef.current) frameElRef.current.appendChild(previewEl);
    return true;
  }, [frameElRef, nextOrder]);

  const registerItemLayer = useCallback((item, type) => {
    if (!item) return null;
    const order = nextOrder();
    const id = `${type}-${item.id || Date.now()}-${order}`;
    const layer = { id, type, order, item };
    item.layerId = id;
    layersRef.current = [...layersRef.current, layer];
    applyLayerOrder(layer);
    return id;
  }, [applyLayerOrder, nextOrder]);

  const touchLayer = useCallback((id) => {
    if (!id) return;
    const layer = layersRef.current.find(item => item.id === id);
    if (!layer) return;
    layer.order = nextOrder();
    applyLayerOrder(layer);
  }, [applyLayerOrder, nextOrder]);

  const removeLayer = useCallback((id) => {
    if (!id) return;
    const layer = layersRef.current.find(item => item.id === id);
    if (layer?.previewEl) layer.previewEl.remove();
    layersRef.current = layersRef.current.filter(item => item.id !== id);
  }, []);

  const clearLayers = useCallback(() => {
    layersRef.current.forEach(layer => layer.previewEl?.remove());
    layersRef.current = [];
    orderRef.current = 0;
    canvasFillElRef.current?.remove();
    canvasFillRef.current = null;
    canvasFillElRef.current = null;
  }, []);

  const setCanvasFillFromCanvas = useCallback((sourceCanvas) => {
    const source = copyCanvas(sourceCanvas);
    if (!source || !hasVisiblePixels(source)) return false;
    canvasFillRef.current = source;
    if (!canvasFillElRef.current) {
      canvasFillElRef.current = makePreviewCanvas(source, 0);
      canvasFillElRef.current.classList.add('canvas-fill-layer');
      canvasFillElRef.current.style.zIndex = '10';
      if (frameElRef.current) frameElRef.current.appendChild(canvasFillElRef.current);
    } else {
      const ctx = canvasFillElRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasFillElRef.current.width, canvasFillElRef.current.height);
      ctx.drawImage(source, 0, 0);
    }
    return true;
  }, [frameElRef]);

  const createSnapshot = useCallback(() => ({
    order: orderRef.current,
    canvasFill: canvasFillRef.current,
    canvasFillEl: canvasFillElRef.current,
    layers: layersRef.current.map(layer => ({ ...layer })),
  }), []);

  const restoreSnapshot = useCallback((snapshot) => {
    const nextLayers = snapshot?.layers || [];
    const nextIds = new Set(nextLayers.map(layer => layer.id));
    layersRef.current.forEach(layer => {
      if (!nextIds.has(layer.id)) layer.previewEl?.remove();
      if (!nextIds.has(layer.id) && layer.item?.el) layer.item.el.style.display = 'none';
    });
    layersRef.current = nextLayers.map(layer => ({ ...layer }));
    if (!snapshot?.canvasFillEl) canvasFillElRef.current?.remove();
    canvasFillRef.current = snapshot?.canvasFill || null;
    canvasFillElRef.current = snapshot?.canvasFillEl || null;
    orderRef.current = snapshot?.order || layersRef.current.reduce((max, layer) => Math.max(max, layer.order || 0), 0);
    if (canvasFillElRef.current && frameElRef.current && canvasFillElRef.current.parentNode !== frameElRef.current) {
      frameElRef.current.appendChild(canvasFillElRef.current);
    }
    layersRef.current.forEach(layer => {
      applyLayerOrder(layer);
      if (layer.previewEl && frameElRef.current && layer.previewEl.parentNode !== frameElRef.current) {
        frameElRef.current.appendChild(layer.previewEl);
      }
      if (layer.item?.el) layer.item.el.style.display = '';
    });
  }, [applyLayerOrder, frameElRef]);

  const renderFrameLayersToContext = useCallback(async (ctx, options = {}) => {
    const canvas = canvasRef.current;
    const width = options.width || canvas?.width || ctx.canvas.width;
    const height = options.height || canvas?.height || ctx.canvas.height;
    if (!options.preserveExisting) ctx.clearRect(0, 0, width, height);
    if (canvasFillRef.current) ctx.drawImage(canvasFillRef.current, 0, 0, width, height);
    if (drawGalleryBase) drawGalleryBase(ctx);

    const layers = [...layersRef.current].sort((a, b) => a.order - b.order);
    for (const layer of layers) {
      if (layer.type === 'doodleStroke') {
        if (layer.source) ctx.drawImage(layer.source, 0, 0, width, height);
      } else if (layer.type === 'magicPenStroke') {
        const opacity = normalizeOpacity(layer.opacity);
        ctx.save();
        ctx.globalCompositeOperation = options.preview ? 'source-over' : 'destination-out';
        ctx.globalAlpha = opacity;
        if (options.preview) drawCheckerboardMasked(ctx, layer.mask || layer.source, opacity);
        else if (layer.mask) ctx.drawImage(layer.mask, 0, 0, width, height);
        ctx.restore();
      } else if (options.includeItems === false && layer.item) {
        continue;
      } else if (layer.item?.type === 'text' || layer.type === 'text') {
        drawTextItemToContext(ctx, layer.item);
      } else if (layer.item) {
        const img = await loadItemImage(layer.item);
        drawImageItemToContext(ctx, layer.item, img);
      }
    }
  }, [canvasRef, drawGalleryBase]);

  return {
    layersRef,
    addStrokeLayer,
    setCanvasFillFromCanvas,
    registerItemLayer,
    touchLayer,
    removeLayer,
    clearLayers,
    createSnapshot,
    restoreSnapshot,
    renderFrameLayersToContext,
  };
}
