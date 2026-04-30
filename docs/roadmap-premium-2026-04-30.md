# Glico — Roadmap Premium

**Data:** 2026-04-30
**Base:** `docs/ux-audit-2026-04-30.md`
**Premissa:** subir percepção de "MVP funcional" para "produto premium" sem reescrever arquitetura, sem voltar nas animações decorativas que o usuário rejeitou.

Total estimado das fases 1-4: **~30h**.
Fase 5 (beyond MVP) referencia spec roadmap pós-MVP, sem estimativa firme.

---

## Visão geral

| Fase | Tema | Horas | Cobertura no audit |
|------|------|------:|--------------------|
| 1 | Quick wins | 3-4h | T1, I1, I6, N1, M1, M2, AI5, C7, D4 |
| 2 | Visual lift | 6-8h | F1-F4, S5-S6, HE1-HE3, H1-H4, C4 |
| 3 | Microinterações úteis | 4-6h | M3, M4, M5, M7, FU1, FU2, S6 |
| 4 | Polish e branding | 6-10h | AI1-AI3, O1-O2, C5 (dark mode opt), TC1-TC3 |
| 5 | Beyond MVP | — | spec §8 roadmap pós-MVP |

**Ordem rígida**: cada fase depende da anterior (especialmente Fase 1 — fontes e ícones — que é fundação visual de todas as seguintes).

---

## Fase 1 — Quick wins (~3-4h)

**Objetivo:** trocar o que dá maior salto perceptivo com menor esforço. Esta fase sozinha já move o app de "MVP" para "polido".

### Deliverables

1. **Tipografia custom** (Plus Jakarta Sans via `expo-font`).
2. **Iconografia real** (lucide-react-native substituindo todos texto-glyphs).
3. **Haptics consistentes** em ações de salvar.
4. **Splash bg color** no `app.json`.
5. **Padding horizontal das telas** subir para 20.

### Libs a instalar

```bash
npx expo install expo-font @expo-google-fonts/plus-jakarta-sans
npm install lucide-react-native
# expo-haptics já instalado
```

### Mudanças de arquivo

- `app/_layout.tsx`
  - Importar `useFonts` de `@expo-google-fonts/plus-jakarta-sans`.
  - Bloquear render até fontes carregarem (manter splash visível).
- `src/ui/theme.ts`
  - Adicionar `fontFamily: { sans: 'PlusJakartaSans_400Regular', sansMedium: 'PlusJakartaSans_500Medium', sansBold: 'PlusJakartaSans_700Bold' }`.
  - Tokens de letterSpacing canônicos: `tight: -0.5, normal: 0, wide: 0.6`.
- `src/ui/components/BigNumber.tsx`
  - `fontFamily: theme.fontFamily.sans` + `fontWeight: '300'` (era 200, fica fininho demais em Android).
- `src/ui/components/{ActionButton,StatusPill,ContextChips,Keypad}.tsx`
  - Aplicar `fontFamily` em todos `Text`.
- `src/ui/components/Screen.tsx`
  - Substituir `<Text style={styles.backTxt}>‹</Text>` por `<ChevronLeft size={24} color={theme.colors.text} strokeWidth={2}/>` de lucide-react-native.
  - Right action vira `<User size={20}/>` ou similar quando label = "Perfil".
  - Padding horizontal `theme.spacing.lg` → 20.
- `app/index.tsx`
  - Substituir `›` em linkRow por `<ChevronRight/>`.
  - Substituir "+" em ActionButton labels por composição com ícones (`<Plus/>` lateral).
- `app/insulin.tsx`
  - Substituir `−/+` no stepper por `<Minus/>` `<Plus/>`.
- `app/profile/index.tsx`
  - Substituir `›` por `<ChevronRight size={16} color={theme.colors.textMuted}/>`.
- `src/ui/components/Keypad.tsx`
  - `⌫` → `<Delete size={24}/>` ou `<X/>`; `✓` → `<Check size={24}/>`.
  - Adicionar `Haptics.selectionAsync()` em cada press de tecla.
- `app/log.tsx`, `app/insulin.tsx`, `app/hypo.tsx`
  - `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` em submit bem-sucedido (antes do `router.replace`).
- `app.json`
  - Adicionar `"splash": { "backgroundColor": "#f5f3ed" }`.

### Critério de aceitação visual

- [ ] Tipografia: o número grande no hero tem peso e personalidade — não parece system default.
- [ ] Ícones: nenhum caractere unicode hack (`‹`, `›`, `+`, `−`, `⌫`, `✓`) restou nas UIs principais.
- [ ] Salvar uma medição vibra sutilmente o device (Success haptic).
- [ ] Splash não é mais branco — vem com bg bege Sage Calm.
- [ ] Comparação lado a lado mostra salto óbvio.

### Arquivos modificados (Fase 1)

```
app.json
app/_layout.tsx
app/index.tsx
app/log.tsx
app/insulin.tsx
app/hypo.tsx
app/profile/index.tsx
src/ui/theme.ts
src/ui/components/Screen.tsx
src/ui/components/BigNumber.tsx
src/ui/components/ActionButton.tsx
src/ui/components/StatusPill.tsx
src/ui/components/ContextChips.tsx
src/ui/components/Keypad.tsx
```

---

## Fase 2 — Visual lift (~6-8h)

**Objetivo:** elevar hierarquia visual e substituir os 4 pontos onde o app exibe `Alert` nativo (quebra identidade) por toast custom Sage Calm.

### Deliverables

1. **Toast system** substituindo todos `Alert.alert` de erro/sucesso/confirmação.
2. **Hero card com TIR ring** (Skia + Reanimated).
3. **Lista do dia com coluna de status colorida** (faixa lateral 4px verde/amarelo/vermelho).
4. **Empty states com ícone** (Lucide grande monoline).
5. **Profile com cards agrupados** (visual grouping iOS Settings).
6. **Hero card pinta o número de verde** quando glicemia está no alvo (reforço positivo C4).

### Libs a instalar

```bash
npm install burnt
# alternativa rolar próprio com react-native-reanimated (já instalado) + Skia (já instalado)
```

### Mudanças de arquivo

- `src/ui/components/Toast.tsx` (**novo**)
  - Wrapper de `burnt` com tokens Sage Calm (variants `success`, `error`, `warning`, `info`).
  - API: `toast.success('Medição salva')`, `toast.error('Valor inválido', 'Use 20-600 mg/dL')`.
- `src/ui/components/ConfirmDialog.tsx` (**novo**)
  - Bottom sheet customizado com Reanimated. Substitui o `Alert.alert('Tem certeza?')` em log.tsx.
  - Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `variant: 'danger'|'warning'|'default'`.
- `app/log.tsx`
  - Substituir `Alert.alert('Valor inválido', valid.reason)` por `toast.error(...)`.
  - Substituir `Alert.alert('Tem certeza desse valor?', ...)` por `<ConfirmDialog>` controlado.
  - Após save: `toast.success('Medição salva')` antes de `router.replace`.
- `app/hypo.tsx`, `app/insulin.tsx`
  - Mesmo padrão, substituir todos `Alert.alert`.
- `app/onboarding/name.tsx`, `app/profile/targets.tsx`, `app/profile/lock.tsx`, `app/_layout.tsx`
  - Mesmo padrão.
- `src/ui/components/HeroCard.tsx` (**novo**, extrair de `app/index.tsx:55-74`)
  - Container com `borderRadius: 24` (novo `radii.xl`), padding generoso.
  - Ring de TIR usando Skia: arco 240° (top), strokeWidth 6, accent verde, com label "TIR 7d" + porcentagem central pequena abaixo do número grande.
  - Badge "última medição" como pill verde claro com ícone Clock + tempo relativo.
  - Quando latest existe e está no alvo: `BigNumber color={theme.colors.accent}`.
- `src/ui/components/MeasurementRow.tsx` (**novo**, extrair de `app/index.tsx:104-114`)
  - Faixa lateral colorida 4px (verde/amarelo/vermelho) por status.
  - Time + context + value alinhados com tipografia hierárquica.
- `app/index.tsx`
  - Usar `<HeroCard>` e `<MeasurementRow>`.
  - Empty state com `<DropletOff size={48} color={theme.colors.textMuted}/>` + texto + CTA visual.
- `app/profile/index.tsx`
  - Agrupar Rows em "cards" com `borderRadius: theme.radii.md`, marginBottom entre seções, header sticky.
- `src/ui/theme.ts`
  - Adicionar `radii.xl: 24`, semantic colors `success`, `warning`, `error`, `info` (já têm bases ok/warn/danger).
  - Surface `#fff` → `#fbf9f4` (warm off-white).

### Critério de aceitação visual

- [ ] Nenhum `Alert.alert` aparece mais para erros/confirmações de fluxo (busca grep retorna zero matches em `app/`).
- [ ] Salvar medição mostra toast verde sutil "Medição salva" no topo, autosumindo em 2s.
- [ ] Hero card tem ring TIR visível ao redor/embaixo do número.
- [ ] Quando glicemia está no alvo, número grande fica verde sálvia (não preto).
- [ ] Lista do dia mostra status com cor lateral, escaneável em 1 segundo.
- [ ] Profile parece iOS Settings (cards agrupados), não wall of rows.

### Arquivos modificados (Fase 2)

```
app/index.tsx
app/log.tsx
app/hypo.tsx
app/insulin.tsx
app/_layout.tsx
app/onboarding/name.tsx
app/profile/index.tsx
app/profile/targets.tsx
app/profile/lock.tsx
src/ui/theme.ts
src/ui/components/Toast.tsx          (novo)
src/ui/components/ConfirmDialog.tsx   (novo)
src/ui/components/HeroCard.tsx        (novo)
src/ui/components/MeasurementRow.tsx  (novo)
```

---

## Fase 3 — Microinterações úteis (~4-6h)

**Objetivo:** adicionar APENAS interações funcionais (não decorativas). Cada item resolve fricção real.

### Deliverables

1. **Swipe-to-delete na lista do dia** com soft delete + undo toast 5s (cumpre spec §4).
2. **Tap na lista do dia abre detalhe / edição** (modal sheet).
3. **Press feedback escala** (`scale(0.97)`) no `ActionButton` substituindo opacity.
4. **Cross-fade do trend chart** ao trocar 7/30/90d (parsing visual mais suave).
5. **Stack animation contextual**: `/log`, `/hypo`, `/insulin` com `presentation: 'modal'` (slide-up), profile/trend mantém slide_from_right.
6. **Pulse leve no hero quando >2h sem medição** (apenas se Luiz aprovar; default off).

### Libs a instalar

```bash
npm install react-native-gesture-handler  # já instalado
npm install react-native-reanimated        # já instalado
# adicional:
npm install react-native-swipeable-list-view
# OU usar Reanimated + Gesture Handler direto (mais flexível, sem dep extra)
```

Recomendação: rolar swipe próprio com `Gesture.Pan` + Reanimated — total controle, zero deps extras.

### Mudanças de arquivo

- `src/ui/components/SwipeableRow.tsx` (**novo**)
  - Wrapper com `GestureDetector` + `Animated.View`.
  - Reveal direito de 80px com botão "Apagar" (vermelho `theme.colors.danger` + ícone `<Trash2/>`).
  - Threshold 60px para confirmar; abaixo disso volta ao zero.
  - Haptic medium em reveal completo.
- `app/index.tsx`
  - Wrapping de cada `<MeasurementRow>` com `<SwipeableRow onDelete={() => deleteMeasurement(m.id)}/>`.
  - Após delete: `toast.info('Medição apagada', { action: { label: 'Desfazer', onPress: () => undoDelete(m.id) }, duration: 5000 })`.
- `src/domain/measurement.ts`
  - Adicionar `softDelete(id)` (set `deleted_at = Date.now()`) e `restore(id)` (set `deleted_at = null`). Verificar se já existem (spec menciona deleted_at) — se não, implementar.
- `app/measurement/[id].tsx` (**novo**)
  - Detalhe + edição. Acessível por tap em `<MeasurementRow>`.
  - `presentation: 'modal'` no expo-router stack.
  - Mesmo Keypad/ContextChips para editar valor + contexto.
  - Botão "Apagar" no rodapé (com ConfirmDialog).
- `src/ui/components/ActionButton.tsx`
  - `style={({ pressed }) => [styles.btn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}`.
  - Pode usar `Animated.View` + Reanimated `withTiming` para suavidade — sem ser visual decorativo, é feedback tátil.
- `src/ui/components/TrendChart.tsx` + `app/trend.tsx`
  - Wrap CartesianChart em `<Animated.View>` com `useAnimatedStyle` que aplica `opacity` durante refetch.
  - Ou usar `Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}` re-key quando rangeKey muda.
- `app/_layout.tsx`
  - Stack screenOptions ainda `slide_from_right`, mas adicionar configuração específica:
    - Em `app/log.tsx`, `app/hypo.tsx`, `app/insulin.tsx`: usar `<Stack.Screen options={{ presentation: 'modal', animation: 'slide_from_bottom' }}/>` ou configurar via expo-router file convention.

### Critério de aceitação visual

- [ ] Swipe à esquerda numa medição revela botão Apagar; soltar com swipe completo apaga + mostra toast com Undo.
- [ ] Tap numa medição abre tela de edição em modal (slide-up).
- [ ] Botões "afundam" sutilmente ao toque (scale, não opacity).
- [ ] Trocar 7d/30d/90d em trend faz o gráfico fazer cross-fade leve (180ms).
- [ ] Telas de log/hipo/insulin chegam de baixo (modal); profile/trend continuam vindo da direita.

### Arquivos modificados (Fase 3)

```
app/_layout.tsx
app/index.tsx
app/log.tsx                              (header layout p/ modal)
app/hypo.tsx
app/insulin.tsx
app/trend.tsx
app/measurement/[id].tsx                 (novo)
src/domain/measurement.ts                (verificar/adicionar softDelete)
src/ui/components/ActionButton.tsx
src/ui/components/SwipeableRow.tsx       (novo)
src/ui/components/TrendChart.tsx
```

---

## Fase 4 — Polish e branding (~6-10h)

**Objetivo:** fechar última camada visual com identidade dedicada.

### Deliverables

1. **App icon custom Sage Calm** (gota d'água sálvia + monogram "G").
2. **Splash custom** com mesma identidade.
3. **Adaptive icon Android** + favicon.
4. **Onboarding com progress bar** no topo (substitui texto "Passo 1 de 3").
5. **Welcome com ilustração SVG sutil** (gota animação leve).
6. **Trend chart com touch interactions** (tap no ponto mostra tooltip valor + horário).
7. **Trend chart com banda alvo correta** (TC3 do audit, fix funcional).
8. **Trend chart com pontos coloridos por status** (TC4).
9. **Dark mode opcional** (Sage Calm dark variant; toggle em Profile).

### Libs a instalar

```bash
npm install react-native-svg              # já instalado
npx expo install expo-system-ui           # para dark mode bg
# opcional para Lottie sutil em welcome (descartar se Luiz preferir SVG estático):
# npx expo install lottie-react-native
```

### Assets a criar

- `assets/icon.png` (1024x1024, 1:1, sem rounded corners — iOS aplica)
  - Conceito: gota d'água verde sálvia (#5a7a5a) sobre bg bege (#f5f3ed) com offset/shadow sutil ou monogram "G" em weight bold dentro da gota
- `assets/adaptive-icon.png` (1024x1024 com safezone interna 432px)
- `assets/splash-icon.png` (~400x400, transparent bg, expandido pelo Expo splash plugin)
- `assets/favicon.png` (32x32 ou 48x48)
- `assets/onboarding-drop.svg` (**novo**, ilustração welcome)

### Mudanças de arquivo

- `app.json`
  - `splash.image`, `splash.backgroundColor`, `splash.resizeMode: 'contain'`.
  - `userInterfaceStyle: 'automatic'` (era `light` hardcoded).
- `src/ui/theme.ts`
  - Adicionar `themeDark` com mesma estrutura mas tokens dark:
    - `bg: '#1a1f1a'`, `surface: '#242a24'`, `cardBg: '#2d342d'`, `text: '#e8e4d8'`, `textMuted: '#9ba89b'`, `accent: '#7a9a7a'` (sálvia mais clara para contraste em dark), `border: '#3a423a'`.
  - Exportar `useTheme()` hook que lê `useColorScheme()` (do React Native) e retorna `colors` certos.
- Todos componentes em `src/ui/components/*` e telas em `app/*`
  - Substituir `theme.colors.X` por `useTheme().colors.X`. (Refactor mecânico, ~1h.)
- `app/profile/index.tsx`
  - Adicionar Row "Aparência" com link para nova tela `/profile/appearance` que tem 3 opções: Auto / Light / Dark.
- `app/onboarding/_layout.tsx` ou `Screen.tsx`
  - Componente `<OnboardingProgress current={1} total={3}/>` no topo (3 dots com fill animado, ou bar fina).
- `app/onboarding/welcome.tsx`
  - Substituir `<View style={styles.brandDot}/>` por `<DropletSvg/>` (componente SVG novo) com peso visual maior.
- `src/ui/components/TrendChart.tsx`
  - `chartPressState` do `useChartPressState` (victory-native v41 API).
  - Tooltip com `<Tooltip>` ou render manual via Reanimated quando `state.isActive`.
  - Fix banda alvo: `<Area points={points.bandHigh} y0={... y de bandLow ...}/>` — atualmente está usando `chartBounds.bottom` (errado).
  - Adicionar `<Scatter>` (ou Skia Circle por ponto) com cor por status.
  - Eixos: usar `axisOptions={{ tickCount: 4, formatXLabel: (v) => format(v, 'dd/MM'), formatYLabel: (v) => `${v}` }}`.
- `assets/onboarding-drop.svg` + `src/ui/components/DropletSvg.tsx`
  - Importar como `react-native-svg` ou via [`react-native-svg-transformer`](https://github.com/kristerkari/react-native-svg-transformer).

### Critério de aceitação visual

- [ ] Ícone do app na home da fone NÃO é o splash Expo padrão.
- [ ] Splash carrega no bg Sage Calm com brand mark ao centro.
- [ ] Onboarding tem progress dots/bar no topo (não só texto "Passo 1 de 3").
- [ ] Welcome tem ilustração SVG visível, não círculo verde sólido.
- [ ] Tap num ponto do trend chart mostra tooltip "153 mg/dL · 12:30".
- [ ] Banda alvo do chart é faixa horizontal entre 70 e 180 (não rampa do bottom).
- [ ] Pontos da linha de glicemia são coloridos verde/amarelo/vermelho conforme status.
- [ ] Toggle dark mode em Profile inverte cores do app sem bug; ativação automática segue sistema.

### Arquivos modificados (Fase 4)

```
app.json
assets/icon.png                          (substituir)
assets/adaptive-icon.png                 (substituir)
assets/splash-icon.png                   (substituir)
assets/favicon.png                       (substituir)
assets/onboarding-drop.svg               (novo)
app/_layout.tsx                          (theme provider)
app/onboarding/welcome.tsx
app/onboarding/_layout.tsx               (ou Screen.tsx para progress bar)
app/onboarding/name.tsx
app/onboarding/targets.tsx
app/onboarding/reminders.tsx
app/profile/index.tsx                    (link aparência)
app/profile/appearance.tsx               (novo)
src/ui/theme.ts                          (themeDark + useTheme)
src/ui/components/TrendChart.tsx
src/ui/components/DropletSvg.tsx         (novo)
+ todos componentes que usam theme.colors (refactor para useTheme)
```

---

## Fase 5 — Beyond MVP (referencia spec roadmap pós-MVP)

Ordem provável conforme spec §8, com nota sobre quando faz sentido após premium polish:

| # | Item | Quando faz sentido | Esforço estimado | Nota |
|---|------|-------------------|------------------|------|
| 1 | **Apple Health / Google Fit (read-only sync)** | após 30+ dias de uso real consolidado | 1-2 semanas | prepara terreno para CGM, low risk regulatório |
| 2 | **Multi-device sync E2E** | quando usuária expressar dor de "quero ver no iPad" | 2-3 semanas | modelo Signal: keys derivadas de senha master, transport via iCloud Drive ou similar |
| 3 | **Caregiver mode** | só se Luiz quiser ver leitura read-only | 2 semanas | convite tokenizado, link expirável, dados criptografados E2E |
| 4 | **Bolus calculator** | **só após avaliação ANVISA** (classe II potencial) | 1-2 meses + regulatório | risco regulatório alto; consultar advogado de saúde antes |
| 5 | **CGM integration (Libre / Dexcom)** | depende de SDK público + autorização Abbott/Dexcom | ~1 mês por device | Libre 2/3 tem reverse-eng community; Dexcom Share API requer aprovação |
| 6 | **Banco CHO + meal log** | se usuária fizer contagem de carbo manualmente | 1-2 semanas | TACO public domain; UX de busca rápida é desafio |
| 7 | **SUS Conecte** | parqueado no spec — sem dor real | indefinido | nice-to-have apenas |
| 8 | **Compartilhamento online com endo** | depende de fase 2/3 acima | 1 semana | pode ser PDF assinado + link expirável |
| **Bônus** | **EAS Update (OTA)** | **fazer logo no fim da Fase 4** | 1h | já existe `eas.json`; configurar `expo-updates` + canal `production`; permite hotfix sem App Store review |

### EAS Update (OTA) — recomendação para fechar Fase 4

Setup mínimo para destravar correção rápida de bug pós-launch:

```bash
npx expo install expo-updates
eas update:configure
```

- Adicionar `runtimeVersion` em `app.json`.
- Canais `production` e `preview` em `eas.json`.
- Comando de update: `eas update --branch production --message "fix bug X"`.

Isso desbloqueia iteração ágil (correção de copy, tweak visual, fix de bug não-nativo) sem novo build TestFlight/Play.

---

## Acumulado de horas

| Fase | Horas mínimas | Horas máximas | Acumulado min | Acumulado max |
|------|--------------:|--------------:|--------------:|--------------:|
| 1 | 3 | 4 | 3 | 4 |
| 2 | 6 | 8 | 9 | 12 |
| 3 | 4 | 6 | 13 | 18 |
| 4 | 6 | 10 | 19 | 28 |
| EAS Update | 1 | 1 | 20 | 29 |
| 5 (Beyond MVP) | — | — | — | — |

**Fases 1-4: 19-28h.** Spread em 4 sprints de 1 semana cada (~5-7h/semana solo dev).

---

## O que NÃO está no roadmap (e por quê)

- **Animações decorativas** (glow no hero, ondas no chart, transition exuberante entre telas) — usuário rejeitou explicitamente. Tudo neste roadmap é funcional/táctil/feedback de save.
- **Tab bar inferior** (N3 do audit) — decisão de produto. Vale discutir com Luiz. Hoje stack push funciona; tab bar é convenção mas adiciona complexidade.
- **Wheel picker para insulin units** (D8) — stepper funciona; trocar é estética sem ganho objetivo.
- **Acessibilidade WCAG completa** (A1-A4) — spec parquéu para fase 2. Apenas itens A2 (contraste) ficam dentro do roadmap como ajuste no theme.
- **Gamificação / streaks visíveis** — não foi pedido. Profile pode ganhar stat de streak de medição (FU4) mas sem badges.
- **Testes E2E Maestro de UI nova** — referenciados na spec §7; rodar após Fase 4 estabilizar.

---

## Próxima ação imediata

**Começar Fase 1 agora.** São 3-4h de trabalho mecânico com salto perceptivo desproporcional. Após Fase 1, decidir com Luiz se Fase 2 vai inteira ou em pedaços.
