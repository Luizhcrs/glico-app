import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { Reminder } from '@/domain/types';

const TAG_PREFIX = 'glico-reminder-';

function tagFor(reminderId: number): string {
  return `${TAG_PREFIX}${reminderId}`;
}

function parseHHMM(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return { hour: h, minute: m };
}

export async function ensurePermissions(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export async function syncReminders(reminders: Reminder[]): Promise<void> {
  // cancel all existing glico-* schedules
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of all) {
    if (typeof item.identifier === 'string' && item.identifier.startsWith(TAG_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
  for (const r of reminders) {
    if (!r.enabled) continue;
    const { hour, minute } = parseHHMM(r.timeOfDay);
    await Notifications.scheduleNotificationAsync({
      identifier: tagFor(r.id),
      content: {
        title: 'Glico',
        body: `Hora de medir: ${r.label}`,
        data: { reminderId: r.id, contextHint: r.contextHint, deepLink: buildDeepLink(r) },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

function buildDeepLink(r: Reminder): string {
  const params = new URLSearchParams();
  if (r.contextHint) params.set('context', r.contextHint);
  return `glico://log?${params.toString()}`;
}

export async function scheduleHypoFollowUp(measuredAt: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `glico-hypo-followup-${measuredAt}`,
    content: {
      title: 'Glico',
      body: 'Mede de novo (regra dos 15)',
      data: { deepLink: 'glico://log?context=hypo' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 15 * 60,
    },
  });
}

export async function snoozeReminder(reminderId: number, minutes: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `${TAG_PREFIX}${reminderId}-snooze-${Date.now()}`,
    content: {
      title: 'Glico',
      body: 'Lembrete adiado',
      data: { reminderId },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
    },
  });
}
