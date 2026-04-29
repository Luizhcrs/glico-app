// src/ui/hooks/useSettings.ts
import { useEffect, useState, useCallback } from 'react';
import { getDbSync } from '@/db/client';
import { settingsRepo } from '@/domain/settings';
import type { Settings } from '@/domain/types';

export function useSettings() {
  const [data, setData] = useState<Settings | null>(null);
  const reload = useCallback(() => {
    setData(settingsRepo(getDbSync()).get());
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, reload };
}
