/**
 * Helper to resolve uploaded media URLs (posters, document attachments)
 * to the backend host.
 */
export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('blob:') || 
    path.startsWith('data:')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${backendOrigin}${cleanPath}`;
};
