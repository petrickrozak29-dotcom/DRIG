export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  const defaultProductionUrl = 'https://rd-production-ff32.up.railway.app';

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  // If built for production and no public API URL provided, use the Railway production URL
  if (process.env.NODE_ENV === 'production') {
    return defaultProductionUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!isLocalHost && protocol === 'https:') {
      return origin;
    }

    if (!isLocalHost) {
      return `http://${hostname}:4000`;
    }
  }

  return 'http://localhost:4000';
}

export function getApiConnectionLabel() {
  const baseUrl = getApiBaseUrl();

  if (baseUrl.startsWith('https://')) {
    return 'HTTPS backend aktif';
  }

  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return 'Mode lokal development';
  }

  return 'Backend jaringan lokal';
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init);

  if (!response.ok) {
    let message = 'Permintaan API gagal';

    try {
      const payload = await response.json();
      message = payload.error || payload.message || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
