# Hardening de Produção — Ironcore Web

## Objetivo
Reduzir chance de novo `502`, drift de serviço e regressão operacional no host.

## Controles mínimos
- usar `./scripts/deploy-prod.sh` como fluxo oficial
- nunca restartar `ironcore-web.service` sem build válido em `.next`
- manter `WorkingDirectory=/home/openclaw/.openclaw/workspace/Ironcore-web`
- manter NGINX apontando para `127.0.0.1:3001`
- validar `APP_PUBLIC_URL` e `DATABASE_URL` antes de publicar
- validar healthcheck local após restart

## Ordem de diagnóstico para incidente
1. `systemctl status ironcore-web.service --no-pager`
2. `journalctl -u ironcore-web.service -n 100 --no-pager`
3. `curl -I http://127.0.0.1:3001`
4. `curl -I -H 'Host: ironcore.lat' http://127.0.0.1/`
5. `curl -I -L https://ironcore.lat`

## Controles aplicados no repositório
- `.env.example` adicionado
- `next` atualizado para versão com correção de advisory moderado
- uploads limitados por extensão e tamanho
- `middleware` migrado para `proxy`
- `preflight` endurecido com validação de env crítico e sanity check do serviço

## Risco residual conhecido
- dependência `xlsx` segue com advisory alto sem correção automática disponível
- mitigação atual: limitar extensões e tamanho de upload
- recomendação: avaliar substituição futura por parser menos exposto
