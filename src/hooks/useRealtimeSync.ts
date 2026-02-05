'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSyncOptions {
  table: string;
  filter?: string;
  enabled?: boolean;
}

export function useRealtimeSync<T>({ table, filter, enabled = true }: UseRealtimeSyncOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            console.log('Realtime update:', payload);

            switch (payload.eventType) {
              case 'INSERT':
                setData((prev) => [...prev, payload.new as T]);
                break;
              case 'UPDATE':
                setData((prev) =>
                  prev.map((item) =>
                    (item as Record<string, unknown>).id === (payload.new as Record<string, unknown>).id
                      ? (payload.new as T)
                      : item
                  )
                );
                break;
              case 'DELETE':
                setData((prev) =>
                  prev.filter(
                    (item) => (item as Record<string, unknown>).id !== (payload.old as Record<string, unknown>).id
                  )
                );
                break;
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
          if (status === 'CHANNEL_ERROR') {
            setError(new Error('Realtime subscription failed'));
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter, enabled]);

  return {
    data,
    setData,
    isConnected,
    error,
  };
}
