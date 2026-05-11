const PROTOTYPE_BASE_PATH = '/prototype';
const PROTOTYPE_ORIGIN = 'https://retake.it.com';
const INVITE_BASE_PATH = '/invite';

function getCurrentPathname() {
  return typeof window === 'undefined' ? '/' : window.location.pathname;
}

export function getAppBasePath(pathname = getCurrentPathname()) {
  return pathname === PROTOTYPE_BASE_PATH || pathname.startsWith(`${PROTOTYPE_BASE_PATH}/`)
    ? PROTOTYPE_BASE_PATH
    : '';
}

export function buildAppPath(path, pathname = getCurrentPathname()) {
  const routePath = path.startsWith('/') ? path : `/${path}`;
  return `${getAppBasePath(pathname)}${routePath}`;
}

export function buildPrototypePath(path) {
  const routePath = path.startsWith('/') ? path : `/${path}`;
  return `${PROTOTYPE_BASE_PATH}${routePath}`;
}

export function buildPrototypeUrl(path, origin = PROTOTYPE_ORIGIN) {
  return new URL(buildPrototypePath(path), origin).toString();
}

export function buildInvitePath(requestId) {
  return `${INVITE_BASE_PATH}/${encodeURIComponent(requestId)}`;
}

export function buildInviteUrl(requestId, origin = PROTOTYPE_ORIGIN) {
  return new URL(buildInvitePath(requestId), origin).toString();
}
