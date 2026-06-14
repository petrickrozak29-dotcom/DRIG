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

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !path.includes('/api/auth/refresh')
  ) {
    const refreshToken = window.localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const payload = (await refreshResponse.json()) as { token?: string };

          if (payload.token) {
            window.localStorage.setItem('authToken', payload.token);
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Bearer ${payload.token}`);

            const retryResponse = await fetch(`${getApiBaseUrl()}${path}`, {
              ...init,
              headers,
            });

            if (retryResponse.ok) {
              return retryResponse.json() as Promise<T>;
            }
          }
        }
      } catch {
        // Fall through to the original 401 handling below.
      }
    }
  }

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
