import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateContactCaches } from '@/hooks/useContacts';

/**
 * Subscribes to Supabase Realtime changes on contacts, activities, and events,
 * and invalidates the corresponding React Query caches automatically.
 * All open tabs receive Realtime events within ~2s, keeping caches in sync.
 * Mount once at the app level.
 */
export const useRealtimeSync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('global-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          invalidateContactCaches(qc);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          console.log('Realtime: activities changed, invalidating cache');
          qc.invalidateQueries({ queryKey: ['activities'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          console.log('Realtime: events changed, invalidating cache');
          qc.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe((status, err) => {
        console.log('Global Realtime Channel Status:', status, err);
      });

    return () => {
      console.log('Unsubscribing from global Realtime channel');
      supabase.removeChannel(channel);
    };
  }, [qc]);
};
