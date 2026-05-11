const PROTOTYPE_BASE_PATH = '/prototype';

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
