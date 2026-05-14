import { fillHoles, keepLargestCC, kMeans, morphClose, polyContains, sqDist3 } from './imageProcessing.js';

let smartSegmenter = null;
let smartSegmenterFailed = false;

async function getSmartSegmenter(logPrefix = 'smart-select') {
  if (smartSegmenter) return smartSegmenter;
  if (smartSegmenterFailed) return null;
  try {
    const { InteractiveSegmenter, FilesetResolver } = await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/vision_bundle.mjs'
    );
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm'
    );
    smartSegmenter = await InteractiveSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite',
        delegate: 'GPU',
      },
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });
    return smartSegmenter;
  } catch (e) {
    console.warn(`[${logPrefix}] MediaPipe load failed - using fallback:`, e);
    smartSegmenterFailed = true;
    return null;
  }
}

export async function detectSmartSelectionMask(sourceCanvas, poly, options = {}) {
  await new Promise(resolve => requestAnimationFrame(resolve));
  if (!sourceCanvas || !poly?.length) return null;

  const logPrefix = options.logPrefix || 'smart-select';
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const px = sourceCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;

  const inLasso = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (polyContains(x + 0.5, y + 0.5, poly)) inLasso[y * w + x] = 1;
    }
  }
  const lassoArea = inLasso.reduce((a, v) => a + v, 0);
  if (!lassoArea) return null;

  let mnX = w;
  let mxX = 0;
  let mnY = h;
  let mxY = 0;
  let sumX = 0;
  let sumY = 0;
  poly.forEach(([x, y]) => {
    mnX = Math.min(mnX, x | 0); mxX = Math.max(mxX, x | 0);
    mnY = Math.min(mnY, y | 0); mxY = Math.max(mxY, y | 0);
    sumX += x; sumY += y;
  });
  const cenX = sumX / poly.length;
  const cenY = sumY / poly.length;

  function postProcess(subject) {
    const lcc = keepLargestCC(subject, w, h);
    const morphR = lassoArea > 60000 ? 4 : lassoArea > 15000 ? 2 : 1;
    const closed = morphClose(lcc, w, h, morphR);
    fillHoles(closed, w, h);
    const kept = closed.reduce((a, v) => a + v, 0);
    return (kept > lassoArea * 0.04 && kept < lassoArea * 0.96) ? closed : subject;
  }

  const MAX_PTS = 2000;
  const BG_BAND = 50;
  const bbX0 = Math.max(0, mnX - BG_BAND);
  const bbX1 = Math.min(w - 1, mxX + BG_BAND);
  const bbY0 = Math.max(0, mnY - BG_BAND);
  const bbY1 = Math.min(h - 1, mxY + BG_BAND);
  const stride = Math.max(1, Math.ceil(Math.sqrt(lassoArea / MAX_PTS)));
  const innerR = Math.min(mxX - mnX, mxY - mnY) * 0.32;
  const fgPts = [];
  const bgPts = [];

  for (let y = bbY0; y <= bbY1; y += stride) {
    for (let x = bbX0; x <= bbX1; x += stride) {
      const i = y * w + x;
      const p = i * 4;
      if (px[p + 3] === 0) continue;
      const rgb = [px[p], px[p + 1], px[p + 2]];
      if (inLasso[i] && Math.hypot(x - cenX, y - cenY) <= innerR) {
        if (fgPts.length < MAX_PTS) fgPts.push(rgb);
      } else if (!inLasso[i] && bgPts.length < MAX_PTS) {
        bgPts.push(rgb);
      }
    }
  }
  if (fgPts.length < 30) {
    for (let y = bbY0; y <= bbY1; y += stride) {
      for (let x = bbX0; x <= bbX1; x += stride) {
        const i = y * w + x;
        const p = i * 4;
        if (inLasso[i] && px[p + 3] > 0 && fgPts.length < MAX_PTS) {
          fgPts.push([px[p], px[p + 1], px[p + 2]]);
        }
      }
    }
  }
  if (bgPts.length < 80) {
    for (let i = 0; i < w * h && bgPts.length < MAX_PTS; i += 1) {
      if (!inLasso[i] && px[i * 4 + 3] > 0) bgPts.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
    }
  }

  if (!fgPts.length || !bgPts.length) return inLasso;

  const fgAvg = [0, 0, 0];
  const bgAvg = [0, 0, 0];
  fgPts.forEach(([r, g, b]) => { fgAvg[0] += r; fgAvg[1] += g; fgAvg[2] += b; });
  bgPts.forEach(([r, g, b]) => { bgAvg[0] += r; bgAvg[1] += g; bgAvg[2] += b; });
  fgAvg[0] /= fgPts.length; fgAvg[1] /= fgPts.length; fgAvg[2] /= fgPts.length;
  bgAvg[0] /= bgPts.length; bgAvg[1] /= bgPts.length; bgAvg[2] /= bgPts.length;
  const colorContrast = sqDist3(fgAvg, bgAvg);

  let keyX = cenX;
  let keyY = cenY;
  let bestKeyScore = Infinity;
  for (let y = bbY0; y <= bbY1; y += stride) {
    for (let x = bbX0; x <= bbX1; x += stride) {
      const i = y * w + x;
      const p = i * 4;
      if (!inLasso[i] || px[p + 3] === 0) continue;
      const rgb = [px[p], px[p + 1], px[p + 2]];
      const subjectScore = sqDist3(rgb, fgAvg) - sqDist3(rgb, bgAvg);
      const centerBias = Math.hypot(x - cenX, y - cenY) * 0.08;
      const score = subjectScore + centerBias;
      if (score < bestKeyScore) {
        bestKeyScore = score;
        keyX = x;
        keyY = y;
      }
    }
  }

  const seg = await getSmartSegmenter(logPrefix);
  if (seg) {
    try {
      const result = seg.segment(sourceCanvas, { keypoint: { x: keyX / w, y: keyY / h } });
      const conf = result.confidenceMasks[0].getAsFloat32Array();
      result.close();
      const confThresh = colorContrast > 5000 ? 0.75 : 0.65;
      const subject = new Uint8Array(w * h);
      let kept = 0;
      for (let i = 0; i < w * h; i += 1) {
        if (inLasso[i] && conf[i] > confThresh) { subject[i] = 1; kept += 1; }
      }
      if (kept > lassoArea * 0.04 && kept < lassoArea * 0.96) return postProcess(subject);
    } catch (e) {
      console.warn(`[${logPrefix}] ML error:`, e);
    }
  }

  function minDistTo(rgb, centres) {
    let best = Infinity;
    for (const c of centres) {
      const d = sqDist3(rgb, c);
      if (d < best) best = d;
    }
    return best;
  }
  function classify(fgC, bgC) {
    const subject = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i += 1) {
      if (!inLasso[i] || px[i * 4 + 3] === 0) continue;
      const p = i * 4;
      const rgb = [px[p], px[p + 1], px[p + 2]];
      if (minDistTo(rgb, fgC) <= minDistTo(rgb, bgC)) subject[i] = 1;
    }
    return subject;
  }

  if (colorContrast >= 5000) {
    const subject = classify([fgAvg], [bgAvg]);
    const kept = subject.reduce((a, v) => a + v, 0);
    if (kept > lassoArea * 0.04 && kept < lassoArea * 0.96) return postProcess(subject);
  }

  const K = 8;
  const ITER = 20;
  let fgC = kMeans(fgPts, K, ITER);
  let bgC = kMeans(bgPts, K, ITER);
  let subject = classify(fgC, bgC);
  const fgPts2 = [];
  const bgPts2 = [...bgPts];
  for (let y = bbY0; y <= bbY1; y += stride) {
    for (let x = bbX0; x <= bbX1; x += stride) {
      const i = y * w + x;
      const p = i * 4;
      if (!inLasso[i] || px[p + 3] === 0) continue;
      const rgb = [px[p], px[p + 1], px[p + 2]];
      if (subject[i] && fgPts2.length < MAX_PTS) fgPts2.push(rgb);
      else if (!subject[i] && bgPts2.length < MAX_PTS) bgPts2.push(rgb);
    }
  }
  if (fgPts2.length > K && bgPts2.length > K) {
    fgC = kMeans(fgPts2, K, ITER);
    bgC = kMeans(bgPts2, K, ITER);
    subject = classify(fgC, bgC);
  }
  return postProcess(subject);
}
