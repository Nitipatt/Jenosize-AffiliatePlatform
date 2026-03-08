const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

let isRefreshing = false;
let refreshSubscribers: ((error: Error | null) => void)[] = [];

function onRefreshed(error: Error | null) {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!refreshRes.ok) {
          throw new Error('Refresh failed');
        }
        
        isRefreshing = false;
        onRefreshed(null);
      } catch (err: any) {
        isRefreshing = false;
        onRefreshed(err);
        // If refresh fails (e.g., token expired after 30 mins), gracefully redirect to login
        if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        throw err;
      }
    }

    // Wait for the token refresh Promise to resolve, then retry original request
    const retryOriginalRequest = new Promise<Response>((resolve, reject) => {
      refreshSubscribers.push((error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve(fetch(url, fetchOptions));
        }
      });
    });

    return retryOriginalRequest;
  }

  return response;
}
