const PROTOTYPE_BASE_PATH = '/prototype';
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

export function buildInvitePath(inviteId) {
  return `${INVITE_BASE_PATH}/${encodeURIComponent(inviteId)}`;
}

export function buildInviteUrl(
  inviteId,
  origin = typeof window === 'undefined' ? 'https://retake.it.com' : window.location.origin,
) {
  return new URL(buildInvitePath(inviteId), origin).toString();
}
