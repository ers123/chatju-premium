export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
