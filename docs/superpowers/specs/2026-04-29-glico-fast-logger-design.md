# Glico — Fast Logger (Design Spec)

**Data:** 2026-04-29
**Status:** Aprovado para implementação
**Autor:** Luiz (single dev)
**Usuária alvo:** Esposa, diabetes tipo 1, ponta-de-dedo, caneta MDI

---

## 1. Contexto e propósito

Aplicativo móvel single-user para registro rápido de glicemia capilar e doses de insulina em diabetes tipo 1. A meta primária é **adesão**: a pessoa abrir o app 4+ vezes ao dia por 30+ dias seguidos sem precisar ser lembrada por terceiro.

A tese de design é que **fricção mata adesão**. Apps de T1 existentes falham porque tentam fazer tudo (bolus calc, contagem CHO, CGM, comunidade) e ficam pesados. Este app entrega o caminho mínimo viável de logging confiável e relatório, e nada mais. Recursos avançados (bolus calc, CHO, CGM, caregiver, SUS) ficam explicitamente fora do escopo do MVP.

### Critério de sucesso

- ≥4 medições/dia registradas em média.
- Sequência ≥30 dias com ≥3 medições/dia (consistência).
- Zero crashes em 30 dias.
- Relatório PDF gerável e legível por endocrinologista em consulta presencial.

---

## 2. Escopo do MVP

### Dentro

1. **Registro de medição em ≤2 toques.** Abrir app → digitar mg/dL → confirmar. Tag de contexto (jejum / pré-refeição / pós-refeição / antes-dormir / exercício / hipo / aleatório), opcional, pré-selecionada quando o app é aberto via lembrete.
2. **Lembretes inteligentes.** 6 horários default configuráveis com tolerância (default ±30min). Push silencia automaticamente se já existe medição na janela.
3. **Log de insulina.** Registro simples (unidades, basal/bolus, marca, horário). Sem cálculo. Pode ou não vincular a uma medição existente.
4. **Tendência visual.** Gráfico 7/30/90 dias com bandas de alvo (default 70-180 mg/dL). Estatísticas: TIR (time in range), média, número de hipos, quebra por janela do dia (manhã/tarde/noite).
5. **Log dedicado de hipo.** Botão "Hipo" no home → tela vermelha → sintomas (chips multiseleção: tremor, suor, tontura, fome, confusão), tratamento (açúcar 15g / suco / glucagon / outro), gramas estimados de CHO, recuperação preenchida depois. Agenda lembrete one-shot em +15min ("regra dos 15").
6. **Relatório PDF.** Export últimos 14/30 dias. Inclui tabela de medições, gráfico de tendência, estatísticas e episódios de hipo. Gerado no device, sem servidor.
7. **Tela de perfil/preferências.** Avatar (foto ou inicial), nome, condição (T1 desde / método). Configuração de alvos (faixa, hipo, hiper). Lembretes (CRUD). Export PDF e backup `.json`.

### Fora (explicitamente)

Bolus calculator, contagem de carboidratos, banco TACO/USDA, integração CGM (Libre/Dexcom), Apple Health/Google Fit, multi-device sync, modo caregiver, perfil de endocrinologista, integração SUS Conecte, receita digital, comunidade/social, gamificação, smartwatch.

---

## 3. Arquitetura e stack

### Mobile (única superfície)

- **Expo (React Native + TypeScript).** Single codebase iOS+Android. EAS Build/Update para OTA (correção de bug sem App Store review).
- **expo-sqlite** para persistência local. App funciona 100% offline.
- **expo-notifications** para lembretes locais (sem servidor push).
- **victory-native** para gráficos (mais simples para solo dev; trocar por react-native-skia se performance virar gargalo em fase 2).
- **expo-print** para gerar PDF no device.
- **expo-secure-store** + **react-native-quick-crypto** para chave de criptografia derivada de Keychain/Keystore.

### Backend

Nenhum no MVP. Justificativa:

- Dado pessoal sensível (LGPD art. 5º II) → backend implica DPO, política de retenção, criptografia em trânsito e repouso, contratos de operador. Solo dev não escala.
- App é single-user offline-first. Servidor só agrega custo e complexidade.
- Multi-device sync e caregiver entram em fase 2 com avaliação E2E (modelo Signal) ou abandono.

Backup é manual: usuário exporta `.json` cifrado por senha (AES-GCM) e salva em iCloud/Drive por conta própria.

### Stacks rejeitadas

- **Flutter** — viável; descartado porque o dev tem ferramental Node/TS estabelecido.
- **2 apps nativos (Swift + Kotlin)** — solo dev, inviável.
- **Backend Postgres + Coolify** — desnecessário no MVP.

---

## 4. Modelo de dados

SQLite local. 5 tabelas. Versionamento via `settings.schema_version`.

```sql
-- Medições de glicemia
CREATE TABLE measurement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value_mgdl INTEGER NOT NULL,            -- range válido [20, 600]
  measured_at INTEGER NOT NULL,           -- unix ms (UTC)
  context TEXT NOT NULL,                  -- 'fasting'|'pre_meal'|'post_meal'|'bedtime'|'exercise'|'hypo'|'random'
  meal_label TEXT,                        -- nullable: 'breakfast'|'lunch'|'dinner'|'snack'
  note TEXT,                              -- texto livre, opcional
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER                      -- soft delete pra undo de 5s
);
CREATE INDEX idx_measurement_at ON measurement(measured_at DESC);

-- Doses de insulina
CREATE TABLE insulin_dose (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  units REAL NOT NULL,                    -- step 0.5
  insulin_type TEXT NOT NULL,             -- 'basal'|'bolus'
  insulin_brand TEXT,                     -- nullable, texto livre (lantus, tresiba, novorapid...)
  taken_at INTEGER NOT NULL,
  measurement_id INTEGER,                 -- FK opcional
  note TEXT,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (measurement_id) REFERENCES measurement(id)
);
CREATE INDEX idx_dose_at ON insulin_dose(taken_at DESC);

-- Episódios de hipo (ligados a measurement)
CREATE TABLE hypo_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measurement_id INTEGER NOT NULL,
  symptoms TEXT,                          -- JSON array, ex: ["tremor","suor"]
  treatment TEXT,                         -- 'sugar'|'juice'|'glucagon'|'food'|'other'
  treatment_grams REAL,                   -- gramas de CHO ingeridos (estimativa)
  recovered_at INTEGER,                   -- preenchido em medição follow-up
  recovery_value_mgdl INTEGER,
  cause_guess TEXT,                       -- 'too_much_insulin'|'skipped_meal'|'exercise'|'unknown'
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (measurement_id) REFERENCES measurement(id)
);

-- Lembretes
CREATE TABLE reminder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  time_of_day TEXT NOT NULL,              -- 'HH:MM' local
  context_hint TEXT,                      -- pré-preenche tag ao abrir via deep link
  days_of_week TEXT NOT NULL,             -- '1111111' (dom..sab)
  tolerance_minutes INTEGER NOT NULL DEFAULT 30,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Settings (single row, id sempre = 1)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT,
  avatar_uri TEXT,                        -- caminho local de imagem
  diagnosis_year INTEGER,
  insulin_method TEXT DEFAULT 'pen',      -- 'pen'|'pump' (pump fica como placeholder)
  target_low INTEGER NOT NULL DEFAULT 70,
  target_high INTEGER NOT NULL DEFAULT 180,
  hypo_threshold INTEGER NOT NULL DEFAULT 70,
  severe_hypo_threshold INTEGER NOT NULL DEFAULT 54,
  hyper_threshold INTEGER NOT NULL DEFAULT 250,
  unit TEXT NOT NULL DEFAULT 'mgdl',      -- 'mgdl'|'mmol' (mmol fase 2)
  app_lock_enabled INTEGER NOT NULL DEFAULT 0,
  schema_version INTEGER NOT NULL DEFAULT 1
);
```

### Validações app-side

- `value_mgdl` em [20, 600]. Valor <40 ou >500 dispara modal de confirmação ("Tem certeza desse valor?").
- `units` em [0, 100], step 0.5.
- `measured_at` não pode ser >5 minutos no futuro.
- Hipo só dispara o flow especial se `value_mgdl < settings.hypo_threshold`.

### Soft delete e undo

- `measurement` e `insulin_dose` usam `deleted_at`. Após delete, snackbar com "Desfazer" por 5 segundos. Limpeza física via job de manutenção em fase 2.

---

## 5. Fluxos UX principais

Identidade visual: **Sage Calm** (verde sálvia + bege quente, tipografia leve, cantos arredondados, copy humana). Justificativa: T1 é estresse crônico; o app não pode ser mais um agressor visual nem se tornar lembrete clínico-frio.

### Telas

1. **Home.** Última medição em destaque (número grande + pill de status). 3 botões: Medir / Hipo / + Insulina. Lista compacta do dia. Próximo lembrete em texto curto.
2. **Logar medição.** Keypad numérico custom (sem teclado nativo). Chips de contexto (1 selecionável). Confirmação salva e volta pro home. Acessível também por deep link `glico://log?context=...&meal=...`.
3. **Logar hipo.** Tela vermelha. Multi-select de sintomas, single-select de tratamento, campo de gramas opcional. Salva → cria measurement + hypo_event linkados → agenda lembrete +15min.
4. **Logar insulina.** Tipo (basal/bolus), unidades (stepper 0.5), marca opcional, vincular à última medição (toggle).
5. **Tendência.** Toggle 7d/30d/90d. Gráfico de linha com bandas alvo. Stats em cards: TIR, média, hipos, DP. Lista por janela do dia (manhã/tarde/noite). Botão "Exportar PDF".
6. **Perfil.** Avatar, nome, condição. Alvos editáveis. CRUD de lembretes. Botão app lock toggle. Export PDF e backup `.json`. Tela "Sobre" (versão, política curta).
7. **Onboarding (primeira abertura).** 4 telas: boas-vindas → nome+foto opcional → alvos default (com explicação curta) → 6 lembretes default (editáveis). Pula-se a qualquer momento, exceto nome.

### Lembretes inteligentes

Algoritmo:

1. Configuração: N lembretes (default 6) com `time_of_day`, `tolerance_minutes`, `context_hint`.
2. No disparo do lembrete local, antes de mostrar push, executa query: `SELECT 1 FROM measurement WHERE measured_at BETWEEN scheduled_time - tolerance AND scheduled_time + tolerance AND deleted_at IS NULL LIMIT 1`. Se existe, **silencia** (cancela notificação local).
3. Push tem 2 ações: "Adiar 15min" (reagenda local, máx 2x por slot) e "Medir agora" (deep link para tela 2 com `context_hint` e `meal_label` pré-preenchidos).
4. Hipo follow-up: ao salvar `hypo_event`, agenda lembrete one-shot em +15min com label "Mede de novo (regra dos 15)". Não conta como slot regular.
5. Sem janela de sono no MVP. Usuário desativa lembretes manualmente em viagens/madrugadas.

---

## 6. Privacidade e segurança

- **Dado nunca sai do device.** Único trânsito é export manual (PDF ou .json criptografado) iniciado pela usuária.
- **SQLite criptografado em repouso** com chave derivada de Keychain (iOS) / Keystore (Android), via expo-secure-store + react-native-quick-crypto.
- **App lock** opcional (PIN ou biométrico) configurável em Perfil. Default off; recomenda-se ativar no onboarding.
- **Backup `.json`** sempre criptografado com senha definida pela usuária. AES-256-GCM com chave derivada via PBKDF2-SHA256 (≥600.000 iterações, salt aleatório de 16 bytes por backup). Senha perdida = backup perdido. Aviso explícito antes do export.
- **PDF do relatório** em texto claro (precisa ser legível pelo médico). Aviso "Compartilhe apenas com seu médico".
- **Crash reporting / telemetria / analytics:** zero. Sem Sentry, sem Firebase, sem evento anônimo. Justificativa: dado de saúde sensível + contexto solo dev, o risco supera qualquer benefício observacional.
- **Política de privacidade:** texto curto na tela "Sobre". Resumo: "Seus dados nunca saem do seu celular. Só você tem acesso. Backup é seu, exportação é sua."

---

## 7. Estratégia de testes

### Unit (Jest)

- Validators (faixa de valor, step de unidades, futuro vs presente).
- Cálculo de TIR: edge cases de timezone, dias parciais, gaps prolongados.
- Algoritmo de silenciamento de lembrete (janela ±tolerance, dia da semana).
- Schema migrations (v1 → v2 stub).
- Soft delete + undo (insert / delete / restore inside 5s window).

### Integration (Jest + expo-sqlite)

- Inserir measurement → aparece em query do dia corrente.
- Hipo flow: criar measurement com value < threshold → cria hypo_event linkado.
- Backup export → reimport restaura dados idênticos.

### E2E (Maestro)

- Onboarding completo → primeira medição → ver no home.
- Tap em notificação de lembrete → tela 2 com contexto correto.
- Flow de hipo do início ao fim com agendamento do lembrete +15min.
- Export de PDF (verifica arquivo gerado, não conteúdo visual).

### Cobertura

- Domain logic (validators, TIR, lembrete, migrations): meta 80%+.
- UI components: snapshot test só de componentes puros (chips, big-num, pill). Sem snapshot de telas inteiras.
- Não testado: pixel-perfect, screen readers (acessibilidade WCAG = fase 2).

---

## 8. Roadmap pós-MVP

Ordem provável após 30+ dias de uso real:

1. Apple Health / Google Fit sync (read-only, prepara terreno para CGM).
2. Multi-device sync E2E criptografado (transport via iCloud/Drive).
3. Caregiver mode (Luiz vê leitura read-only via convite tokenizado).
4. Bolus calculator — somente após avaliação regulatória ANVISA (software de cálculo de dose pode classificar como dispositivo médico classe II).
5. Integração CGM (Libre, Dexcom).
6. Banco CHO + meal log (TACO + favoritos).
7. SUS Conecte (importar exames, receita Memed/SNS).
8. Compartilhamento online com endo via link temporário.

Cada item entra em design separado quando a hora chegar.

---

## 9. Decisões registradas (para referência futura)

- **Plataforma:** Expo (React Native + TS). Justificativa: solo dev, OTA, ecossistema Node já dominado.
- **Backend:** zero no MVP. Justificativa: LGPD + complexidade vs valor real.
- **Bolus calc:** fora do MVP. Justificativa: risco regulatório (classe II ANVISA) + escopo.
- **Identidade visual:** Sage Calm (verde sálvia). Justificativa: reduzir ansiedade, não infantilizar nem clinificar.
- **Caregiver / endo:** fora do MVP. Justificativa: relação atual com endo não comporta; foco em adesão da usuária primária.
- **SUS:** fora do MVP, ideia parqueada. Justificativa: nice-to-have, sem dor real demonstrada.
