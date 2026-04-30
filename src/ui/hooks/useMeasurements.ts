// src/ui/hooks/useMeasurements.ts
import { useEffect, useState, useCallback } from 'react';
import { getDbSync } from '@/db/client';
import { measurementRepo } from '@/domain/measurement';
import type { Measurement } from '@/domain/types';

export function useMeasurementsInRange(fromMs: number, toMs: number) {
  const [data, setData] = useState<Measurement[]>([]);
  const reload = useCallback(() => {
    setData(measurementRepo(getDbSync()).listInRange(fromMs, toMs));
  }, [fromMs, toMs]);
  useEffect(() => { reload(); }, [reload]);
  return { data, reload };
}

export function useLatestMeasurement() {
  const [data, setData] = useState<Measurement | null>(null);
  const [previous, setPrevious] = useState<Measurement | null>(null);
  const reload = useCallback(() => {
    const repo = measurementRepo(getDbSync());
    const latest = repo.latest();
    setData(latest);
    setPrevious(latest ? repo.previousBefore(latest.measuredAt) : null);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, previous, reload };
}
