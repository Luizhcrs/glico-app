# Política de segurança

## Reportando uma vulnerabilidade

Glico processa dados pessoais sensíveis de saúde (glicemia, doses de insulina, episódios de hipoglicemia). Falhas de segurança são tratadas com prioridade.

**Não abra issue público.** Reporte por e-mail privado:

- **Contato:** luizhcrs@gmail.com
- **Assunto:** `[SECURITY] glico-app: <descrição curta>`
- **Tempo de resposta esperado:** 72h úteis

## Escopo

- Vazamento ou exposição de dados de saúde (medições, doses, hipos)
- Bypass do app lock por PIN
- Quebra de criptografia do backup `.json`
- Injection (SQL, eval) via campos de input
- Acesso indevido ao banco SQLite local
- Vazamento de chave de criptografia armazenada no Keychain/Keystore

## Fora do escopo

- Vulnerabilidades em deps de terceiros (reportar upstream)
- Engenharia social
- Acesso físico ao dispositivo desbloqueado
- Análise de tráfego de rede (Glico não faz tráfego de rede de dados sensíveis)

## Modelo de ameaça assumido

- **Adversário:** roubo do dispositivo com tela bloqueada → mitigação: criptografia do sistema (FBE/FDE) + app lock opcional por PIN
- **Adversário:** acesso ao backup `.json` → mitigação: AES-256-GCM com chave derivada PBKDF2-SHA256 (600k iter, salt aleatório 16 bytes)
- **Adversário:** acesso à chave do banco no Keychain → mitigação: `WHEN_UNLOCKED` accessibility flag, escopo do app sandbox
- **Adversário:** análise estática do APK → mitigação: nenhum segredo embutido no app, todos os dados são gerados localmente

## Limitações conhecidas (v0.1)

- **DB SQLite não está cifrado at-rest.** Migração para `op-sqlite` + SQLCipher planejada para v0.2. Mitigação atual: app sandbox + FBE/FDE do device + opcional app lock por PIN.
- **PIN reset é destrutivo por design.** Esquecer o PIN exige reinstalação do app, perdendo todos os dados locais. Backup `.json` cifrado é responsabilidade do usuário.
- **Backup compartilhado por canais externos** (Drive, e-mail, WhatsApp) ainda é cifrado, mas a senha derivada é responsabilidade do usuário.

## Não somos um dispositivo médico

Glico não é regulado como dispositivo médico pela ANVISA. Não calcula doses, não diagnostica, não trata. É uma ferramenta de auto-monitoramento de uso pessoal. Falhas de software podem causar inconveniência (perda de dados) mas não representam risco clínico direto.
