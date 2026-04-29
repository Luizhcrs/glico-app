import type { GlucoseContext, MealLabel } from '@/domain/types';

const VALID_CONTEXTS: GlucoseContext[] = ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'exercise', 'hypo', 'random'];
const VALID_MEALS: MealLabel[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface LogDeepLink {
  context?: GlucoseContext;
  mealLabel?: MealLabel;
}

export function parseLogDeepLink(url: string): LogDeepLink {
  const out: LogDeepLink = {};
  const idx = url.indexOf('?');
  if (idx === -1) return out;
  const qs = url.slice(idx + 1);
  const params = new URLSearchParams(qs);
  const ctx = params.get('context');
  if (ctx && (VALID_CONTEXTS as string[]).includes(ctx)) out.context = ctx as GlucoseContext;
  const meal = params.get('meal');
  if (meal && (VALID_MEALS as string[]).includes(meal)) out.mealLabel = meal as MealLabel;
  return out;
}
