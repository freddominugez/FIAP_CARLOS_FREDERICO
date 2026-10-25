# ADR 0004: valores em centavos e orçamento versionado

Data: 25/10/2026, revisada na D+4 com a regra de arredondamento. Status: aceita.

## Contexto
O orçamento é gerado a partir de preços do catálogo, que podem mudar depois. O cliente aprova um valor específico, e a aprovação precisa apontar para ele.

## Decisão
Dinheiro como inteiro em centavos (`bigint` no banco, `number` inteiro no domínio). O total de cada linha é calculado em `domain/atendimento/orcamento.ts`: quantidade em milésimos vezes preço em centavos, com `BigInt`, e meio centavo arredondado para cima por linha. O total do orçamento é a soma das linhas já arredondadas. Publicar o orçamento cria uma versão nova com cópia de descrição, quantidade e preço de cada item. A decisão do cliente aponta para a versão.

## Consequências
- Sem erro de arredondamento de ponto flutuante. Insumo fracionado (4,5 L a R$ 45,99) dá 20.696 centavos, e a regra está coberta por teste.
- Mudança de preço no catálogo não altera orçamento publicado.
- Decisão sobre versão antiga é detectada e recusada com 409.

## Alternativas
- `numeric` com decimal no domínio: correto, mas exige biblioteca de decimal no TypeScript.
- Preço lido do catálogo na hora de exibir: quebra a aprovação quando o preço muda.
