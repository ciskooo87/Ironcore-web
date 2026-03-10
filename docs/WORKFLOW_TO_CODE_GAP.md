# IronCore — Gap entre fluxo operacional e código atual

## Contexto

Este documento traduz o fluxo operacional proposto na planilha do IronCore para uma leitura de engenharia do repositório `ironcore-web`.

Objetivo:
- identificar o que já existe no código
- identificar o que está parcial
- identificar o que ainda falta
- orientar a próxima sequência de implementação

---

## Resumo executivo

O `ironcore-web` já possui uma espinha dorsal funcional com:
- autenticação
- RBAC / permissões
- gestão multi-projeto
- entradas diárias
- upload inicial simplificado
- conciliação simplificada
- operações financeiras básicas
- fechamento mensal versionado
- dashboard e auditoria de uso

Porém, o fluxo operacional desenhado na planilha ainda não está implementado ponta a ponta. Hoje o produto cobre partes da operação, mas ainda não traduz integralmente a jornada de:
- implementação/onboarding
- risco assistido por IA
- análise histórica completa
- painel de risco FIDC
- movimento diário com motor decisório
- validação operacional formal
- fechamento mensal completo com relatórios integrados

---

## Mapeamento por fase

## 1. Implementação

### 1.1 Cadastro
**Fluxo esperado**
- cadastro da empresa
- preenchimento dos dados obrigatórios
- classificação de fornecedores no plano de contas
- bloqueio da conclusão até cadastro completo

**Cobertura atual**
- existe criação de projeto
- existem campos de empresa
- existe `account_plan`
- existe `supplier_classes`
- existe `financial_profile`

**Gap**
- não existe jornada guiada de onboarding
- não existe checklist/status de conclusão
- não existe trava formal impedindo avanço com cadastro incompleto

**Prioridade**: alta

---

### 1.2 Riscos
**Fluxo esperado**
- relato do projeto
- prompt para IA
- análise do relato
- identificação de riscos
- validação dos riscos no sistema
- riscos atribuídos ao projeto

**Cobertura atual**
- existem estruturas de `project_risks`
- existem estruturas de `project_alerts`
- existe avaliação básica de alertas
- há indício de integração IA no projeto

**Gap**
- falta tela de relato do projeto
- falta geração de riscos por IA
- falta revisão/aprovação dos riscos
- falta distinção entre risco sugerido, aprovado e ativo

**Prioridade**: alta

---

### 1.3 Upload da base histórica
**Fluxo esperado**
- ingestão de faturamento
- contas a pagar
- contas a receber
- extratos
- estoques
- carteira de pedidos
- borderôs financeiros
- endividamento

**Cobertura atual**
- existe parser de upload para CSV/XLSX/PDF
- há leitura simplificada de:
  - faturamento
  - contas a receber
  - contas a pagar
  - extrato bancário
  - duplicatas

**Gap**
- não há pipeline histórico dedicado
- não há ingestão por categoria histórica completa
- não há mapeamento de colunas configurável
- não há validação de template/arquivo por origem
- não há suporte evidente para estoques, carteira, borderôs, endividamento

**Prioridade**: alta

---

### 1.4 Análise da base histórica
**Fluxo esperado**
- normalização
- extração dos dados
- cruzamento com riscos
- criação de prompt
- análise IA
- alertas
- plano de ação
- relatório executivo / diagnóstico completo

**Cobertura atual**
- base parcial de alertas e estruturas financeiras
- indício de integração IA

**Gap**
- não existe pipeline de diagnóstico histórico ponta a ponta
- não existe plano de ação derivado
- não existe relatório executivo automatizado desta fase
- não existe apresentação final da análise histórica

**Prioridade**: alta

---

### 1.5 Validação do diagnóstico
**Fluxo esperado**
- apresentação em tela
- validação por usuários responsáveis
- criação da versão final

**Cobertura atual**
- existe no produto a ideia de versionamento em fechamento mensal

**Gap**
- não existe workflow explícito para validação do diagnóstico inicial
- não existe status formal: rascunho / validado / final

**Prioridade**: média-alta

---

## 2. Operação diária

### 2.1 Upload da base diária
**Fluxo esperado**
- envio diário das bases
- normalização
- validação
- conciliação bancária
- montagem do fluxo de caixa
- validação do usuário

**Cobertura atual**
- existem `daily_entries`
- existe inserção/listagem/edição
- existe parser de upload

**Gap**
- falta UX operacional mais robusta
- faltam múltiplos pipelines por origem/tipo de base
- falta workflow formal de validação
- falta status operacional de processamento

**Prioridade**: alta

---

### 2.2 Painel de risco
**Fluxo esperado**
- upload de retorno dos FIDCs
- normalização
- atualização da base
- segregação entre vencidos, a vencer, modalidade, recompras
- visualização consolidada em painel

**Cobertura atual**
- existem alertas e alguns KPIs

**Gap**
- não existe importador dedicado de retorno FIDC
- não existe segregação operacional dos recebíveis
- não existe painel de risco alinhado ao fluxo descrito

**Prioridade**: alta

---

### 2.3 Movimento diário
**Fluxo esperado**
- análise do dia
- projeção de caixa próximos 15 dias
- sugestão operacional conforme saldo
- análise de recebíveis disponíveis
- cruzamento com risco e limite
- reserva, efetivação e histórico

**Cobertura atual**
- existe base para operações financeiras
- existem tipos de operação
- há indícios de bibliotecas para fluxo de caixa

**Gap**
- não existe motor decisório completo
- não existe simulação operacional ponta a ponta
- não existe máquina de estados operacional completa
- não existe integração clara entre caixa, risco e elegibilidade de recebíveis

**Prioridade**: muito alta

---

### 2.4 Validação do movimento diário
**Fluxo esperado**
- resumo do dia
- operações realizadas
- caixa realizado
- envio do relatório aos envolvidos

**Cobertura atual**
- existem estruturas de auditoria, delivery e KPI

**Gap**
- falta workflow formal de fechamento diário
- falta geração padronizada do resumo operacional do dia
- falta trilha clara de aprovação/envio

**Prioridade**: média-alta

---

## 3. Fechamento

### 3.1 Alimentar DRE, DFC e apresentação mensal
**Fluxo esperado**
- após validação diária, consolidar dados para materiais mensais

**Cobertura atual**
- existe rota `/dre`
- existe estrutura de workbook
- existe `closure.ts`

**Gap**
- DFC ainda não está claramente integrada no fluxo
- apresentação mensal ainda não aparece como pipeline consolidado
- falta costura automática entre operação diária e fechamento mensal

**Prioridade**: média-alta

---

### 3.2 Fechamento mensal
**Fluxo esperado**
- geração dos materiais finais
- análise IA
- relatório consolidado mensal

**Cobertura atual**
- existe `monthly_closures`
- existe versionamento de snapshot

**Gap**
- ainda falta materialização completa dos relatórios do fechamento
- ainda falta costura com IA e saída final executiva

**Prioridade**: média

---

### 3.3 Validação do fechamento
**Fluxo esperado**
- revisão por consultor/head
- aprovação
- envio aos envolvidos

**Cobertura atual**
- base de governança parcial

**Gap**
- falta workflow completo de aprovação mensal
- faltam estados formais do fechamento

**Prioridade**: média

---

### 3.4 Monitoramento
**Fluxo esperado**
- envio de dados de uso ao dashboard da diretoria

**Cobertura atual**
- dashboard existe
- auditoria de uso existe
- admin/status existe

**Gap**
- observar se o monitoramento cobre os indicadores executivos desejados pela diretoria

**Prioridade**: média

---

## Gap transversal

Além dos módulos acima, existem gaps estruturais transversais:

### 1. Workflows/status
O sistema ainda precisa formalizar estados como:
- upload: pendente, processando, inválido, processado, validado
- risco: sugerido, revisado, aprovado, ativo, arquivado
- movimento: sugerido, reservado, efetivado, cancelado
- fechamento: rascunho, em validação, aprovado, enviado

### 2. Onboarding completo
A entrada do projeto ainda não está estruturada como uma jornada única.

### 3. Integração IA orientada ao negócio
Há sinais de integração, mas não há costura forte com:
- relato do projeto
- risco
- diagnóstico
- análise mensal

### 4. Mapeamento de dados por origem
A ingestão ainda precisa de um modelo mais explícito por tipo de arquivo/processo.

### 5. Trilha ponta a ponta
O produto ainda não materializa com clareza o fluxo completo:
- implementação → operação diária → fechamento → monitoramento

---

## Ordem recomendada de implementação

### Fase 1 — alinhamento do onboarding
1. wizard de cadastro do projeto
2. classificação de fornecedores
3. relato do projeto
4. checklist/status de implementação

### Fase 2 — risco e diagnóstico inicial
5. geração de riscos por IA
6. validação de riscos
7. upload histórico estruturado
8. diagnóstico inicial e plano de ação

### Fase 3 — operação diária real
9. upload diário robusto
10. conciliação operacional aprimorada
11. importação de retorno FIDC
12. painel de risco
13. movimento diário com motor decisório
14. validação diária e relatório operacional

### Fase 4 — fechamento executivo
15. consolidação DRE/DFC
16. apresentação mensal
17. validação mensal
18. monitoramento executivo final

---

## Conclusão

O repositório atual já possui base útil e reaproveitável. A construção do IronCore deve seguir em cima dessa base, mas com um esforço claro de alinhamento entre fluxo de negócio e implementação real.

A prioridade imediata não é reescrever tudo — é costurar o que já existe em uma jornada coerente e preencher os gaps de maior impacto operacional.
