# Ironcore - roteiro de teste (início pelo Cadastro)

## Objetivo
Validar o fluxo completo do SOP começando por Cadastro, com evidência e gates.

## Pré-condições
- App acessível em: `http://ironcore.lat/app/`
- Projeto existente: `elicon` (ou outro código)
- Usuário com perfil `head` ou `admin_master` para concluir Cadastro

## Etapa 1 - Cadastro
1. Abrir: `/app/projetos/elicon/cadastro`
2. Preencher/validar:
   - nome, CNPJ, razão social, segmento
   - plano de contas (1 por linha)
   - parâmetros financeiros
   - classificação de fornecedores (`fornecedor|conta`)
3. Salvar
4. Resultado esperado:
   - mensagem de sucesso no cadastro
   - no módulo Rotina Diária, etapa `Cadastro` em **Concluído** com evidência automática

## Etapa 2 - Upload base diária
1. Abrir: `/app/projetos/elicon/diario`
2. Fazer upload de arquivo válido (csv/xlsx)
3. Resultado esperado:
   - `saved=1`
   - etapa SOP `Upload Base Diária` em **Concluído** com evidência

## Etapa 3 - Rodar rotina diária
1. Abrir: `/app/projetos/elicon/rotina-diaria`
2. Rodar rotina
3. Resultado esperado:
   - se Cadastro/Upload não concluídos: erro de pré-requisito
   - se concluídos: execução ok + atualização automática de
     - `Painel de Risco`
     - `Movimento Diário`

## Etapa 4 - Fechamento mensal
1. Abrir: `/app/projetos/elicon/fechamento-mensal`
2. Fechar mês `YYYY-MM`
3. Resultado esperado:
   - fechamento salvo
   - SOP `Fechamento Mensal` = **Concluído**
   - SOP `Validação do Fechamento` = **Aguardando validação**

## Regras importantes
- Concluir etapa sem evidência deve ser bloqueado.
- Etapas com gate de aprovação exigem perfil mínimo (Head/Diretoria).
- Sempre validar no `/rotina-diaria` o status e SLA das etapas.
