export function assetPath(base, path = '') {
  return `/${[base, path].map(part => part.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')}${path.endsWith('/') || !path ? '/' : ''}`.replace(/^\/\//, '/');
}
