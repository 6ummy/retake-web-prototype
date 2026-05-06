/** Resolve after `ms` milliseconds. */
export const delay = (ms) => new Promise(r => setTimeout(r, ms));

/** Convert a data-URL string to a Blob. */
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Get canvas-space [x, y] from a mouse or first-touch event.
 * Accounts for any CSS scaling of the canvas element.
 */
export function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return [(src.clientX - rect.left) * scaleX, (src.clientY - rect.top) * scaleY];
}

/** Render an emoji string onto a 120×120 canvas and return a data-URL. */
export function emojiToDataURL(emoji) {
  const c = document.createElement('canvas');
  c.width = 120; c.height = 120;
  const ctx = c.getContext('2d');
  ctx.font = '90px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 60, 66);
  return c.toDataURL();
}

/**
 * Load an image from a src string and resolve to an HTMLImageElement.
 * Rejects after `timeoutMs` (default 3000) if it doesn't load.
 */
export function loadImage(src, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('Image load timeout')), timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('Image load error')); };
    img.src = src;
  });
}

function getSourceSize(source, fallbackWidth, fallbackHeight) {
  return {
    width: source.videoWidth || source.naturalWidth || source.width || fallbackWidth,
    height: source.videoHeight || source.naturalHeight || source.height || fallbackHeight,
  };
}

/** Sample an image's average visible color, falling back to Retake canvas color. */
export function getAverageImageColor(image, fallback = '#F7F5F2') {
  try {
    const { width, height } = getSourceSize(image, 1, 1);
    if (!width || !height) return fallback;

    const sampleSize = 24;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, sampleSize, sampleSize);
    ctx.drawImage(image, 0, 0, sampleSize, sampleSize);

    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
    let r = 0, g = 0, b = 0, weight = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha <= 0.04) continue;
      r += data[i] * alpha;
      g += data[i + 1] * alpha;
      b += data[i + 2] * alpha;
      weight += alpha;
    }
    if (!weight) return fallback;
    return `rgb(${Math.round(r / weight)}, ${Math.round(g / weight)}, ${Math.round(b / weight)})`;
  } catch {
    return fallback;
  }
}

/** Draw the full source centered inside the canvas, with average-color letterboxing. */
export function drawContainedImageWithBackground(ctx, image, width, height, options = '#F7F5F2') {
  const {
    fallback = '#F7F5F2',
    backgroundColor,
    fit = 'contain',
    transform = {},
  } = typeof options === 'string' ? { fallback: options } : options;
  const {
    scale: transformScale = 1,
    rotation = 0,
    offsetX = 0,
    offsetY = 0,
    mirror = false,
  } = transform;
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(image, width, height);
  const scale = fit === 'width'
    ? width / sourceWidth
    : Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (width - drawWidth) / 2;
  const dy = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = backgroundColor || getAverageImageColor(image, fallback);
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale((mirror ? -1 : 1) * transformScale, transformScale);
  ctx.drawImage(
    image,
    0,
    0,
    sourceWidth,
    sourceHeight,
    dx - width / 2,
    dy - height / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();
}

/** Draw a cover-fit media source with user transform applied in canvas space. */
export function drawMediaCoverWithTransform(ctx, source, width, height, transform = {}) {
  const {
    scale = 1,
    rotation = 0,
    offsetX = 0,
    offsetY = 0,
    mirror = false,
  } = transform;
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source, width, height);
  const baseScale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * baseScale;
  const drawHeight = sourceHeight * baseScale;

  ctx.save();
  ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale((mirror ? -1 : 1) * scale, scale);
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}
