# Event Storming

Quadro no FigJam: https://www.figma.com/board/NKQrpQI2vGYRkX8YnBAZMN. Exportação em `event-storming.pdf` e `img/`. Este arquivo é a fonte em texto do quadro.

Legenda da DDD aula 6 (no quadro, agregado em teal, porque a aula não define cor):

| Cor | Elemento | Escrita |
|---|---|---|
| 🟧 laranja | evento de domínio | passado |
| 🟦 azul | comando | imperativo |
| 🟨 amarelo | ator | papel |
| 🟪 roxo claro | política | "sempre que X, então Y" |
| 🟩 verde claro | modelo de leitura | o que o ator consulta |
| 🩷 rosa retangular | sistema externo | |
| 🩷 rosa em losango | ponto de atenção | dúvida ou risco |
| ┃ linha vertical | evento pivotal | troca de fase ou de contexto |

Os três quadros seguem a linha do tempo da esquerda para a direita. Cada linha das tabelas é um cartão ou um grupo de cartões em sequência.

## Fluxo 1: criação da ordem de serviço

Contexto: Cadastros e Atendimento. Agregados: `Cliente`, `Veiculo`, `OrdemServico`, `Orcamento`.

| # | 🟨 Ator | 🟩 Consulta | 🟦 Comando | 🟧 Evento | 🟪 Política |
|---|---|---|---|---|---|
| 1 | Atendente | cliente por CPF/CNPJ | Identificar cliente | Cliente identificado | |
| 1a | Atendente | | Cadastrar cliente | Cliente cadastrado | documento validado e único (RN01) |
| 2 | Atendente | veículos do cliente | Cadastrar veículo | Veículo cadastrado | placa validada e única (RN02) |
| 3 | Atendente | | Abrir ordem de serviço | **Ordem recebida** ┃ | exige cliente, veículo do cliente e uma solicitação (RN03) |
| 4 | Técnico | OS recebidas por data | Iniciar diagnóstico | Diagnóstico iniciado | |
| 5 | Técnico | catálogo de serviços ativos | Incluir serviço | Serviço incluído na OS | item inativo é recusado |
| 6 | Técnico | peças com saldo disponível | Incluir peça ou insumo | Peça incluída na OS | quantidade > 0, insumo com unidade |
| 7 | Técnico ou atendente | itens da OS | Publicar orçamento | **Orçamento disponibilizado** ┃ | sempre que publicar, congelar preços e criar nova versão (RN04) |

Exceções:

| Situação | 🟧 Evento ou resposta | 🩷 Ponto de atenção |
|---|---|---|
| CPF/CNPJ inválido | cadastro recusado (400) | CNPJ alfanumérico de 2026 |
| Placa já ativa em outro cliente | cadastro recusado (409) | transferência de veículo fica fora do MVP |
| Peça sem saldo no diagnóstico | item aceito com aviso | a falta só bloqueia na aprovação |
| Orçamento sem itens | publicação recusada (409) | |

## Fluxo 2: acompanhamento da ordem de serviço

Contexto: Atendimento. Agregados: `OrdemServico`, `Orcamento`. Sistema externo: 🩷 aplicativo ou cliente HTTP do dono do veículo.

| # | 🟨 Ator | 🟩 Consulta | 🟦 Comando | 🟧 Evento | 🟪 Política |
|---|---|---|---|---|---|
| 1 | Cliente | minhas OS e orçamento atual | Consultar OS | | só as próprias OS (RN11) |
| 2 | Cliente | versão atual do orçamento | Aprovar orçamento | **Orçamento aprovado** ┃ | sempre que aprovar, reservar todas as peças ou nenhuma (RN05, RN06) |
| 2a | Cliente | | Rejeitar orçamento | Orçamento rejeitado | execução bloqueada, status continua Aguardando aprovação |
| 2b | Técnico ou atendente | motivo da rejeição | Reabrir diagnóstico | Diagnóstico reaberto | sempre que reabrir, liberar reservas e invalidar a versão |
| 3 | Técnico | OS aprovadas | Iniciar execução | **Execução iniciada** ┃ | exige decisão APROVADA e reserva suficiente |
| 4 | Técnico | | Concluir serviço | Serviço concluído | |
| 5 | Técnico | | Finalizar execução | Serviço finalizado | sempre que finalizar, registrar duração para o tempo médio (RN10) |
| 6 | Atendente | OS finalizadas | Entregar veículo | **Veículo entregue** ┃ | OS entregue fica somente leitura |
| 7 | Administrador | tempo médio por período | Consultar indicador | | média, amostra e período |

Toda mudança de status gera `StatusAlterado` com autor, origem, destino e data (RN08).

Exceções:

| Situação | Resposta | 🩷 Ponto de atenção |
|---|---|---|
| Decisão sobre versão antiga | 409 | |
| Mesma aprovação repetida | mesmo resultado, sem nova reserva | `Idempotency-Key` |
| Cliente A abre OS de B | 404 | risco BOLA, OWASP API1 |
| Iniciar execução sem aprovação | 409 | |
| Serviço extra durante a execução | fora do MVP | exige reabrir com nova versão. Regra a validar |

## Fluxo 3: gestão de peças e insumos

Contexto: Catálogo e Estoque. Agregado: `Peca` com `MovimentoEstoque`.

| # | 🟨 Ator | 🟩 Consulta | 🟦 Comando | 🟧 Evento | 🟪 Política |
|---|---|---|---|---|---|
| 1 | Administrador | | Cadastrar peça ou insumo | Peça cadastrada | unidade e escala obrigatórias |
| 2 | Administrador | saldo físico e reservado | Registrar entrada | Estoque ajustado | movimento de ENTRADA, nunca edição de saldo |
| 3 | (política) | | Reservar peças | **Peças reservadas** ┃ | disparado por Orçamento aprovado. Lock por peça em ordem de UUID |
| 4 | (política) | | Liberar reserva | Reserva liberada | disparado por Diagnóstico reaberto |
| 5 | Técnico | reservas da OS | Consumir peça | Peça consumida | disparado na execução. Uma baixa por item (RN07) |
| 6 | Administrador | movimentos da peça | Estornar consumo | Consumo estornado | novo movimento, o anterior não muda |
| 7 | Administrador | | Inativar peça | Peça inativada | só exclui se não houver referência (RN12) |

Exceções:

| Situação | Resposta | 🩷 Ponto de atenção |
|---|---|---|
| Saldo disponível insuficiente na aprovação | 409 e rollback de todas as reservas | |
| Duas OS pela última unidade | uma aprova, a outra 409 | teste T05 |
| Ajuste que deixaria físico < reservado | recusado pela constraint | |
| Insumo fracionado (litro de óleo) | quantidade decimal na escala da unidade | escala a definir: 3 casas |

## Eventos pivotais

`Ordem recebida`, `Orçamento disponibilizado`, `Orçamento aprovado`, `Execução iniciada`, `Veículo entregue`. Em `Orçamento aprovado` o fluxo cruza do contexto Atendimento para Catálogo e Estoque.
