// src/pdf/report.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { computeStats, bucketByTimeOfDay } from '@/domain/stats';
import { hypoRepo } from '@/domain/hypo';
import { getDbSync } from '@/db/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Measurement, Settings, GlucoseContext, MealLabel, HypoSymptom, HypoTreatment } from '@/domain/types';

const CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  exercise: 'Exercício',
  hypo: 'Hipoglicemia',
  random: 'Aleatório',
};

const MEAL_LABEL: Record<MealLabel, string> = {
  breakfast: 'Café',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
};

const SYMPTOM_LABEL: Record<HypoSymptom, string> = {
  tremor: 'Tremor',
  sweat: 'Suor',
  dizziness: 'Tontura',
  hunger: 'Fome',
  confusion: 'Confusão',
  irritability: 'Irritabilidade',
};

const TREATMENT_LABEL: Record<HypoTreatment, string> = {
  sugar: 'Açúcar 15g',
  juice: 'Suco',
  glucagon: 'Glucagon',
  food: 'Comida',
  other: 'Outro',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function valueClass(value: number, low: number, high: number): string {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'ok';
}

function buildHtml(data: Measurement[], settings: Settings, days: number): string {
  const stats = computeStats(data, { targetLow: settings.targetLow, targetHigh: settings.targetHigh });
  const buckets = bucketByTimeOfDay(data);
  const sorted = data.slice().sort((a, b) => b.measuredAt - a.measuredAt);

  const repo = hypoRepo(getDbSync());

  const rows = sorted
    .map((m) => {
      const cls = valueClass(m.valueMgdl, settings.targetLow, settings.targetHigh);
      const ctx = escapeHtml(CONTEXT_LABEL[m.context] ?? m.context);
      const meal = m.mealLabel ? ` · ${escapeHtml(MEAL_LABEL[m.mealLabel] ?? m.mealLabel)}` : '';
      const note = m.note ? `<div class="note">${escapeHtml(m.note)}</div>` : '';
      return `
        <tr>
          <td>${format(new Date(m.measuredAt), "dd/MM HH:mm", { locale: ptBR })}</td>
          <td><span class="value ${cls}">${m.valueMgdl}</span></td>
          <td>${ctx}${meal}${note}</td>
        </tr>
      `;
    })
    .join('');

  const hypoEvents = sorted
    .filter((m) => m.context === 'hypo')
    .map((m) => repo.findByMeasurementId(m.id))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const hypoRows = hypoEvents
    .map((e) => {
      const m = sorted.find((x) => x.id === e.measurementId);
      if (!m) return '';
      const symptoms = e.symptoms.length > 0
        ? e.symptoms.map((s) => SYMPTOM_LABEL[s] ?? s).join(', ')
        : '—';
      const treatment = e.treatment ? (TREATMENT_LABEL[e.treatment] ?? e.treatment) : '—';
      const recovered = e.recoveredAt
        ? `${e.recoveryValueMgdl ?? '?'} mg/dL às ${format(new Date(e.recoveredAt), 'HH:mm')}`
        : 'Não registrada';
      return `
        <tr>
          <td>${format(new Date(m.measuredAt), "dd/MM HH:mm", { locale: ptBR })}</td>
          <td><span class="value low">${m.valueMgdl}</span></td>
          <td>${escapeHtml(symptoms)}</td>
          <td>${escapeHtml(treatment)}</td>
          <td>${escapeHtml(recovered)}</td>
        </tr>
      `;
    })
    .join('');

  const name = settings.displayName ?? '—';
  const generated = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Glico — Relatório</title>
      <style>
        @page { margin: 24px 18px; }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 0;
          margin: 0;
          color: #2d3a2d;
          background: #f5f3ed;
          font-size: 12px;
          line-height: 1.4;
        }
        .container { padding: 24px; }
        header {
          display: flex; justify-content: space-between; align-items: flex-end;
          padding-bottom: 12px;
          border-bottom: 2px solid #5a7a5a;
        }
        .brand { color: #5a7a5a; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .brand-sub { color: #6b7a6b; font-size: 11px; margin-top: 2px; }
        .meta { text-align: right; color: #6b7a6b; font-size: 11px; }

        h2 { color: #5a7a5a; font-size: 14px; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .patient { display: flex; gap: 24px; margin: 16px 0 4px; }
        .patient-block { flex: 1; }
        .label { font-size: 10px; color: #6b7a6b; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
        .field { font-size: 13px; color: #2d3a2d; font-weight: 600; }

        .stats {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
          margin-top: 12px;
        }
        .stat {
          background: #fff; border: 1px solid #e8e4d8; border-radius: 8px;
          padding: 10px 12px;
        }
        .stat-num { font-size: 20px; font-weight: 700; color: #2d3a2d; line-height: 1; }
        .stat-lbl { font-size: 10px; color: #6b7a6b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

        .buckets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
        .bucket { background: #fff; border: 1px solid #e8e4d8; border-radius: 6px; padding: 8px; }
        .bucket-title { font-size: 10px; color: #6b7a6b; text-transform: uppercase; letter-spacing: 0.5px; }
        .bucket-mean { font-size: 16px; font-weight: 700; color: #2d3a2d; margin-top: 2px; }
        .bucket-count { font-size: 10px; color: #6b7a6b; }

        table { width: 100%; border-collapse: collapse; margin-top: 8px; background: #fff; border-radius: 6px; overflow: hidden; }
        th, td { padding: 8px 10px; text-align: left; font-size: 11px; vertical-align: top; }
        th { background: #e8e4d8; color: #2d3a2d; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; }
        tbody tr { border-top: 1px solid #f0ece0; }
        tbody tr:first-child { border-top: none; }

        .value { font-weight: 700; font-variant-numeric: tabular-nums; }
        .value.low { color: #b22; }
        .value.high { color: #b08a3a; }
        .value.ok { color: #2d5a2d; }
        .note { color: #6b7a6b; font-size: 10px; font-style: italic; margin-top: 2px; }

        footer {
          margin-top: 24px; padding-top: 12px; border-top: 1px solid #e8e4d8;
          color: #6b7a6b; font-size: 10px; text-align: center;
        }
        .legend { display: flex; gap: 12px; margin-top: 6px; font-size: 10px; color: #6b7a6b; }
        .legend-item { display: flex; align-items: center; gap: 4px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 4px; }
        .empty { text-align: center; padding: 16px; color: #6b7a6b; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div>
            <div class="brand">Glico</div>
            <div class="brand-sub">Relatório de monitoramento de glicemia</div>
          </div>
          <div class="meta">
            <div>Gerado em ${generated}</div>
            <div>Período: últimos ${days} dias</div>
          </div>
        </header>

        <div class="patient">
          <div class="patient-block">
            <div class="label">Paciente</div>
            <div class="field">${escapeHtml(name)}</div>
          </div>
          <div class="patient-block">
            <div class="label">Faixa alvo</div>
            <div class="field">${settings.targetLow}–${settings.targetHigh} mg/dL</div>
          </div>
          <div class="patient-block">
            <div class="label">Hipo / Hiper</div>
            <div class="field">&lt; ${settings.hypoThreshold} / &gt; ${settings.hyperThreshold} mg/dL</div>
          </div>
        </div>

        <h2>Resumo</h2>
        <div class="stats">
          <div class="stat"><div class="stat-num">${stats.tirPct}%</div><div class="stat-lbl">Tempo no alvo</div></div>
          <div class="stat"><div class="stat-num">${stats.meanMgdl}</div><div class="stat-lbl">Média mg/dL</div></div>
          <div class="stat"><div class="stat-num">${stats.stdDev}</div><div class="stat-lbl">Desvio padrão</div></div>
          <div class="stat"><div class="stat-num">${stats.hypoCount}</div><div class="stat-lbl">Hipos</div></div>
          <div class="stat"><div class="stat-num">${stats.count}</div><div class="stat-lbl">Medições</div></div>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="legend-dot" style="background:#2d5a2d"></span>Em alvo</div>
          <div class="legend-item"><span class="legend-dot" style="background:#b22"></span>Hipo</div>
          <div class="legend-item"><span class="legend-dot" style="background:#b08a3a"></span>Hiper</div>
        </div>

        <h2>Por janela do dia</h2>
        <div class="buckets">
          <div class="bucket"><div class="bucket-title">Manhã 06–12</div><div class="bucket-mean">${buckets.morning.count ? buckets.morning.mean : '—'}</div><div class="bucket-count">${buckets.morning.count} medições</div></div>
          <div class="bucket"><div class="bucket-title">Tarde 12–18</div><div class="bucket-mean">${buckets.afternoon.count ? buckets.afternoon.mean : '—'}</div><div class="bucket-count">${buckets.afternoon.count} medições</div></div>
          <div class="bucket"><div class="bucket-title">Noite 18–24</div><div class="bucket-mean">${buckets.evening.count ? buckets.evening.mean : '—'}</div><div class="bucket-count">${buckets.evening.count} medições</div></div>
          <div class="bucket"><div class="bucket-title">Madrug. 00–06</div><div class="bucket-mean">${buckets.night.count ? buckets.night.mean : '—'}</div><div class="bucket-count">${buckets.night.count} medições</div></div>
        </div>

        <h2>Episódios de hipoglicemia</h2>
        ${hypoRows ? `
          <table>
            <thead><tr><th>Quando</th><th>Valor</th><th>Sintomas</th><th>Tratamento</th><th>Recuperação</th></tr></thead>
            <tbody>${hypoRows}</tbody>
          </table>
        ` : `<div class="empty">Nenhum episódio de hipoglicemia registrado no período.</div>`}

        <h2>Tabela de medições</h2>
        ${rows ? `
          <table>
            <thead><tr><th>Data/Hora</th><th>mg/dL</th><th>Contexto</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        ` : `<div class="empty">Nenhuma medição no período.</div>`}

        <footer>
          Compartilhe este documento apenas com seu médico. Dados gerados pelo Glico — armazenados localmente no dispositivo do paciente.
        </footer>
      </div>
    </body>
    </html>
  `;
}

export async function generateAndShareReport(
  data: Measurement[],
  settings: Settings,
  days: number,
): Promise<void> {
  const html = buildHtml(data, settings, days);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório Glico' });
  }
}
