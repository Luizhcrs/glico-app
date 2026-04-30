# Glico

App mobile single-user de monitoramento de glicemia para diabetes tipo 1, com identidade visual Sage Calm.

> **Status:** v0.1 em desenvolvimento ativo. Não distribuído publicamente.
> **Licença:** Proprietário (uso pessoal).
> **Mantenedor:** Luiz ([@luizhcrs](https://github.com/Luizhcrs))

---

## O que é

Glico é um aplicativo single-user que registra glicemia capilar (ponta-de-dedo), aplicações de insulina (caneta MDI) e episódios de hipoglicemia para diabetes tipo 1. Tudo offline, todos os dados ficam no aparelho do usuário.

Não substitui orientação médica. Não calcula bolus. Não pretende ser um dispositivo médico.

### Funcionalidades atuais

- Registro de medição de glicemia em ≤2 toques (keypad customizado, contexto pré-selecionado por lembrete)
- Registro de insulina lenta (basal) ou rápida (bolus) com pré-população da última marca usada (Basaglar, Lantus, Tresiba, Toujeo, Levemir; Fiasp, NovoRapid, Humalog, Apidra)
- Registro de episódios de hipoglicemia com sintomas, tratamento e tempo de recuperação
- Lembretes diários inteligentes (cancelam automaticamente se houve medição na janela ±tolerância)
- Tendência com TIR (time in range), média, hipos, e quebra por janela do dia
- Relatório PDF Sage Calm pra mostrar no endocrinologista
- Foto de perfil
- App lock por PIN (opcional)
- Backup `.json` cifrado com AES-256-GCM (PBKDF2-SHA256, 600k iter)
- Reset total de perfil
- Swipe-to-delete na lista do dia com 5s de undo
- Edição de medição via bottom sheet
- SectionList por janela do dia (Manhã / Tarde / Noite / Madrugada)
- Toasts custom Sage Calm (substituem Alert nativo)

---

## Stack

- **Mobile:** Expo SDK 54, React Native, TypeScript
- **Routing:** expo-router (file-based)
- **Estado / DB:** SQLite local via `expo-sqlite` (5 tabelas, migrations versionadas)
- **Crypto:** `react-native-quick-crypto` (AES-256-GCM, PBKDF2-SHA256), `expo-secure-store` (Keystore/Keychain)
- **UI:** Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`), `lucide-react-native`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`
- **Charts:** `victory-native` v41 (Skia)
- **Notificações:** `expo-notifications` (push local, smart silencer)
- **PDF:** `expo-print` + `expo-sharing`
- **Foto:** `expo-image-picker`
- **Haptics:** `expo-haptics`
- **Build:** EAS Build (Android profile development + preview)
- **Tests:** Jest (unit/integration), Maestro (E2E YAML)

---

## Estrutura

```
glico-app/
├── app/                    # expo-router screens
│   ├── _layout.tsx         # root: db init, fonts, gate, toast/gesture providers
│   ├── index.tsx           # home: greeting, hero card, lista por bucket
│   ├── log.tsx             # registro de medição
│   ├── hypo.tsx            # registro de hipo
│   ├── insulin.tsx         # registro de insulina
│   ├── trend.tsx           # gráfico + stats + buckets
│   ├── profile/
│   │   ├── index.tsx       # perfil principal
│   │   ├── targets.tsx     # alvos de glicemia
│   │   ├── reminders.tsx   # CRUD lembretes
│   │   ├── lock.tsx        # PIN
│   │   └── about.tsx       # sobre + reset perfil
│   └── onboarding/
│       ├── welcome.tsx, name.tsx, targets.tsx, reminders.tsx
├── src/
│   ├── db/                 # cliente sqlite, schema, migrations, seed
│   ├── domain/             # types, validators, repos, stats
│   ├── notifications/      # scheduler, silencer, smart handler, deeplink
│   ├── crypto/             # keychain wrapper, backup AES-256-GCM
│   ├── pdf/                # report generator
│   └── ui/
│       ├── theme.ts        # tokens (cores, tipografia, spacing)
│       ├── components/     # Screen, BigNumber, StatusPill, ContextChips, Keypad,
│       │                   # ActionButton, Toast, ConfirmDialog, MeasurementSheet,
│       │                   # SwipeableMeasurementRow, BrandLogo, TrendArrow, StepDots
│       └── hooks/          # useMeasurements, useStats, useSettings
├── assets/
│   ├── branding/           # SVGs editáveis (icon, adaptive-foreground, splash)
│   ├── icon.png            # gerado de SVG via scripts/generate-icons.mjs
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
├── scripts/
│   └── generate-icons.mjs  # rasteriza SVGs em PNGs (sharp)
├── docs/
│   ├── superpowers/specs/  # spec original
│   ├── superpowers/plans/  # plano de implementação
│   ├── design-system.md    # tokens + voz + regras visuais
│   ├── ux-audit-2026-04-30.md
│   ├── ux-references-2026-04-30.md
│   └── roadmap-premium-2026-04-30.md
└── tests/
    ├── unit/               # Jest pure-logic
    ├── integration/        # Jest + better-sqlite3
    └── e2e/                # Maestro YAML
```

---

## Setup

### Pré-requisitos
- Node 20+
- npm 10+
- Para build local Android: Android Studio (SDK + JDK 17/21)
- Para build EAS: conta Expo + `npx eas-cli login`

### Instalação
```bash
git clone https://github.com/Luizhcrs/glico-app
cd glico-app
npm install --legacy-peer-deps
```

`.npmrc` no projeto já tem `legacy-peer-deps=true` por causa de conflitos React 19.

### Dev (Metro + dev-client)
```bash
# WiFi: pega IP local do PC, ex: 192.168.0.102
CI=1 EXPO_PACKAGER_HOSTNAME=192.168.0.102 npx expo start --dev-client --port 8082
```
No celular: instala APK dev-client (gerado por EAS profile development), abre, "Enter URL manually" → `http://192.168.0.102:8082`.

Live reload roda em qualquer mudança de JS/TS. Mudança em deps native (`app.json`, plugins, native modules) exige rebuild EAS.

### Build APK final (preview)
```bash
EXPO_TOKEN=... npx eas-cli build --platform android --profile preview --non-interactive --no-wait
```
Demora ~10-30min na fila + ~10min compile. APK fica em `https://expo.dev/artifacts/...apk`. Standalone, instala em qualquer Android, não precisa Metro.

### Build APK dev (com hot reload)
```bash
EXPO_TOKEN=... npx eas-cli build --platform android --profile development --non-interactive --no-wait
```
Mesmo timing. APK conecta no Metro do PC.

### Tests
```bash
npx jest                         # unit + integration
npx jest tests/unit              # só unit
npx tsc --noEmit                 # typecheck strict
```

### Regerar ícones (após edit nos SVGs)
```bash
node scripts/generate-icons.mjs
```
Atualiza `assets/icon.png`, `adaptive-icon.png`, `favicon.png`, `splash-icon.png`. Mudança em ícone exige rebuild EAS pra app instalada refletir.

---

## Arquitetura — decisões importantes

1. **Zero backend.** Todos os dados ficam em SQLite local no device. Backup é manual via export `.json` cifrado. Não há servidor, não há sincronização, não há contas.
2. **LGPD-friendly por construção.** Dados sensíveis de saúde nunca trafegam. Único trânsito: PDF do relatório (gerado on-device) e backup (cifrado AES-256-GCM, senha do user).
3. **Bolus calculator está fora do escopo.** Software de cálculo de dose é dispositivo médico classe II pela ANVISA. Risco regulatório e civil incompatível com solo dev. Glico apenas registra; nunca sugere.
4. **Lembretes inteligentes via Notifications API.** Ao salvar medição, varre lembretes habilitados e cancela ocorrência de hoje cuja janela ±tolerance contém o instante medido. Em foreground, `setNotificationHandler` suprime push se já há medição na janela. Não usa background tasks.
5. **Identidade visual Sage Calm.** Verde sálvia (#5a7a5a) + bege quente (#f5f3ed) + Plus Jakarta Sans. Anti-âncora: app de saúde clínico-frio, fitness gamificado, mascote infantil.

Decisões completas em `docs/superpowers/specs/2026-04-29-glico-fast-logger-design.md`.

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/design-system.md`](docs/design-system.md) | Identidade visual completa: voz, logo, paleta, tipografia, espaçamento, ícones, componentes, motion, microcopy, acessibilidade |
| [`docs/superpowers/specs/2026-04-29-glico-fast-logger-design.md`](docs/superpowers/specs/2026-04-29-glico-fast-logger-design.md) | Spec original: escopo, arquitetura, modelo de dados, fluxos UX, privacidade, testes |
| [`docs/superpowers/plans/2026-04-29-glico-fast-logger-plan.md`](docs/superpowers/plans/2026-04-29-glico-fast-logger-plan.md) | Plano de implementação em 34 tasks com código completo |
| [`docs/ux-audit-2026-04-30.md`](docs/ux-audit-2026-04-30.md) | Audit de 94 gaps em 15 categorias |
| [`docs/ux-references-2026-04-30.md`](docs/ux-references-2026-04-30.md) | 12 apps de referência (Oura, mySugr, Apple Health, Sleep Cycle, etc) com padrões pra roubar |
| [`docs/roadmap-premium-2026-04-30.md`](docs/roadmap-premium-2026-04-30.md) | Roadmap em 4 fases de polish (~19-28h) |

---

## Roadmap

### v0.1 (atual)
Tudo da seção "Funcionalidades atuais".

### v0.2
- SQLite cifrado at-rest (op-sqlite + SQLCipher ou eject pro bare workflow)
- Multi-device sync E2E criptografado (transport iCloud/Drive)
- Caregiver mode (Luiz vê leitura read-only via convite tokenizado)
- Apple Health / Health Connect sync (read-only inicial)
- Lembrete adaptativo (detecta horário real ≠ agendado e sugere ajuste)
- Tap no ponto do gráfico → tooltip com valor/hora/contexto
- Streak / consistência diária
- Skip lembrete hoje (long-press na lista)

### v0.3
- Dark mode pareado
- Acessibilidade completa (VoiceOver / TalkBack labels)
- Onboarding com ilustrações SVG sutis
- Widget Android home screen "Medir agora"

### Beyond MVP — fora de escopo até nova decisão
- **Bolus calculator** — só após avaliação ANVISA (classe II)
- **CGM integration** (Libre, Dexcom)
- **Banco CHO + meal log**
- **SUS Conecte** (importar exames, receita digital)
- **Compartilhamento online com endo** via link temporário

---

## Comandos úteis

| Tarefa | Comando |
|---|---|
| Dev server | `npx expo start --dev-client --port 8082` |
| Reset Metro cache | `npx expo start --clear` |
| TS check | `npx tsc --noEmit` |
| Tests | `npx jest` |
| Regenerate icons | `node scripts/generate-icons.mjs` |
| Cancel scheduled push (debug) | (no app, em desenvolvimento manual) |
| EAS build dev | `eas build --platform android --profile development` |
| EAS build prod-like | `eas build --platform android --profile preview` |
| Ver build status | `eas build:view <id>` |
| Cancel build | `eas build:cancel <id>` |

---

## Convenções de commit

- `chore:` — config, deps, infra
- `feat:` — feature nova
- `fix:` — correção de bug
- `refactor:` — mudança que não altera comportamento
- `docs:` — documentação
- `test:` — testes
- `style:` — formatação, lint

Author identity: `luizhcrs <luizhcrs@gmail.com>`. Sem trailer Co-Authored-By Claude.

---

## Limitações conhecidas

- **DB não está cifrado at-rest.** Spec exige; deferido pra v0.2 por causa de SQLCipher exigir bare workflow ou op-sqlite. Mitigação atual: sandbox iOS/Android FBE/FDE + backup `.json` cifrado + app lock por PIN.
- **`react-native-quick-crypto` é módulo nativo.** Não funciona em Expo Go — só APK custom (dev-client ou preview).
- **Sem dark mode.** v0.3.
- **Acessibilidade WCAG parcial.** Contraste passa, touch targets passam, mas falta `accessibilityLabel` consistente em ícones-only.
- **Lembrete adaptativo ainda não implementado** — hoje é só silenciar. v0.2.

---

## Testando em device

1. Garante que celular e PC estão na mesma rede WiFi
2. Pega IP local do PC (`ipconfig` no Windows): `192.168.0.x`
3. Inicia Metro com hostname certo (ver "Dev" acima)
4. Instala APK dev-client (link do EAS build)
5. Abre `glico` no celular → "Enter URL manually" → cola URL
6. Live reload de JS funciona infinito até mudar dep native

Se freezar: shake phone → "Reload". Se persistir: force-close + reabrir. Se persistir: restart Metro com `--clear`.

---

## Persona alvo

Adulto, diabetes tipo 1, caneta MDI, mede glicemia 4-6x/dia. Não-tech. Usa insulinas comuns no Brasil (Basaglar lenta, Fiasp rápida — quick-pick disponível na tela de insulina). Toda decisão de UX é pra esse perfil. Sem nerdices, sem dashboard hospitalar, sem gamificação infantil.
