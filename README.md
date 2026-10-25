# Tech Challenge Fase 1, FIAP SOAT

Back-end de oficina mecânica (MVP) com DDD e o portal que publica o plano, os diagramas, o vídeo e a entrega.

| Pasta | Conteúdo |
|---|---|
| `oficina-api/` | produto exigido: monólito em camadas, TypeScript, Fastify, PostgreSQL |
| `portal/` | site estático publicado na Vercel |
| `docs/` | plano construtivo, ADRs, DDD, evidências |
| `entrega/` | PDF oficial final |
| `referencias/` | enunciado e plano v1.0 |

O plano completo, com etapas, stack e regras de negócio, está em [docs/PLANO_CONSTRUTIVO.md](docs/PLANO_CONSTRUTIVO.md).

## Portal local

Abrir `portal/index.html` no navegador, ou servir a pasta:

```bash
npx serve portal
```

Links reais da entrega (vídeo, GitHub, hash, Miro, PDF) entram em `portal/assets/js/config.js`. Campo vazio aparece como pendente.

## Publicação na Vercel

1. Copiar esta pasta para o repositório `FIAP_CARLOS_FREDERICO`, num caminho sem espaço.
2. Na Vercel, importar o repositório e apontar o diretório raiz para esta pasta. `vercel.json` publica `portal/` como estático.
3. Adicionar o domínio em Settings, Domains, e configurar o DNS indicado.
4. Quando a API existir (D+6), incluir no `vercel.json` a função de `oficina-api/api/` e o rewrite de `/api/*`.

## Back-end

Ainda não implementado. A estrutura de pastas está criada e o README de `oficina-api/` vai seguir a lista mínima do enunciado.
