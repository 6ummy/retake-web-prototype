import { drawMediaCoverWithTransform, loadImage } from './canvas.js';

export const RETAKE_CAMERA_MODE = {
  LIVE: 'live',
  PHOTO: 'photo',
  VIDEO: 'video',
};

export const RETAKE_CAMERA_LONG_PRESS_MS = 420;
export const RETAKE_CAMERA_MAX_RECORD_MS = 10000;
export const RETAKE_CAMERA_DOUBLE_TAP_MS = 260;
export const RETAKE_CAMERA_TIMER_STEPS = [0, 3, 10];
export const RETAKE_CAMERA_FLASH_WARMUP_MS = 120;
export const RETAKE_CAMERA_FLASH_FADE_MS = 240;
export const RETAKE_CAMERA_DEFAULT_CAPABILITIES = {
  torch: false,
  zoom: false,
  zoomMin: 1,
  zoomMax: 1,
};

export const RETAKE_CAMERA_VIDEO_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
];

export function chooseRetakeVideoMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return RETAKE_CAMERA_VIDEO_TYPES.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

export function getRetakeCameraConstraints(facingMode) {
  return [
    {
      video: {
        facingMode: { ideal: facingMode },
        resizeMode: { ideal: 'none' },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        resizeMode: { ideal: 'none' },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: facingMode },
      },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];
}

export function getRetakeTrackCapabilities(track) {
  const capabilities = track?.getCapabilities?.() || {};
  const zoom = capabilities.zoom;
  const zoomMin = Number.isFinite(zoom?.min) ? zoom.min : 1;
  const zoomMax = Number.isFinite(zoom?.max) ? zoom.max : zoomMin;

  return {
    torch: Boolean(capabilities.torch),
    zoom: Boolean(zoom && zoomMax >= zoomMin),
    zoomMin,
    zoomMax,
  };
}

export function clampRetakeZoom(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function roundRetakeZoom(value) {
  return Math.round(value * 100) / 100;
}

export function logRetakeCameraSettings(label, track, video) {
  if (!import.meta.env.DEV) return;
  console.info(`[${label}] Camera settings`, {
    track: track?.getSettings?.() || null,
    video: {
      width: video?.videoWidth || 0,
      height: video?.videoHeight || 0,
    },
  });
}

export function shouldRetryRetakeCamera(err) {
  return ![
    'NotAllowedError',
    'PermissionDeniedError',
    'SecurityError',
    'NotReadableError',
    'TrackStartError',
  ].includes(err?.name);
}

export async function requestRetakeCameraStream(facingMode) {
  let lastError;
  const constraintsList = getRetakeCameraConstraints(facingMode);

  for (const constraints of constraintsList) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      console.warn('[retake-camera] Camera attempt failed:', err?.name, err?.message, constraints);
      if (!shouldRetryRetakeCamera(err)) break;
    }
  }

  throw lastError || new Error('Camera request failed');
}

function formatRetakeCameraError(err) {
  if (!err?.name) return '';
  return ` (${err.name})`;
}

export function getRetakeCameraIssue(err) {
  const hasCameraApi = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  if (!hasCameraApi && typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      fallback: 'Open with HTTPS to use camera',
      toast: 'Camera needs HTTPS on mobile Safari',
    };
  }
  if (!hasCameraApi) {
    return {
      fallback: 'Camera unavailable in this browser',
      toast: 'Camera unavailable in this browser',
    };
  }

  const detail = formatRetakeCameraError(err);
  switch (err?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        fallback: `Camera permission blocked${detail}`,
        toast: `Allow camera access${detail}`,
      };
    case 'SecurityError':
      return {
        fallback: `Camera blocked by browser security${detail}`,
        toast: `Camera blocked${detail}`,
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        fallback: `No camera found${detail}`,
        toast: `No camera found${detail}`,
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        fallback: `Camera is already in use${detail}`,
        toast: `Camera is already in use${detail}`,
      };
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return {
        fallback: `Camera settings unsupported${detail}`,
        toast: `Camera settings unsupported${detail}`,
      };
    default:
      return {
        fallback: `Camera unavailable${detail}`,
        toast: `Camera unavailable${detail}`,
      };
  }
}

export function waitForVideoMetadata(video) {
  if (!video || video.readyState >= 1) return Promise.resolve();

  return new Promise((resolve) => {
    let timeoutId;
    const done = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', done);
      resolve();
    };
    timeoutId = setTimeout(done, 1200);
    video.addEventListener('loadedmetadata', done, { once: true });
  });
}

export function drawRetakeWatermark(ctx, width, height) {
  ctx.save();
  ctx.font = '18px Bedstead, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('retake', width - 18, height - 18);
  ctx.restore();
}

export async function captureRetakeCameraPhoto({
  video,
  width,
  height,
  transform,
  quality = 0.92,
}) {
  if (!video || video.readyState < 2) throw new Error('Camera is not ready');
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  drawMediaCoverWithTransform(out.getContext('2d'), video, width, height, transform);
  return out.toDataURL('image/jpeg', quality);
}

export async function buildRetakePhotoBlob({
  photoUrl,
  frameDataUrl,
  width,
  height,
  quality = 0.92,
  watermark = true,
}) {
  if (!photoUrl) throw new Error('No photo captured');
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const outCtx = out.getContext('2d');
  const photo = await loadImage(photoUrl);
  outCtx.drawImage(photo, 0, 0, width, height);
  if (frameDataUrl) {
    const frame = await loadImage(frameDataUrl);
    outCtx.drawImage(frame, 0, 0, width, height);
  }
  if (watermark) drawRetakeWatermark(outCtx, width, height);
  return new Promise((resolve, reject) => {
    out.toBlob(blob => blob ? resolve(blob) : reject(new Error('Photo export failed')), 'image/jpeg', quality);
  });
}
