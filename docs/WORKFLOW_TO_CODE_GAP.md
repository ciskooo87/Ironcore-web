# IronCore — Gap entre fluxo operacional e código atual

## Contexto

Este documento traduz o fluxo operacional proposto na planilha do IronCore para uma leitura de engenharia do repositório `ironcore-web`.

Objetivo:
- identificar o que já existe no código
- identificar o que está parcial
- identificar o que ainda falta
- orientar a próxima sequência de implementação

---

## Resumo executivo atualizado

O `ironcore-web` agora já cobre a maior parte da espinha dorsal operacional do fluxo, com implementação funcional de:
- onboarding com checklist e travas reais
- riscos/alertas com workflow
- uploads históricos e diários por categorias relevantes
- diagnóstico histórico e entregável executivo
- painel FIDC funcional
- operações, carteira, títulos e timeline de eventos
- movimento diário com decisão operacional
- validação formal do movimento diário
- alimentação contábil DRE/DFC
- fechamento mensal consolidado
- validação do fechamento
- monitoramento diretoria

Ou seja: a base do fluxo deixou de ser apenas conceito e já existe no produto.

O que ainda falta agora não é “começar o fluxo”, e sim aprofundar principalmente:
- parser/qualidade das bases por origem
- risco/diagnóstico com IA mais forte
- delivery formal para envolvidos
- governança transversal por tarefas/SLA
- acabamento executivo mais sofisticado

---

## Mapeamento por fase

## 1. Implementação

### 1.1 Cadastro
**Status atual**: implementado

**Já existe no código**
- cadastro do projeto
- dados obrigatórios
- classificação de fornecedores
- perfil financeiro
- checklist de onboarding
- trava real de avanço para módulos dependentes

**Gap restante**
- pode evoluir para wizard guiado mais sofisticado

**Prioridade atual**: baixa

---

### 1.2 Riscos
**Status atual**: parcial forte

**Já existe no código**
- riscos/alertas cadastráveis
- reflexo no workflow
- painel de risco ligado à operação/FIDC

**Gap restante**
- relato estruturado do projeto em formato consultivo
- risco sugerido por IA com workflow mais profundo
- distinção mais forte entre risco sugerido / aprovado / ativo

**Prioridade atual**: alta

---

### 1.3 Upload da base histórica
**Status atual**: implementado em versão funcional

**Já existe no código**
- upload por categorias históricas relevantes
- suporte operacional para:
  - faturamento
  - contas a pagar
  - contas a receber
  - extratos
  - estoques
  - carteira
  - borderôs
  - endividamento
- reflexo no workflow

**Gap restante**
- parser por layout/origem ainda pode evoluir muito
- validação de template/consistência ainda é simples

**Prioridade atual**: média-alta

---

### 1.4 Análise da base histórica
**Status atual**: implementado em versão funcional

**Já existe no código**
- agregação histórica
- diagnóstico histórico
- uso de IA com fallback
- relatório executivo do diagnóstico

**Gap restante**
- análise ainda pode ficar mais profunda por origem e regra de negócio
- plano de ação ainda pode ser mais sofisticado

**Prioridade atual**: média

---

### 1.5 Validação do diagnóstico
**Status atual**: parcial

**Já existe no código**
- etapa no workflow
- diagnóstico exibido e preparado para validação

**Gap restante**
- falta ainda um workflow formal de validação do diagnóstico histórico equivalente ao que já fizemos para movimento e fechamento

**Prioridade atual**: média-alta

---

## 2. Operação diária

### 2.1 Upload da base diária
**Status atual**: implementado em versão funcional

**Já existe no código**
- upload diário
- criação/edição de entradas
- pipeline de upload por tipo
- amarração com operação do projeto

**Gap restante**
- validação por layout e qualidade de processamento ainda pode melhorar

**Prioridade atual**: média

---

### 2.2 Painel de risco
**Status atual**: implementado em versão funcional

**Já existe no código**
- painel FIDC consolidado
- vencidos / a vencer / recompra / concentração
- ligação com operações e carteira

**Gap restante**
- parser real de layout FIDC
- indicadores mais profundos por fundo/cedente/sacado/modalidade

**Prioridade atual**: média-alta

---

### 2.3 Movimento diário
**Status atual**: implementado em versão funcional

**Já existe no código**
- decisão operacional diária
- integração com operações/carteira/FIDC
- gatilhos de bloqueio/liberação
- ações sugeridas e executáveis

**Gap restante**
- policy engine mais sofisticada por projeto
- regras parametrizáveis de decisão

**Prioridade atual**: média-alta

---

### 2.4 Validação do movimento diário
**Status atual**: implementado

**Já existe no código**
- validação humana formal
- histórico de validações
- resumo validado
- possibilidade de envio do resumo
- workflow real ligado à etapa

**Gap restante**
- delivery ainda pode ficar mais forte por canal/target/template

**Prioridade atual**: média

---

## 3. Fechamento

### 3.1 Alimentar DRE, DFC e apresentação mensal
**Status atual**: implementado em versão funcional

**Já existe no código**
- alimentação contábil consolidada
- feed DRE/DFC persistido
- histórico de alimentações

**Gap restante**
- apresentação mensal ainda pode ficar mais sofisticada em formato executivo/exportável

**Prioridade atual**: média

---

### 3.2 Fechamento mensal
**Status atual**: implementado

**Já existe no código**
- snapshot versionado
- narrativa executiva
- uso do accounting feed dentro do fechamento
- histórico de snapshots

**Gap restante**
- acabamento executivo mais premium ainda pode evoluir

**Prioridade atual**: baixa-média

---

### 3.3 Validação do fechamento
**Status atual**: implementado

**Já existe no código**
- validação formal do fechamento
- histórico de validações
- resumo validado
- impacto real no workflow

**Gap restante**
- delivery final aos envolvidos pode ficar mais forte

**Prioridade atual**: baixa-média

---

### 3.4 Monitoramento
**Status atual**: implementado em versão funcional

**Já existe no código**
- tela de monitoramento da diretoria
- consolidação do último fechamento e validação
- narrativa executiva
- histórico de fechamentos/validações

**Gap restante**
- dashboards comparativos multi-período / multi-projeto podem evoluir
- exportação board-ready pode melhorar

**Prioridade atual**: média

---

## Gap transversal atual

Agora os gaps principais são menos de “ausência do fluxo” e mais de maturidade do produto:

### 1. Qualidade dos dados / parsers por origem
- validação por layout
- parsing mais inteligente
- consistência cruzada entre bases

### 2. IA mais profunda no risco e diagnóstico
- risco sugerido por IA com governança formal
- recomendações mais ricas e contextualizadas

### 3. Delivery formal
- destinatários por projeto
- templates executivos
- trilha de recebimento mais forte

### 4. Governança transversal
- tarefas por responsável
- prioridade / SLA / prazo
- fila transversal do que trava o fluxo

### 5. Refinamento executivo
- relatórios mais premium
- exportações mais fortes
- visão diretoria comparativa

---

## Ordem recomendada de implementação a partir daqui

### Próxima fase recomendada
1. **Validação formal do diagnóstico histórico**
2. **Fortalecer risco + IA**
3. **Melhorar parsers/base histórica/FIDC**
4. **Delivery formal para envolvidos**
5. **Governança transversal por tarefas/SLA**
6. **Refino executivo dos relatórios e board**

---

## Conclusão

A diferença entre planilha e código diminuiu muito. As etapas 1 a 8 do fluxo já têm cobertura funcional relevante dentro do Ironcore.

O trabalho daqui para frente é menos “erguer a espinha dorsal” e mais:
- aumentar profundidade analítica
- melhorar governança
- melhorar qualidade de dados
- melhorar saída executiva

Em resumo:
- **fluxo principal**: já implementado em grande parte
- **maturidade operacional/executiva**: ainda em evolução
