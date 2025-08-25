export function getCachedAuthToken(): string | null {
  return localStorage.getItem('token');
}
