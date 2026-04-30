# Glico — Design System

> Identidade visual, tokens e regras de aplicação.
> Versão 0.1 · 2026-04-30

---

## 1. Voz e personalidade

Glico é um app de monitoramento clínico **íntimo** — usado 4 a 6 vezes ao dia por uma única pessoa, frequentemente em momentos de fragilidade (jejum, antes de dormir, durante hipoglicemia). A identidade existe pra reduzir ansiedade, não amplificar.

**Palavras-âncora:** sereno, doméstico, confiável, leve, atemporal.

**Anti-âncoras:** clínico-frio, alarmante, infantil, "fitness app", gamificado, festivo.

**Como isso vira UI:**

- Cores terrosas e dessaturadas, nunca neon nem alta saturação
- Tipografia humanista geométrica, peso baixo nos números grandes
- Cantos arredondados generosos
- Microinterações sutis (opacidade no press, sem bounce/spring decorativo)
- Sem emojis, sem confetti, sem celebração performática
- Notificações: tom de assistente, não de alarme ("Hora de medir antes do almoço", não "ATENÇÃO!")
- Erros: descritivos sem culpar ("Valor incomum, confirma?" não "Valor inválido!")

---

## 2. Logotipo

### Marca primária

Quadrado arredondado verde sálvia (gradient sutil de #6b8c6b para #4f6e4f), com:

- "g" minúsculo em peso 200, branco-bege #f5f3ed, alinhado à baseline
- Drop accent (gota arredondada) bege #f5f3ed no canto superior direito — referência visual sutil ao caráter clínico do app sem virar ícone-de-hospital

**Raio:** 232 / 1024 ≈ 22.6% (segue Apple Squircle / iOS adaptive)
**Drop:** 76px diâmetro, posição (720, 240), opacity 92%
**Letterspacing do "g":** -30 (compactado)

### Versões disponíveis

| Arquivo | Tamanho | Uso |
|---|---|---|
| `assets/icon.png` | 1024×1024 | iOS app icon, store listing |
| `assets/adaptive-icon.png` | 1024×1024 | Android foreground (mascarado contra fundo sage) |
| `assets/favicon.png` | 48×48 | Web/PWA |
| `assets/splash-icon.png` | 1024×1024 | Splash screen |
| `assets/branding/icon.svg` | vector | fonte editável da marca primária |
| `assets/branding/adaptive-foreground.svg` | vector | foreground Android (sem bg) |
| `assets/branding/splash.svg` | vector | splash 1242×2436 com label "Glico" |

### Regras de uso

- **NÃO** mude a cor do "g" pra sage (perde contraste)
- **NÃO** use a marca sobre fundos saturados ou imagens — sempre superfície sólida bege ou branca
- **NÃO** rotacione, espelhe nem distorça
- **NÃO** adicione efeitos (sombra externa colorida, glow, outline)
- Margem livre mínima ao redor do ícone: 12% do lado (≈ 122px em 1024px)
- Ícone monocromático (sem drop accent) só em pequenos tamanhos onde o drop sumiria — usar fallback `g` puro

### Regenerar PNGs a partir dos SVGs

```bash
node scripts/generate-icons.mjs
```

(Requer `sharp` em devDependencies.)

---

## 3. Paleta — Sage Calm

### Cores base

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#f5f3ed` | Fundo de tela (bege quente) |
| `surface` | `#ffffff` | Cards, listas, inputs |
| `cardBg` | `#e8e4d8` | Fundo secundário (chips inativos, segmented control) |
| `border` | `#d8d4c8` | Bordas hairline, divisores |
| `text` | `#2d3a2d` | Texto primário (verde quase preto) |
| `textMuted` | `#6b7a6b` | Legendas, labels, sub-rows |

### Cores de marca

| Token | Hex | Uso |
|---|---|---|
| `accent` | `#5a7a5a` | Verde sálvia primário — botões, CTAs, ícones de marca, status "ok" |
| `accentMuted` | `#8aa68a` | Track de Switch ativo, hover estados |

### Cores semânticas (status clínico)

Cor é informação aqui. Não use por estética.

| Token | Hex | Significado |
|---|---|---|
| `ok` | `#5a7a5a` | Glicemia em alvo |
| `warn` | `#b08a3a` | Hiperglicemia, atenção não-emergência |
| `danger` | `#b22222` | Hipoglicemia, ação destrutiva |
| `pillOk` / `pillOkText` | `#d4e4d4` / `#2d5a2d` | Badge "no alvo" |
| `pillLow` / `pillLowText` | `#f5d8d8` / `#8c1c1c` | Badge "hipoglicemia" |
| `pillHigh` / `pillHighText` | `#f7ead2` / `#7a5a10` | Badge "hiperglicemia" |

### Regras de cor

- **Verde sálvia (accent) só em ações e identidade.** Não use pra indicar status.
- **Vermelho-tijolo (danger) só pra hipo e destruição.** Não use pra erros de validação genérica (use toast warning).
- **Âmbar (warn) só pra hiperglicemia e avisos.** Reset, exclusão = vermelho.
- Nada de gradientes em superfícies — gradient só dentro do logo. Apps de saúde modernos rejeitam gradient flashy.
- Dark mode: planejado pra v0.3 (pareada cor-a-cor).

---

## 4. Tipografia — Plus Jakarta Sans

Sans-serif geométrica humanista, gratuita, ótimo desempenho em corpo e display.

### Pesos carregados

| Peso | Token | Uso |
|---|---|---|
| 200 ExtraLight | `theme.fonts.extralight` | BigNumber (valor de glicemia gigante) |
| 300 Light | `theme.fonts.light` | (reservado) |
| 400 Regular | `theme.fonts.regular` | Corpo de texto, parágrafos, hints |
| 500 Medium | `theme.fonts.medium` | Inputs, labels secundárias, valores |
| 600 SemiBold | `theme.fonts.semibold` | Botões, títulos de header, destaques |
| 700 Bold | `theme.fonts.bold` | Títulos de tela, seções |

### Tamanhos (`theme.fontSizes`)

| Token | Valor | Uso |
|---|---|---|
| `xs` | 11 | Labels uppercase, legendas |
| `sm` | 13 | Texto secundário, hints |
| `md` | 15 | Texto principal, botões |
| `lg` | 18 | Títulos de seção, header |
| `xl` | 24 | Títulos grandes, números de stats |
| `hero` | 56 | BigNumber (glicemia, dose) |

### Regras tipográficas

- **Números clínicos sempre em `tabular-nums`** (`fontVariant: ['tabular-nums']`) — alinhamento vertical entre 78, 142, 256
- **Letterspacing negativo** apenas em pesos extralight/light (BigNumber: -1.5; títulos 28px: -0.5)
- **Letterspacing positivo** apenas em labels uppercase (xs: 0.6 a 0.8)
- **Line-height** mínimo: 18 (xs), 20 (sm), 22 (md), 34 (28px títulos)
- Texto em `lowercase` em status pills e labels secundárias ajuda o tom íntimo
- **Nunca** use `fontWeight: '700'` cru — sempre passa por `theme.fonts.bold` pra Plus Jakarta carregar

---

## 5. Espaçamento, raio, sombra

### `theme.spacing`

```
xs  4
sm  8
md  12
lg  16
xl  24
xxl 32
```

Default de seções: gap `lg`. Margem entre títulos uppercase e conteúdo: `sm`. Padding interno de cards: `md` ou `lg`.

### `theme.radii`

```
sm   8
md   12
lg   16
pill 999
```

- Cards e inputs: `md`
- Cards principais (hero, modal): `lg`
- Botões CTA, chips, status pills: `pill`
- Avatares: half do diâmetro (sempre circular)

### Sombras

Apenas **uma** intensidade — sutil, branca-suja:

```ts
shadowColor: '#000',
shadowOpacity: 0.04 a 0.08,
shadowRadius: 6 a 12,
shadowOffset: { width: 0, height: 4 },
elevation: 1 a 2 (Android),
```

Exceção: botão accent recebe sombra colorida sutil (`shadowColor: theme.colors.accent, opacity: 0.25`).

**Nunca** use sombra dura (offset > 4, opacity > 0.18). Nunca sombra dupla.

---

## 6. Ícones — Lucide

Pacote: `lucide-react-native`

### Regras

- **stroke-width: 2** (default) — 2.2 pra header back, 2.4 pra ícones em chips/buttons (ganha presença)
- **size**: 12-14 (inline em pills), 16-18 (rows, list items), 20-26 (header, action button)
- **color** sempre via theme — nunca hardcoded hex
- Ícones de **status clínico** (TrendingUp, ArrowDown, AlertTriangle): cor semântica
- Ícones de **navegação/ação** (ChevronLeft, ChevronRight, Plus, Camera): `theme.colors.accent` ou `textMuted`
- Não misturar Lucide com Material Icons / Ionicons

### Inventário atual

| Lucide | Onde |
|---|---|
| `ChevronLeft` | header back (Screen) |
| `ChevronRight` | rows de lista, link "Ver tendência" |
| `Plus` / `Minus` | stepper de unidades, action button medir |
| `AlertOctagon` | botão Hipo |
| `AlertTriangle` | confirm dialogs, zona de risco |
| `Syringe` | insulina |
| `Camera` | edit avatar badge |
| `Target`, `Bell`, `Lock`, `Info` | rows do perfil |
| `Trash2` | excluir, reset |
| `Save`, `Check`, `X`, `Delete` | actions de sheet, toggle, keypad |
| `Undo2` | desfazer exclusão |
| `TrendingUp` / `TrendingDown` / `Minus` | TrendArrow |
| `ArrowUp` / `ArrowDown` | StatusPill |
| `AlertCircle` | toast de erro |

---

## 7. Componentes — princípios

### Cards (surface)
- Fundo `surface` (#fff) sobre `bg` (#f5f3ed)
- Padding interno: `lg` (24px) ou `md` (12px)
- Radius `lg` (16px) ou `md` (12px) dependendo do tamanho
- Sombra sutil unica
- Listas em cards usam divider `hairline` na cor `border`

### Botões
- Primary: `pill` radius, accent bg, branco fg, sombra colorida
- Ghost: `pill` radius, cardBg, text fg, sem sombra
- Danger: `pill` radius, danger bg, branco fg
- Min-height **52px** (target de toque acessível)
- Press feedback: opacidade 0.85, sem scale animado

### Pills / Chips
- Radius `pill` (999)
- Padding 12 horizontal × 8 vertical
- Border de 1px quando inativo, sem border quando selecionado
- Selecionado: bg `accent`, texto branco, sombra accent sutil

### Modais e Bottom Sheets
- Overlay `rgba(45,58,45,0.55)` (verde escuro translúcido)
- Card `surface` com radius 20
- Bottom sheet com handle bar (40×4 cardBg) no topo
- Animation: linear timing 180ms (overlay) + ease-out 240ms (sheet) — nunca spring exagerado

### Inputs
- Bg `surface`, border `border` 1px, radius `md`
- Padding `md` (12)
- Font `medium` size `md`
- Placeholder em `textMuted`

### Toasts
- Slide do topo, opacity 0→1 + translateY -16→0
- 180-220ms de duração
- Card surface + sombra média
- Ícone colorido em círculo accent (success), danger, warn, accentMuted (info)
- Auto-dismiss 2.8s, tap pra fechar

---

## 8. Motion

### Princípios
- **Curtas** — 150-280ms, raras vezes 350ms
- **Ease-out** ou linear timing — sem spring com damping baixo
- **Funcionais** — feedback de press, transição entre telas, surgimento de elementos. Nunca decorativas.
- Apple-like (Linear, iOS Health) > Android-y (Material Splash, Foundation)

### Permitido
- Press: opacity 0.85 (instantâneo)
- Modal/sheet: timing 180-240ms ease-out
- Toast: timing 180ms fade + translateY
- Slide_from_right entre telas (default Stack)

### Proibido
- Confetti, balões, animação de check em V
- BigNumber count-up (foi removido — distrai)
- Spring com bounce em entrada de cards
- Stagger em listas (mata percepção de "tela carregada", parece performático)
- Lottie animado (cancela peso visual)

---

## 9. Tom textual

### Voz
- 1ª pessoa do singular (paciente fala consigo) ou imperativo gentil ("Mede de novo")
- PT-BR informal, sem nerdices nem termos técnicos sozinhos
- Termos clínicos sempre acompanhados de sinônimo lay: "Lenta (basal)", "Rápida (bolus)"
- Avoid: "Você", "Por favor", "Atenção!", "Erro:", emoji

### Microcopy patterns

| Situação | Copy |
|---|---|
| Empty state | "Nenhuma medição registrada ainda" + "Toque em Medir pra começar" |
| Confirmação destrutiva | "Resetar tudo?" + lista do que apaga |
| Outlier | "Tem certeza desse valor? X mg/dL é incomum" |
| Toast sucesso | "Medição salva: 142 mg/dL" |
| Toast erro | "Valor inválido: deve estar entre 20 e 600" |
| Greeting | "Bom dia, Erica" / "Boa tarde, Erica" / "Boa noite, Erica" |
| Tendência relativa | "há 2 horas" (date-fns ptBR formatDistanceToNow) |
| Hint clínico | "Lembrete em 15 min pra remedir" |
| Privacy nota | "Seus dados nunca saem do seu celular." |

---

## 10. Acessibilidade

- Contraste mínimo 4.5:1 em corpo, 3:1 em texto grande (WCAG AA) — paleta atual passa
- Touch targets ≥ 44×44 (botões 52, chips com padding generoso)
- Tabular-nums em valores clínicos (zero confusão entre 142 e 1.42)
- `accessibilityLabel` em ícones-only (TODO ainda não aplicado consistente)
- Suporte a Dynamic Type / textScale: parcialmente — line-heights fixos podem cortar em scale 130%+

---

## 11. App config / nativo

`app.json`:

```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#f5f3ed"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#5a7a5a"
    }
  }
}
```

Mudou o ícone? Precisa **rebuild EAS** (não pega via Metro). Roda:

```bash
eas build --platform android --profile development
```

---

## 12. Roadmap visual

### v0.2 (próximo)
- App icon refinado em Figma (substituir o gerado por Sharp por versão "polida")
- Splash screen com animação de fade-in da marca
- Apple Watch / Wear OS complications (?)
- Onboarding com ilustrações SVG sutis

### v0.3
- Dark mode pareado (sálvia escuro, marrom escuro, neutros mais frios)
- Localized brand para inglês (futuro store-ready)
- Acessibilidade completa: VoiceOver / TalkBack labels

### Beyond
- Sistema de design publicado como package interno (se app crescer)
- Marca registrada INPI (se for monetizar)
