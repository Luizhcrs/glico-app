# Glico — Referências UX 2025-2026

**Data:** 2026-04-30
**Scope:** benchmarks externos de apps de saúde, wellness, chronic care e hábito para informar decisões de design do Glico MVP
**Complementa:** `docs/ux-audit-2026-04-30.md` (audit do código atual) e `docs/roadmap-premium-2026-04-30.md`
**Cenário:** single-user, T1 diabetes, caneta MDI, identidade Sage Calm (#5a7a5a / #f5f3ed), React Native + Expo + TypeScript, 4-6 medições/dia, usuário não-tech

---

## 1. Oura Ring App (iOS / Android) — Hero card com três anéis de progresso

**Padrão específico:** dashboard home com três rings circulares (Sleep / Readiness / Activity) em fundo escuro/neutro. Cada ring é um arco colorido de 0-100 com valor numérico centralizado em tipografia display. Hierarquia visual imediata: o número mais importante ocupa ~40% da tela. Em 2025, a Oura redesenhou o app para usar "color to signal your body's different states according to your biometrics" — verde = bom, amarelo = atenção, vermelho = alerta — sem texto, só cor.

**Por que funciona no Glico:** o valor de glicemia é exatamente o tipo de número que precisa de hierarquia visual imediata. Uma ring de TIR semanal (time in range) no hero card do Glico — preenchida em verde sálvia proporcional ao percentual — comunicaria progresso sem que a usuária precisasse interpretar gráfico. Oura prova que usuários não-tech de saúde consomem scores circulares intuitivamente.

**Esforço em RN:** médio. Ring pode ser implementada com `react-native-skia` (Path + arc) ou `react-native-svg` (SVG circle com strokeDashoffset). Lib recomendada: `@shopify/react-native-skia` (já instalada no projeto). Tempo estimado: 3-4h.

**Links:**
- https://ouraring.com/blog/new-oura-app-experience/
- https://ouraring.com/blog/new-app-design/
- https://www.behance.net/gallery/243126265/Oura-Health-Tracking-App-UX-UI-Dashboard-Design
- https://mobbin.com/explore/screens/83fc856e-fcf7-412a-8427-fab55e97ec3a

---

## 2. mySugr (iOS / Android) — Log de glicemia com 2 toques e feedback gamificado

**Padrão específico:** entrada de dados por keypad numérico customizado (sem teclado nativo do OS) com botão de confirmar grande e contextual. Tags de refeição pré-selecionadas. O "monster" na home recebe pontos visivelmente após cada log — feedback positivo imediato pós-entrada. Lista diária em cards cronológicos com valor numérico em destaque e tag colorida lateral.

**Por que funciona no Glico:** a lógica de 2 toques (abrir → digitar → confirmar) já está no spec do Glico. O que mySugr faz melhor é o feedback pós-save: a usuária vê imediatamente que o dado foi registrado com confirmação visual clara. No contexto de uso 4-6x/dia, cada save precisa ter fechamento emocional — sem isso o app parece "buraco negro" onde dados somem.

**Esforço em RN:** baixo. Keypad customizado já existe no projeto. O feedback pós-save é um `burnt` toast com 300ms de delay + `Haptics.notificationAsync('success')`. Tempo estimado: 1-2h.

**Links:**
- https://www.mysugr.com/en/diabetes-app
- https://www.healthline.com/diabetesmine/mysugr-app-review-taming-diabetes-monster
- https://gamificationnation.com/en/blog/gamification-stuff-love-mysugr/

---

## 3. Streaks (iOS) — Streak counter e empty state como motivação

**Padrão específico:** Apple Design Award winner. Tela principal mostra cada hábito como um círculo preenchido: vazio = não feito hoje, colorido = feito. Streak counter (dias consecutivos) aparece como número badge abaixo do círculo. Empty state é o próprio círculo cinza — não tem copy de "você não fez nada", tem apenas o convite visual de preencher. A celebração ao completar o dia é mínima: o círculo "sela" com micro-bounce e a cor satura.

**Por que funciona no Glico:** T1 diabetes requer hábito diário compulsório. A lógica do Streaks de "círculo vazio = incompleto" traduz perfeitamente para "dia sem medições registradas". No Glico, um indicador de streak de dias com ≥ 3 medições na tela de perfil criaria motivação intrínseca sem gamificação explodida. A celebração sutil (bounce) é certa para uma usuária adulta — sem confetti excessivo que infantilizaria.

**Esforço em RN:** baixo. Streak counter é lógica de SQL simples. Animação de "seal" é `Animated.spring`. Tempo estimado: 2-3h.

**Links:**
- https://streaksapp.com/
- https://apps.apple.com/us/app/streaks/id963034692

---

## 4. Bearable (iOS / Android) — Log rápido com bottom sheet modular

**Padrão específico:** app de symptom tracking para doenças crônicas. O fluxo de log é via bottom sheet que sobe do rodapé: usuário toca em qualquer categoria e o sheet expande mostrando uma escala visual ou chips de múltipla seleção. Confirma com botão verde no bottom do sheet. A lista diária é uma timeline vertical com hora + categoria + valor, agrupada por "manhã / tarde / noite". Filosofia declarada: "make symptom tracking simple even for people suffering from fatigue and brain fog".

**Por que funciona no Glico:** a separação entre "tap no item" (gesto de abertura) e "bottom sheet" (entrada de dados) elimina o salto de tela. Para hipo especificamente, isso seria ideal: toca no botão Hipo no home, sheet sobe com sintomas, sem mudar de tela completamente. A agrupação manhã/tarde/noite da lista diária é exatamente o que o Glico spec já define.

**Esforço em RN:** médio. Bottom sheet em RN usa `@gorhom/bottom-sheet` (5.x, Reanimated 3-compatible). Tempo estimado: 4-6h para portar log e hipo para bottom sheets.

**Links:**
- https://bearable.app/
- https://bearable.app/chronic-illness-symptom-tracker-app/

---

## 5. Apple Health (iOS) — Semantic color sem virar dashboard hospitalar

**Padrão específico:** iOS 18 usa escala semântica de cores com três camadas: (a) a cor de fundo do card permanece neutra, (b) o ícone da métrica recebe a cor da categoria, (c) o valor numérico fica em cinza escuro neutro. Alerta de valor fora do range aparece como pill colorida abaixo do número — não muda o número em si.

A padronização de cores para glicemia segue o AGP (Ambulatory Glucose Profile): verde para "em alvo", âmbar para "alto", vermelho para "muito alto" ou "hipo".

**Por que funciona no Glico:** Sage Calm (#5a7a5a) é a própria cor "em alvo" da paleta AGP. O risco é usar vermelho demais. O padrão Apple Health de "cor no ícone/pill, não no número" permite o Glico manter o número grande em verde sálvia (positivo) e só usar vermelho no pill de status, sem tingir a tela inteira de vermelho exceto na tela específica de hipo.

**Esforço em RN:** baixo. É decisão de tokens no `theme.ts`. Tempo estimado: 0.5h de tokens + 1h de aplicação.

**Links:**
- https://developer.apple.com/design/human-interface-guidelines/healthkit/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8875060/
- https://octet.design/colors/user-interfaces/healthtech-ui-design/

---

## 6. Sleep Cycle — Tipografia de valor principal com escala display

**Padrão específico:** número da qualidade do sono ocupa 60-70% da largura do card hero em tipografia display weight 700, com cor que corresponde ao score (verde = bom, amarelo = mediano, laranja = ruim). O número usa proporcional com `fontVariant: ['tabular-nums']` para evitar saltos de layout. Abaixo: subtítulo em weight 400 tamanho 14-16pt descrevendo contexto. Não há ícone no hero — o número É o ícone.

**Por que funciona no Glico:** "118 mg/dL" precisa ser o herói visual da home. Plus Jakarta Sans 700 em ~72-80pt com `letterSpacing: -1.5` e `fontVariant: ['tabular-nums']` cria presença visual imediata. A cor do número refletindo o status é o único feedback necessário.

**Esforço em RN:** baixo. Mudança em `BigNumber.tsx`. Tempo estimado: 0.5-1h.

---

## 7. Tidepool / Dexcom Clarity — Chart de linha com target zone e scrub interativo

**Padrão específico:** Tidepool Mobile mostra dados de glicemia como linha colorida sobre banda de alvo (zona verde entre 70-180 mg/dL). Pontos abaixo ficam vermelhos, acima ficam laranjas. O chart é interativo: toque arrasta um cursor vertical (scrub) que exibe tooltip com "118 mg/dL — 14:32 — pós-almoço".

**Por que funciona no Glico:** o chart do Glico já tem a banda de alvo mas sem interatividade de scrub. `useChartPressState` do victory-native v41 fornece exatamente o hook necessário.

**Esforço em RN:** médio-alto. Total: 3-4h.

**Links:**
- https://www.tidepool.org/viewing-your-data
- https://github.com/FormidableLabs/victory-native-xl

---

## 8. Clue — Calendar view como contribution graph

**Padrão específico:** Clue usa visão de calendário onde cada dia é um dot colorido: sem dado = cinza vazio, dado registrado = cor da categoria. É o equivalente do "GitHub contribution graph" para saúde: o usuário vê de relance quais dias registrou.

**Por que funciona no Glico:** uma visão de calendário de 30 dias onde cada dia é um quadrado colorido por nível de glicemia média seria uma "radiografia" imediata do mês.

**Esforço em RN:** médio. Implementação custom: grid de 30-31 quadrados em `FlatList` numColumns={7}. Tempo estimado: 3-4h.

---

## 9. Headspace / Calm — Onboarding em 3-5 telas com progress dots

**Padrão específico:** progress indicator de dots no topo, ilustração grande centralizada, título 24-28pt, subtítulo 16pt, botão CTA full-width. Botão "Pular" pequeno no canto superior direito.

**Por que funciona no Glico:** o onboarding atual já segue esse esqueleto. Falta progress dots, botão "Pular" visível, transição animada.

**Esforço em RN:** baixo. ~1h.

---

## 10. Things 3 / Linear — Swipe-to-delete com ação contextual colorida

**Padrão específico:** swipe esquerdo em item de lista revela painel vermelho com ícone de lixeira. O swipe completo (>70%) executa com haptic `impactOccurred('medium')` e o item sai com animação de altura colapsando. Após delete: snackbar "Medição excluída" com botão "Desfazer" por 5 segundos.

**Por que funciona no Glico:** T1 diabetes mede 4-6x/dia e vai inevitavelmente errar um valor. Sem swipe-to-delete, frustração garantida.

**Esforço em RN:** médio. `react-native-gesture-handler` + `Swipeable`. Tempo estimado: 2-3h.

---

## 11. Welltory — Today screen com agrupamento modular por contexto

**Padrão específico:** "Today Screen" é uma scrollview vertical de cards modulares, cada um auto-suficiente. A altura dos cards varia por importância do dia.

**Por que funciona no Glico:** a separação da lista de medições em grupos "Manhã / Tarde / Noite / Madrugada" como cards seccionados — em vez de lista flat — daria uma visão de padrão diário imediata.

**Esforço em RN:** baixo a médio. `SectionList` com section headers. Tempo estimado: 1.5-2h.

**Links:**
- https://welltory.com/
- https://help.welltory.com/en/articles/8907642-today-screen

---

## 12. Reanimated 3 + Skia — Padrão de motion elegante vs exagerado (2025)

**Elegante:**
- Spring com `stiffness: 180-220, damping: 20-26`
- `withTiming` 200-300ms com `Easing.out(Easing.cubic)`
- Haptic `selectionChanged` em chips e steppers
- Crossfade ao trocar período no chart

**Exagerado (não fazer):**
- Spring com `damping < 12`
- Lottie em cada transição
- Confetti em toda medição (só em milestones)
- Animação decorativa sem finalidade

---

## Top 5 padrões para implementar primeiro no Glico

Ordenados por **impacto perceptível por usuária não-tech**:

**1. Número colorido por status (Sleep Cycle + Apple Health)** — ~1h. Impacto altíssimo.

**2. Feedback pós-save com haptic (mySugr pattern)** — ~1.5h. Cada log tem fechamento emocional.

**3. Swipe-to-delete com undo (Things 3 pattern)** — ~2.5h. App parece confiável.

**4. Progress dots no onboarding (Headspace pattern)** — ~1h. Primeira impressão "boas-vindas com intenção".

**5. SectionList com agrupamento manhã/tarde/noite (Welltory / Bearable)** — ~1.5h. Visão de padrão diário.

**Total Top 5: ~7.5h** — leva o app de "MVP polido" para "premium real".

---

## Libs RN recomendadas por padrão

| Padrão | Lib | Status |
|--------|-----|--------|
| Ring de progresso (TIR) | `@shopify/react-native-skia` | já instalada |
| Swipe-to-delete | `react-native-gesture-handler` | já instalada |
| Bottom sheet | `@gorhom/bottom-sheet` ^5 | não instalada |
| Toast custom | (já temos próprio) | OK |
| Haptics | `expo-haptics` | já instalada |

---

## Notas sobre o que NÃO roubar

- **Dexcom Clarity mobile:** UX fraca. Evitar transposição de relatório PDF para mobile.
- **mySugr monster:** roubar log rápido + feedback pós-save, NÃO o mascote (condescendente para adulta).
- **Confetti em toda medição:** dilui significado. Confetti = primeiro log + cada 30 dias de streak, e só.
