'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface IncomingNotification {
  type?: 'connected' | 'MESSAGE' | 'MODERATION' | 'ALERT';
  id?: string;
  title?: string;
  content?: string;
  link?: string | null;
  read?: boolean;
  createdAt?: string;
}

interface UseNotificationStreamOptions {
  showToast?: boolean;
  onNotification?: (notif: IncomingNotification) => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { showToast = true, onNotification } = options;
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const url = `${API_URL}/api/notifications/stream`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      retriesRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: IncomingNotification = JSON.parse(event.data);

        if (data.type === 'connected') return;

        // Invalide cache
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Show toast
        if (showToast && data.title) {
          // Ignore MESSAGE toasts here if useMessageStream handles it,
          // but we can show them if useMessageStream's toast is disabled.
          // Let's show a sleek toast notification!
          let emoji = '🔔';
          if (data.type === 'MESSAGE') emoji = '💬';
          if (data.type === 'MODERATION') emoji = '🛡️';
          if (data.type === 'ALERT') emoji = '📍';

          toast(`${emoji} ${data.title}\n${data.content}`, {
            duration: 5000,
            style: {
              background: '#f97316', // Sleek Premium Orange keyora theme
              color: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #ea580c',
              fontSize: '14px',
              fontWeight: 500,
            },
          });
        }

        onNotification?.(data);
      } catch {
        // Ignore malformed payloads
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        const delay = Math.min(1000 * 2 ** retriesRef.current, 32000);
        setTimeout(connect, delay);
      }
    };
  }, [queryClient, showToast, onNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
