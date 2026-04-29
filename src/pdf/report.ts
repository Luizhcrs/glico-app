// src/pdf/report.ts
//
// Minimal stub to satisfy Task 27 (trend screen) imports.
// Full implementation lands in Task 28: PDF report builder.
import type { Measurement, Settings } from '@/domain/types';

export async function generateAndShareReport(
  _data: Measurement[],
  _settings: Settings,
  _days: number,
): Promise<void> {
  // no-op until Task 28 wires expo-print + expo-sharing
}
