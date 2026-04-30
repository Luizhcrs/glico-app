# Contribuindo

Repositório privado, uso pessoal. Estas diretrizes existem pra manter consistência ao longo do tempo (e ajudar agentes de IA assistindo o desenvolvimento).

## Setup

Ver [README.md](./README.md#setup).

## Workflow de mudança

1. **Branch** por mudança. `master` continua em produção (= o que está no celular da usuária final).
2. **Commit** com Conventional Commits:
   - `feat:` feature nova
   - `fix:` bug fix
   - `chore:` config, deps, infra, build
   - `docs:` documentação
   - `refactor:` mudança que não altera comportamento
   - `test:` testes
   - `style:` formatação, lint
3. **Author identity:** sempre `luizhcrs <luizhcrs@gmail.com>`. Sem trailer Co-Authored-By Claude.
4. **PR opcional** (single dev): merge direto em master se mudança é contida e tests passam. PR só pra mudanças grandes que mereçam revisão posterior.

## Antes de cada commit

```bash
npx tsc --noEmit
npx jest
```

Lint não está configurado ainda — fica pra v0.2.

## Antes de cada push para `master`

- TS clean
- Jest verde (44+ testes)
- Mudança em deps native (`app.json`, plugins, native modules) → considerar rebuild EAS

## Antes de cada release (tag `v0.x.0`)

1. Atualizar `CHANGELOG.md`
2. Bumpar `version` em `package.json` e `app.json`
3. `git tag v0.x.0 && git push origin v0.x.0`
4. Disparar EAS build profile `preview` (APK standalone)
5. Instalar APK no celular da usuária final

## Padrões de código

### TypeScript
- `strict: true` (já configurado)
- Sem `any` — use `unknown` + type narrowing
- Tipos importam: `import type { ... }`
- Domain types em `src/domain/types.ts`

### Estrutura de arquivos
- Telas em `app/` (expo-router file-based)
- Lógica de domínio (DB, validators, repos) em `src/domain/`
- UI components em `src/ui/components/`
- Hooks em `src/ui/hooks/`
- Não misturar regras de UI com regras de domínio

### Estilo visual
- **Sempre** usa `theme.ts` — nada de hex hardcoded
- **Sempre** usa `theme.fonts.X` — nada de `fontWeight` cru
- Sage Calm: ver [`docs/design-system.md`](./docs/design-system.md)
- Cor semântica: verde sálvia = ação/identidade; vermelho = hipo/destrutivo; âmbar = hiper/aviso

### Testes
- Domain logic (validators, stats, smart reminders): unit em `tests/unit/`
- Repos: integration em `tests/integration/` com `better-sqlite3` adapter
- E2E: YAML Maestro em `tests/e2e/`
- Não testar UI pixel-perfect (snapshot frágil)

### Notificações
- Ao salvar medição → chamar `silenceCoveredReminders(ts)` antes do toast
- Notificações com `data.deepLink: 'glico://...'` são roteadas via deep-link handler em `_layout.tsx`

### Crypto
- Chaves em `expo-secure-store` com `WHEN_UNLOCKED`
- Backup user-facing: AES-256-GCM + PBKDF2-SHA256 (600k iter, salt 16 bytes)
- Nunca embutir chaves em `app.json`, env vars, ou source

## Princípios de UX

Da [`docs/design-system.md`](./docs/design-system.md):

- Sereno e funcional
- Funcional > decorativo
- Lay terms > jargão clínico isolado
- Cor é informação, não enfeite
- Confetti só em milestones reais (≥30 dias de streak)

## Princípios regulatórios

- **Sem cálculo de dose de insulina.** Bolus calc = dispositivo médico classe II ANVISA. Glico apenas registra, nunca sugere dose.
- **Avisos clínicos sutis sim.** "Considere medir mais cedo no dia" é aceitável. "Aplique 3u" não é.
- Sempre incluir disclaimer "Não substitui orientação médica" em telas que mostram dados clínicos para terceiros (ex: PDF do relatório).

## Contato

- Email: luizhcrs@gmail.com
- Issues de segurança: ver [SECURITY.md](./SECURITY.md)
