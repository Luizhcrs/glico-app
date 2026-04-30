# Changelog

Todas as mudanças notáveis deste projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.1.0] — 2026-04-30 — Primeira versão estável

Primeira release pública. APK standalone Android distribuído via GitHub Releases.

### Funcional
- Registro de medição de glicemia em ≤2 toques (keypad customizado, contexto pré-selecionado)
- Registro de insulina basal/bolus com pré-população da última marca usada
- Quick-pick de marcas comuns no Brasil (Basaglar, Lantus, Tresiba, Toujeo, Levemir; Fiasp, NovoRapid, Humalog, Apidra)
- Registro de episódios de hipoglicemia com sintomas, tratamento e tempo de recuperação
- **Lembretes inteligentes**: silenciam automaticamente se houve medição na janela ±tolerância (foreground via `setNotificationHandler`, background via cancel + reagendar)
- Tendência: gráfico victory-native v41 + TIR (time in range) + média + DP + hipos + buckets manhã/tarde/noite/madrugada
- Relatório PDF Sage Calm (contexto traduzido, episódios de hipo, valores coloridos por status)
- Foto de perfil via galeria
- Backup `.json` AES-256-GCM (PBKDF2-SHA256, 600k iter, salt 16 bytes)
- App lock por PIN (Keychain iOS / Keystore Android via expo-secure-store)
- Reset total de perfil
- Swipe-to-delete na lista do dia com 5s de undo
- Edição de medição via bottom sheet
- Onboarding 4 passos com progress dots

### Visual
- Identidade Sage Calm completa: ícone, splash, adaptive Android, favicon
- Plus Jakarta Sans (200/300/400/500/600/700) via `expo-font`
- Ícones Lucide (zero unicode hack)
- BigNumber colorido por status (verde alvo, âmbar hiper, vermelho hipo) com tabular-nums
- TrendArrow (delta vs medição anterior)
- Status pills com ícones contextuais
- ConfirmDialog próprio (substitui `Alert.alert` nativo)
- Toast com botão de ação
- Haptic feedback em saves e ações destrutivas
- SectionList por janela do dia
- Animações sutis (apenas press feedback e modal slide)

### Stack
- Expo SDK 54, expo-router, TypeScript strict
- expo-sqlite (5 tabelas, migrations versionadas)
- react-native-quick-crypto (AES-256-GCM, PBKDF2)
- expo-notifications (smart silencer)
- victory-native v41 (Skia)
- @gorhom/bottom-sheet, react-native-gesture-handler, react-native-reanimated
- lucide-react-native, @expo-google-fonts/plus-jakarta-sans

### Privacidade
- Zero backend. Dados sensíveis nunca trafegam.
- Backup é cifrado, senha é responsabilidade do usuário.
- Sem analytics, sem crash reporting, sem telemetria.
- Sem tracking de qualquer tipo.

### Limitações conhecidas
- DB SQLite não cifrado at-rest (planejado v0.2 com `op-sqlite` + SQLCipher).
- Sem dark mode (planejado v0.3).
- Acessibilidade WCAG parcial (touch targets e contraste OK, faltam `accessibilityLabel` consistentes).

### Notas técnicas
- 44 testes unit/integration verdes
- TypeScript strict mode
- 34 tasks de implementação executadas via subagent-driven-development
- Distribuição: APK standalone Android (signed debug keystore, sideload)
- **Não publicado em loja** (Play Store / App Store) — uso pessoal
