// src/pdf/report.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { computeStats } from '@/domain/stats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Measurement, Settings } from '@/domain/types';

function buildHtml(data: Measurement[], settings: Settings, days: number): string {
  const stats = computeStats(data, { targetLow: settings.targetLow, targetHigh: settings.targetHigh });
  const rows = data
    .slice()
    .sort((a, b) => b.measuredAt - a.measuredAt)
    .map((m) => `
      <tr>
        <td>${format(new Date(m.measuredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
        <td>${m.valueMgdl}</td>
        <td>${m.context}</td>
      </tr>
    `).join('');
  const name = settings.displayName ?? '—';
  return `
    <html>
      <head><meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; color: #2d3a2d; }
          h1 { color: #5a7a5a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { padding: 6px 8px; border-bottom: 1px solid #d8d4c8; text-align: left; font-size: 12px; }
          .stats { display: flex; gap: 16px; margin-top: 12px; }
          .stat { flex: 1; padding: 12px; background: #e8e4d8; border-radius: 8px; }
          .stat strong { font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>Glico — Relatório de glicemia</h1>
        <p>Paciente: <strong>${name}</strong> · Período: últimos ${days} dias · Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        <p>Faixa alvo: ${settings.targetLow}–${settings.targetHigh} mg/dL · Hipo: &lt;${settings.hypoThreshold} · Hiper: &gt;${settings.hyperThreshold}</p>
        <div class="stats">
          <div class="stat"><strong>${stats.tirPct}%</strong><br>Tempo no alvo</div>
          <div class="stat"><strong>${stats.meanMgdl}</strong><br>Média</div>
          <div class="stat"><strong>${stats.stdDev}</strong><br>Desvio padrão</div>
          <div class="stat"><strong>${stats.hypoCount}</strong><br>Hipos</div>
          <div class="stat"><strong>${stats.count}</strong><br>Medições</div>
        </div>
        <h2>Tabela de medições</h2>
        <table>
          <thead><tr><th>Data/Hora</th><th>mg/dL</th><th>Contexto</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px; color:#888; font-size:11px">Compartilhe apenas com seu médico.</p>
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
