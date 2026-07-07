import { useEffect, useRef } from 'react';
import { useToast } from './ToastContext';

interface SessionWatcherProps {
  onExpire: () => void;
}

export default function SessionWatcher({ onExpire }: SessionWatcherProps) {
  const { showToast } = useToast();
  const expiredRef = useRef(false);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const protectedUrls = [
      `${baseUrl}/functions/v1/admin-content`,
      `${baseUrl}/functions/v1/bookings`,
      `${baseUrl}/functions/v1/staff-login`,
    ];

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && !expiredRef.current) {
        const requestUrl = typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : '';

        if (protectedUrls.some((url) => requestUrl.includes(url))) {
          expiredRef.current = true;
          showToast('Your admin session has expired. Please log in again.', 'error');
          setTimeout(() => onExpire(), 100);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [onExpire, showToast]);

  return null;
}
