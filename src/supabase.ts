import { createClient } from '@supabase/supabase-js';
import { INITIAL_GARMENTS } from './data';
import { Garment } from './types';

const SUPABASE_URL = 'https://qsciwldqdybkgduusesg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XNPRYYcOE_HWyRZW41A6hQ_wQKbmlXl';
const STATE_ID = 'default';

export type AppState = {
  garments: Garment[];
  categories: string[];
};

export const defaultAppState: AppState = {
  garments: INITIAL_GARMENTS,
  categories: [
    'All',
    ...Array.from(
      new Set(
        INITIAL_GARMENTS
          .map(garment => garment.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ],
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeState(value: unknown): AppState {
  const data = value as Partial<AppState> | null;
  return {
    garments: Array.isArray(data?.garments) ? data.garments : defaultAppState.garments,
    categories: Array.isArray(data?.categories) ? data.categories : defaultAppState.categories,
  };
}

export async function loadCloudState(): Promise<AppState> {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', STATE_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    await saveCloudState(defaultAppState);
    return defaultAppState;
  }

  return normalizeState(data.data);
}

export async function saveCloudState(nextState: AppState): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert({
      id: STATE_ID,
      data: nextState,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

export function subscribeToCloudState(onChange: () => void): () => void {
  const channel = supabase
    .channel('app-state-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${STATE_ID}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
