# Product Language — Ironcore

Guia curto da linguagem oficial do produto.

## Princípios

- Falar como sistema operacional de execução, não como painel técnico solto.
- Preferir clareza operacional a jargão interno.
- O produto deve responder: o que está acontecendo, o que importa e o que fazer agora.

## Termos oficiais

### Estrutura do produto
- `Cockpit` → página principal / centro de comando
- `Sala de guerra` → página principal do projeto
- `Fluxo do projeto` → trilha macro de execução
- `Carteira de projetos` → listagem principal de projetos

### Estados operacionais
- `Liberado`
- `Atenção`
- `Bloqueado`

Evitar variantes despadronizadas na UI principal como:
- `ok`
- `warning` (mostrar só internamente/técnico quando necessário)
- `bad`
- `gatingStatus` cru para o usuário

### Ações principais
Preferir:
- `Abrir próxima ação`
- `Rodar rotina`
- `Rodar conciliação`
- `Registrar validação`
- `Fechar mês`
- `Gerar diagnóstico`
- `Gerar DRE / DFC`

Evitar:
- `run`
- `execute`
- `submit`
- `trigger`
- `apply`

### Áreas
- `Hoje`
- `Operação`
- `Financeiro`
- `Implantação`
- `Governança`

### Conceitos sensíveis
- `Gating` pode existir como conceito interno, mas na UI principal deve aparecer preferencialmente como:
  - `Status decisório`
- `Motor` é aceitável como metáfora em contexto executivo, mas não deve poluir toda tela

## Padrão de subtítulo
Cada tela deve explicar:
1. o que ela controla
2. por que isso importa
3. o que o usuário faz dali

## Padrão de empty state
Sempre dizer:
- o que não existe ainda
- por que isso importa
- qual é a próxima ação

Exemplo:
- ruim: `Sem dados.`
- bom: `Ainda não há projetos visíveis para montar o cockpit. Crie ou habilite um projeto para começar a operação.`

## Regra prática
Se um termo não ajuda o usuário a decidir ou agir, ele deve sair da camada principal do produto.
