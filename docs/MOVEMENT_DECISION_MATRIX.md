# Movement Decision Matrix

Fonte única da decisão operacional diária do IronCore.

## Objetivo

Transformar a decisão de movimento em uma regra explícita, previsível e auditável.

A rotina diária deve sempre cair em um destes estados:

- `liberado`
- `atencao`
- `bloqueado`

## Fonte de verdade

Implementação central:
- `src/lib/movement-decision.ts`

Uso principal:
- `src/lib/routine.ts`

## Matriz de decisão

### 1. BLOQUEADO

Cai em `bloqueado` quando existir qualquer condição crítica:

- alerta bloqueante ativo
- rotina diária com status `blocked`
- conciliação com status `blocked`
- pendências de conciliação acima do limite alto
- carteira vencida acima do limite alto
- recompra relevante acima do limite alto

### 2. ATENCAO

Cai em `atencao` quando não houver bloqueio, mas existir algum ponto relevante de revisão:

- rotina ou conciliação em `warning`
- pendências residuais de conciliação
- operações pendentes de aprovação/formalização
- carteira vencida não crítica
- recompra presente, mas não crítica

### 3. LIBERADO

Cai em `liberado` apenas quando:

- não existe bloqueio crítico
- não existem razões de atenção ativas

Sinais típicos de liberação:

- conciliação zerada
- sem pendência de aprovação
- sem carteira vencida
- sem recompra relevante

## Efeito esperado no workflow

### Quando `bloqueado`

- `painel_risco` → `bloqueado`
- `movimento_diario` → `bloqueado`
- `validacao_movimento` → `bloqueado`
- aprovação humana direta deve ser recusada

### Quando `atencao`

- `painel_risco` → `concluido`
- `movimento_diario` → `aguardando_validacao`
- `validacao_movimento` → `aguardando_validacao`

### Quando `liberado`

- `painel_risco` → `concluido`
- `movimento_diario` → `aguardando_validacao`
- `validacao_movimento` → `aguardando_validacao`

## Limites atuais

Os thresholds atuais estão centralizados no código da decisão:

- pendências altas de conciliação: `> 5`
- carteira vencida alta: `> 100000`
- recompra alta: `> 50000`

## Próximo passo natural

Se essa matriz estabilizar, o passo seguinte é externalizar os thresholds para configuração por projeto.
