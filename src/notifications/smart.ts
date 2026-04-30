// src/notifications/smart.ts
// "Inteligência" dos lembretes:
// 1. Ao salvar medição, cancelamos qualquer lembrete agendado pra hoje cuja
//    janela [HH:MM ± tolerance] inclua o instante da medição. Reagenda no dia
//    seguinte automaticamente porque sync recria diários no próximo trigger.
// 2. setNotificationHandler verifica em foreground se já existe medição na
//    janela e, se sim, suprime o pop-up.
//
// Estratégia simples e local — não depende de background tasks.

import * as Notifications from 'expo-notifications';
import { measurementRepo } from '@/domain/measurement';
import { reminderRepo } from '@/domain/reminder';
import { getDbSync } from '@/db/client';
import { shouldSilence } from './silencer';
import type { Reminder } from '@/domain/types';

interface ScheduledItem {
  identifier: string;
  reminderId?: number;
  triggerHour?: number;
  triggerMinute?: number;
}

const TAG_PREFIX = 'glico-reminder-';

function todayAt(hour: number, minute: number): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

/**
 * Quando o usuário salva uma medição, varre lembretes habilitados e cancela
 * qualquer ocorrência de hoje cuja janela ±tolerance contenha measuredAt.
 * O sync diário (DAILY trigger) reagenda automático pra próxima ocorrência.
 */
export async function silenceCoveredReminders(measuredAtMs: number): Promise<void> {
  const reminders = reminderRepo(getDbSync()).listEnabled();
  for (const r of reminders) {
    const [hh, mm] = r.timeOfDay.split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const scheduledMs = todayAt(hh, mm);
    const window = r.toleranceMinutes * 60_000;
    if (Math.abs(scheduledMs - measuredAtMs) <= window) {
      // Lembrete cobre essa medição → cancela ocorrência de HOJE.
      // O DAILY trigger garante que reaparece amanhã.
      const id = `${TAG_PREFIX}${r.id}`;
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
        // Reagenda imediato pra DAILY voltar pra ativo (cancel some o slot daily).
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: 'Glico',
            body: `Hora de medir: ${r.label}`,
            data: { reminderId: r.id, contextHint: r.contextHint, deepLink: buildDeepLink(r) },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh, minute: mm },
        });
      } catch {
        // ok se já não existir
      }
    }
  }
}

function buildDeepLink(r: Reminder): string {
  const params = new URLSearchParams();
  if (r.contextHint) params.set('context', r.contextHint);
  return `glico://log?${params.toString()}`;
}

/**
 * Handler global de foreground — chamado quando notif chega com app aberto.
 * Suprime pop-up se já há medição na janela ±tolerance.
 */
export function installSmartReminderHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { reminderId?: number };
      const reminderId = typeof data?.reminderId === 'number' ? data.reminderId : null;

      // Não é um lembrete (ex.: hypo follow-up) → mostra normal
      if (reminderId == null) {
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        } as Notifications.NotificationBehavior;
      }

      const reminder = reminderRepo(getDbSync()).findById(reminderId);
      if (!reminder) {
        return {
          shouldShowBanner: true, shouldShowList: true,
          shouldPlaySound: true, shouldSetBadge: false,
        } as Notifications.NotificationBehavior;
      }

      const [hh, mm] = reminder.timeOfDay.split(':').map((x) => parseInt(x, 10));
      const scheduledMs = todayAt(hh, mm);
      const window = reminder.toleranceMinutes;
      const recent = measurementRepo(getDbSync()).listInRange(
        scheduledMs - window * 60_000,
        scheduledMs + window * 60_000,
      );
      const silence = shouldSilence(scheduledMs, window, recent);

      return {
        shouldShowBanner: !silence,
        shouldShowList: !silence,
        shouldPlaySound: !silence,
        shouldSetBadge: false,
      } as Notifications.NotificationBehavior;
    },
  });
}
