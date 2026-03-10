# Infra de Produção — Ironcore

## Serviço oficial da aplicação

O serviço oficial da aplicação web em produção é:

- `ironcore-web.service`

Configuração operacional atual:

- repositório: `/home/openclaw/.openclaw/workspace/Ironcore-web`
- app server: Next.js
- bind local: `127.0.0.1:3001`
- proxy reverso: Nginx
- domínio público: `https://ironcore.lat`
- borda/CDN: Cloudflare

## Fluxo de tráfego

1. Cliente acessa `https://ironcore.lat`
2. Cloudflare encaminha para o host
3. Nginx recebe em `:80`
4. Nginx faz proxy para `127.0.0.1:3001`
5. `ironcore-web.service` entrega a aplicação Next.js

## Serviços observados neste host

### Ativos
- `ironcore-web.service` — aplicação web oficial
- `nginx.service` — proxy reverso
- OpenClaw gateway em `127.0.0.1:18789`

### Legados / aposentados
- `ironcore-dashboard.service` — Streamlit antigo, desativado
- `ironcore-api.service` — API antiga em `/opt/ironcore/apps/api`, desativada

Backups dos unit files legados:
- `docs/legacy-systemd/ironcore-dashboard.service.bak`
- `docs/legacy-systemd/ironcore-api.service.bak`

## Portas relevantes

- `80` → Nginx público
- `3001` → Ironcore web (Next.js)
- `18789` → OpenClaw gateway
- `8501` → não utilizada no estado atual
- `8010` → não utilizada no estado atual

## Comandos úteis

### Verificar saúde da web
```bash
systemctl status ironcore-web.service --no-pager
curl -I http://127.0.0.1:3001
curl -I -L https://ironcore.lat
```

### Ver logs da web
```bash
journalctl -u ironcore-web.service -n 100 --no-pager
```

### Reiniciar a aplicação
```bash
sudo systemctl restart ironcore-web.service
```

### Confirmar proxy do domínio
```bash
grep -Rni 'ironcore.lat\|127.0.0.1:3001\|proxy_pass' /etc/nginx/sites-enabled
```

## Incidente registrado

Em 2026-03-10, o domínio `ironcore.lat` apresentou `502`.

Causa operacional encontrada:
- o `ironcore-web.service` estava configurado com `WorkingDirectory=/home/openclaw/.openclaw/workspace/ironcore-web`
- o path real do repositório era `/home/openclaw/.openclaw/workspace/Ironcore-web`
- como Linux é case-sensitive, o serviço falhava no `CHDIR` e o Nginx ficava sem upstream saudável

Correção aplicada:
- ajuste permanente do `WorkingDirectory` no unit file do systemd
- desativação dos serviços legados que geravam ruído operacional

## Regras operacionais

- tratar `ironcore-web.service` como fonte oficial da web em produção
- evitar múltiplos serviços paralelos para o mesmo produto sem documentação explícita
- sempre validar path exato e capitalização antes de configurar systemd em Linux
- ao diagnosticar `502`, checar nesta ordem:
  1. `systemctl status ironcore-web.service`
  2. `journalctl -u ironcore-web.service -n 100 --no-pager`
  3. `curl -I http://127.0.0.1:3001`
  4. configuração do Nginx
  5. resposta externa do domínio
