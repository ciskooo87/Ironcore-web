# Leadfinder publicado em `ironcore.lat/leadfinder`

## Arquitetura atual

- UI publicada no `Ironcore-web` (Next.js)
- rota pública: `https://ironcore.lat/leadfinder/`
- backend consumido server-side: `LEADFINDER_API_URL`
- fallback atual no código: `http://127.0.0.1:8021`

## Arquivos principais

- `src/app/leadfinder/page.tsx`
- `src/app/api/leadfinder/generate/[companyId]/route.ts`

## Dependência operacional

A página precisa do backend `leadfind` ativo em `127.0.0.1:8021`.

## Recomendação de produção

Criar um serviço dedicado para o backend do Leadfind, por exemplo:

- arquivo base no repo do backend:
  - `/home/openclaw/.openclaw/workspace/leadfind/deploy/leadfind.service.example`

## Variável opcional

No host do `Ironcore-web`, pode-se usar:

```env
LEADFINDER_API_URL=http://127.0.0.1:8021
```

## Validação rápida

```bash
curl http://127.0.0.1:8021/health
curl https://ironcore.lat/leadfinder/
```

## Observação

Sem o backend do Leadfind ativo, a UI continua publicada, mas mostrará `API: offline`.
