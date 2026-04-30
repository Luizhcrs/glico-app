# Changelog

Todas as mudanças notáveis deste projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### Adicionado
- Foto de perfil via galeria (`expo-image-picker`)
- Identidade visual completa Sage Calm: ícone, splash, adaptive Android, favicon
- `BrandLogo` reutilizável em welcome + about
- ConfirmDialog Sage Calm (substitui `Alert.alert` em outliers de medição)
- Toast com botão de ação (slot pra Desfazer)
- Swipe-to-delete na lista de hoje com 5s de undo
- SectionList por janela do dia (Manhã / Tarde / Noite / Madrugada)
- Progress dots (`StepDots`) no onboarding
- TrendArrow (delta vs medição anterior) no home
- Stats card de insulina no perfil (média U/dia em 7 dias, última marca)
- Quick-pick de marcas de insulina (Basaglar, Lantus, Tresiba; Fiasp, NovoRapid, Humalog)
- Pré-população automática de marca pela última usada por tipo
- Reset total de perfil (zona de risco em Sobre & privacidade)
- Lembretes inteligentes:
  - `silenceCoveredReminders(measuredAt)` cancela ocorrência diária se medição ocorre na janela
  - `installSmartReminderHandler()` suprime push em foreground se já mediu na janela
- PDF do relatório refeito (Sage Calm, contexto traduzido, episódios de hipo, buckets de horário)
- Haptic `notificationAsync('Success')` em log + insulin save; `'Warning'` no hypo

### Melhorado
- Fontes Plus Jakarta Sans (200/300/400/500/600/700) carregadas via `expo-font`
- Ícones Lucide substituem caracteres unicode (header back, profile chevrons, keypad)
- Insulina UX: termos lay primeiro ("Lenta (basal)", "Rápida (bolus)") + hint contextual
- Profile rows agrupadas em surface cards com ícones contextuais (Target, Bell, Lock, Info)
- Targets/Reminders/Lock/About com Screen wrapper (header + safe area corretos)
- BigNumber colorido por status (verde alvo, âmbar hiper, vermelho hipo) com tabular-nums
- Gestos: `gestureEnabled: true` + `fullScreenGestureEnabled: true` no Stack
- MeasurementSheet close instantâneo (sem 200ms de espera)

### Corrigido
- Loop infinito "Maximum update depth exceeded" em `_layout.tsx`, `index.tsx`, `trend.tsx`
- Onboarding bugado pós-reset (Screen com `scroll={false}` agora aplica `flex: 1`)
- Bundle errors de native peers (`react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-font`, `react-native-nitro-modules`)
- Compatibilidade `expo-dev-client` ~6.0.21 com SDK 54 (era ^55, quebrava Kotlin compile)
- Cache gradle corrompido após process kill (workaround documentado)

## [0.1.0] — 2026-04-29

### Lançado
- MVP inicial: registro de medição em ≤2 toques
- Registro de insulina basal/bolus
- Registro de episódios de hipoglicemia
- Lembretes diários (sem inteligência ainda)
- Tendência: gráfico victory-native + TIR + média + buckets
- Relatório PDF inicial
- Backup `.json` AES-256-GCM (PBKDF2-SHA256, 600k iter)
- App lock por PIN (Keychain/Keystore via expo-secure-store)
- Onboarding 4 passos (welcome → name → targets → reminders)
- Stack: Expo SDK 54, expo-router, TypeScript, expo-sqlite, victory-native v41

### Notas técnicas
- Projeto greenfield iniciado em 2026-04-29
- 34 tasks executadas via subagent-driven-development em 7 fases
- 44 testes unit/integration verdes
- Tag `v0.1.0` aplicada após smoke + tsc clean
