# Prints para a edição do vídeo

São 111 arquivos, organizados por cena do [roteiro decupado](../roteiro-decupado.md). Todos têm 1920 x 1080, menos as páginas inteiras, o JSON completo e as janelas de terminal, que têm a altura do próprio conteúdo.

## Como foram gerados

Gerados em 28/10/2026 com o código do commit `e0d27d8`, rodando nesta máquina e capturados com o Chromium:

- API rodando localmente com PostgreSQL 16, banco zerado e só os 3 usuários de demonstração. Por isso a URL nos prints do Swagger é `http://localhost:3000`, e não a da Vercel. O comportamento é o mesmo da produção, porque o código é o mesmo.
- Portal servido localmente a partir de `portal/`.
- Documentos Markdown renderizados com o CSS do GitHub. A linha citada na narração aparece destacada em amarelo.
- Saída real de `npm run arch`, `npm run coverage` e `scripts/roteiro-ponta-a-ponta.mjs`, desenhada como janela de terminal.

O portal e a API publicados não puderam ser abertos daqui, porque a rede desta sessão bloqueia a Vercel. Se você preferir a URL de produção na tela, refaça só os prints do Swagger seguindo a mesma sequência.

## O que não tem print

- **Cena 20 (Docker Compose):** não há Docker nesta máquina. Grave `docker compose up --build` na sua máquina.
- **Gravações em vídeo:** os prints cobrem cada passo e servem para montar a cena com zoom e destaque. Se quiser movimento real de tela, use os prints como guia de gravação.

## Mapa por cena

Nos prints do Swagger, o sufixo `-a` é a requisição preenchida, `-b` é a resposta, `-c` é o diálogo Authorize com o token e `-d` é o JSON completo, quando a resposta não cabe na tela.

| Cena | Arquivos |
|---|---|
| 01 Abertura | `portal/cap-portal-topo.png` |
| 02 Problema | `portal/cap-portal-solucao.png`, `portal/cap-portal-numeros.png`, `portal/cap-portal-fluxo.png` |
| 03 C4 | `diagramas/img-c4-1-contexto.png`, `diagramas/img-c4-2-conteineres.png` (SVG na mesma pasta) |
| 04 Camadas | `terminal/grv-editor-arvore-src.png`, `terminal/grv-arch.png` |
| 05 Banco | `documentos/cap-adr-0002.png`, `diagramas/img-c4-3-componentes-aprovacao.png` |
| 06 Event Storming | `diagramas/img-es-0-legenda.png` a `img-es-3-pecas-insumos.png` |
| 07 Linguagem | `documentos/cap-linguagem-statusos.png` |
| 08 Contextos | `documentos/cap-mapa-diagrama.png`, `documentos/cap-mapa-tabela.png` |
| 09 Admin | `swagger/c09-00` a `c09-04` |
| 10 Atendente | `swagger/c10-01` a `c10-05` |
| 11 Técnico | `swagger/c11-01` a `c11-05` (total de 27000 centavos em `c11-05-...-b-resposta`) |
| 12 Cliente | `swagger/c12-01` a `c12-04` (físico 5, reservado 2, disponível 3 em `c12-04`) |
| 13 Execução | `swagger/c13-01` a `c13-06` (6 status em `c13-05-...-d-json-completo`) |
| 14 Acesso | `swagger/c14-01-sem-token-401`, `swagger/c14-02-tecnico-abre-os-403` |
| 15 Validação | `swagger/c15-01-versao-desatualizada-409`, `swagger/c15-02-cpf-invalido-400` |
| 16 Isolamento | `swagger/c16-01-outro-cliente-404`, `swagger/c16-02-aprovacao-repetida`, `swagger/c16-03-estoque-sem-nova-reserva` |
| 17 Testes | `terminal/grv-coverage-resumo.png` |
| 18 Última peça | `terminal/grv-teste-concorrencia.png`, `terminal/grv-e2e-ultima-unidade.png` |
| 19 Varreduras | `documentos/cap-evidencias-resultado.png`, `documentos/cap-achados-linha1.png` |
| 20 Docker | sem print, gravar localmente |
| 21 Fim | `terminal/cap-commit-entrega.png`, `portal/cap-portal-links-entrega.png`, `portal/cap-portal-topo.png` |

Extras: `portal/cap-portal-arquitetura.png`, `portal/cap-portal-ddd.png`, as páginas inteiras (`*-pagina-inteira.png`) e os SVG dos diagramas C4.
