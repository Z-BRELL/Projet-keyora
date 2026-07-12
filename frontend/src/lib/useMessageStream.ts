'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from './store';
import { API_URL } from './api';

interface IncomingMessage {
  type?: 'connected';
  id?: string;
  content?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string | null;
  recipientId?: string;
  listingId?: string | null;
  listingTitle?: string | null;
  sentAt?: string;
}

interface UseMessageStreamOptions {
  /** Affiche une notification toast à chaque nouveau message */
  showToast?: boolean;
  /** Callback appelé à chaque nouveau message reçu */
  onMessage?: (msg: IncomingMessage) => void;
}

/**
 * Hook React pour recevoir les messages en temps réel via SSE.
 *
 * Usage :
 *   // Dans un composant layout ou une page messagerie
 *   useMessageStream({ showToast: true });
 *
 * Le hook :
 *  1. Ouvre une connexion SSE sur /api/messages/stream (authentifiée via cookie)
 *  2. À chaque message reçu, invalide les queries React Query 'conversations' et 'unread'
 *  3. Optionnellement affiche un toast et appelle onMessage()
 *  4. Reconnecte automatiquement en cas de coupure (max 5 tentatives)
 *  5. Ferme la connexion proprement quand le composant est démonté
 */
export function useMessageStream(options: UseMessageStreamOptions = {}) {
  const { showToast = true, onMessage } = options;
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    // Ferme une connexion existante avant d'en ouvrir une nouvelle
    if (esRef.current) {
      esRef.current.close();
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const url = `${API_URL}/api/messages/stream${token ? `?token=${token}` : ''}`;
    // withCredentials = true pour envoyer les cookies HttpOnly
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      retriesRef.current = 0; // Réinitialise le compteur de reconnexion
    };

    es.onmessage = (event) => {
      try {
        const data: IncomingMessage = JSON.parse(event.data);

        // Message système de confirmation de connexion
        if (data.type === 'connected') return;

        // ─── Invalide les queries React Query ───────────────────────────────
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread'] });

        // ─── Toast de notification ───────────────────────────────────────────
        if (showToast && data.senderName) {
          const label = data.listingTitle
            ? `📨 ${data.senderName} — "${data.listingTitle}"`
            : `📨 ${data.senderName}`;
          toast(label, {
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '10px',
              border: '1px solid #334155',
            },
            icon: '💬',
          });
        }

        // ─── Callback personnalisé ───────────────────────────────────────────
        onMessage?.(data);
      } catch {
        // Ignore les messages mal formés
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        // Backoff exponentiel : 2s, 4s, 8s, 16s, 32s
        const delay = Math.min(1000 * 2 ** retriesRef.current, 32000);
        setTimeout(connect, delay);
      }
      // Après 5 tentatives, on abandonne silencieusement
    };
  }, [queryClient, showToast, onMessage]);

  useEffect(() => {
    // Ne se connecte qu'en environnement navigateur (pas en SSR)
    if (typeof window === 'undefined') return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
