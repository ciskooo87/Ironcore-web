# Ironcore Web

Aplicação web oficial do Ironcore.

## Desenvolvimento

```bash
npm run dev
```

Abra:
- <http://localhost:3000>

## Produção neste host

Infra oficial:
- app: Next.js
- serviço: `ironcore-web.service`
- bind local: `127.0.0.1:3001`
- proxy: Nginx
- domínio: `https://ironcore.lat`

## Deploy oficial

Use o script único de deploy:

```bash
cd /home/openclaw/.openclaw/workspace/Ironcore-web
./scripts/deploy-prod.sh
```

O script faz:
- `npm run build`
- `systemctl daemon-reload`
- restart do `ironcore-web.service`
- healthcheck final em `127.0.0.1:3001`

## Observação importante

Esse fluxo reduz as janelas de inconsistência entre build e runtime. Reinícios manuais soltos tendem a aumentar risco de erro transitório do Next.js, especialmente com Server Actions e manifests trocando no meio da navegação.

## Referências operacionais

- `docs/PROD_INFRA.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/MOVEMENT_DECISION_MATRIX.md`
