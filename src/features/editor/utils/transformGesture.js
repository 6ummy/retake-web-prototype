const DEFAULT_SIZE = { width: 414, height: 736 };
const DEFAULT_MOVE_TOLERANCE = 2;
const DEFAULT_SCALE_TOLERANCE = 0.008;
const DEFAULT_ROTATE_TOLERANCE = 1.25;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function pointFromClientEvent(event) {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
  };
}

export function pointsFromTouchList(touches) {
  return Array.from(touches).map(touch => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
  }));
}

function distance(a, b) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(a, b) {
  return Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
}

function normalizeAngleDelta(degrees) {
  let delta = degrees;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function centerOf(a, b) {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
}

function rectScale(rect, size) {
  return {
    x: size.width / (rect?.width || size.width),
    y: size.height / (rect?.height || size.height),
  };
}

function resolveScaleFactor({ target, size = DEFAULT_SIZE, scaleFactor }) {
  if (scaleFactor) return scaleFactor;
  const rect = target?.getBoundingClientRect?.() || target;
  return rectScale(rect, size);
}

export function clampTransform(transform, {
  minScale = 0.65,
  maxScale = 4,
  maxOffsetX = Infinity,
  maxOffsetY = Infinity,
} = {}) {
  return {
    ...transform,
    scale: clamp(transform.scale ?? 1, minScale, maxScale),
    offsetX: clamp(transform.offsetX ?? 0, -maxOffsetX, maxOffsetX),
    offsetY: clamp(transform.offsetY ?? 0, -maxOffsetY, maxOffsetY),
  };
}

export function beginTransformGesture({
  points,
  target,
  transform,
  size = DEFAULT_SIZE,
  scaleFactor,
}) {
  const factor = resolveScaleFactor({ target, size, scaleFactor });
  if (points.length >= 2) {
    const [a, b] = points;
    return {
      type: 'two-pointer',
      scaleFactor: factor,
      startCenter: centerOf(a, b),
      startDistance: distance(a, b) || 1,
      startAngle: angle(a, b),
      startTransform: transform,
    };
  }
  if (points.length === 1) {
    return {
      type: 'single-pointer',
      scaleFactor: factor,
      startPoint: points[0],
      startTransform: transform,
    };
  }
  return null;
}

export function updateTransformGesture(gesture, points, {
  allowSinglePointer = false,
  minScale = 0.65,
  maxScale = 4,
  maxOffsetX = Infinity,
  maxOffsetY = Infinity,
  moveTolerance = DEFAULT_MOVE_TOLERANCE,
  scaleTolerance = DEFAULT_SCALE_TOLERANCE,
  rotateTolerance = DEFAULT_ROTATE_TOLERANCE,
} = {}) {
  if (!gesture) return { moved: false, transform: null };

  if (gesture.type === 'single-pointer' && allowSinglePointer && points.length === 1) {
    const [point] = points;
    const offsetX = (point.clientX - gesture.startPoint.clientX) * gesture.scaleFactor.x;
    const offsetY = (point.clientY - gesture.startPoint.clientY) * gesture.scaleFactor.y;
    const didMove = Math.sqrt(offsetX * offsetX + offsetY * offsetY) > moveTolerance;
    if (!didMove) return { moved: false, transform: null };
    return {
      moved: true,
      transform: clampTransform({
        ...gesture.startTransform,
        offsetX: gesture.startTransform.offsetX + offsetX,
        offsetY: gesture.startTransform.offsetY + offsetY,
      }, { minScale, maxScale, maxOffsetX, maxOffsetY }),
    };
  }

  if (gesture.type === 'two-pointer' && points.length >= 2) {
    const [a, b] = points;
    const nextCenter = centerOf(a, b);
    const offsetX = (nextCenter.clientX - gesture.startCenter.clientX) * gesture.scaleFactor.x;
    const offsetY = (nextCenter.clientY - gesture.startCenter.clientY) * gesture.scaleFactor.y;
    const centerMove = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    const distanceRatio = (distance(a, b) || 1) / gesture.startDistance;
    const angleDelta = normalizeAngleDelta(angle(a, b) - gesture.startAngle);
    const didMove = (
      centerMove > moveTolerance
      || Math.abs(distanceRatio - 1) > scaleTolerance
      || Math.abs(angleDelta) > rotateTolerance
    );
    if (!didMove) return { moved: false, transform: null };
    return {
      moved: true,
      transform: clampTransform({
        ...gesture.startTransform,
        scale: gesture.startTransform.scale * distanceRatio,
        rotation: gesture.startTransform.rotation + angleDelta,
        offsetX: gesture.startTransform.offsetX + offsetX,
        offsetY: gesture.startTransform.offsetY + offsetY,
      }, { minScale, maxScale, maxOffsetX, maxOffsetY }),
    };
  }

  return { moved: false, transform: null };
}
