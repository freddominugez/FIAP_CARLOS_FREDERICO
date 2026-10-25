# Linguagem ubíqua

Termos que a oficina usa e o nome de cada um no código e no banco. Revisado na D+8 contra o código implementado. Os nomes de código ficam em português, como na conversa com a oficina. As tabelas do banco ficam em inglês.

Contextos: **Cadastros** (cliente, veículo), **Catálogo e Estoque** (serviço, peça, movimento), **Atendimento** (OS, orçamento, decisão, execução) e **Identidade** (usuário, perfil). Relações entre eles em [mapa-de-contexto.md](mapa-de-contexto.md).

## Atendimento

| Termo | Significado | No código | No banco |
|---|---|---|---|
| Ordem de serviço (OS) | atendimento de um veículo, do recebimento à entrega | `OrdemServico`, casos de uso `GerenciarOrdens` e `ExecutarOrdens` | `service_orders` |
| Número da OS | identificação pública, separada do id interno | `OrdemServico.numero` (`OS-2026-000123`) | `service_orders.number` |
| Solicitação | o que o cliente relata ao chegar | `OrdemServico.solicitacao` | `service_orders.complaint` |
| Status da OS | fase do atendimento, uma de seis | `StatusOS`: `RECEBIDA`, `EM_DIAGNOSTICO`, `AGUARDANDO_APROVACAO`, `EM_EXECUCAO`, `FINALIZADA`, `ENTREGUE` | `service_orders.status` |
| Transição | mudança de status permitida por um comando | `ComandoOS`, `TRANSICOES`, `transicionar()` | |
| Histórico de status | registro de cada mudança, com autor e data | `MudancaStatus` | `status_history` |
| Versão da OS | contador que muda a cada alteração e impede gravar sobre leitura antiga | `OrdemServico.versao`, `exigirVersao()` | `service_orders.version` |
| Diagnóstico | fase em que o técnico define serviços e peças | status `EM_DIAGNOSTICO`, `exigirDiagnostico()` | |
| Item da OS | serviço ou peça incluído no diagnóstico, a preço atual do catálogo | `ItemServicoOS`, `ItemPecaOS` | `order_service_items`, `order_part_items` |
| Estimativa | soma dos itens a preço atual, antes da publicação | `DetalheOS.estimativaCentavos` | |
| Orçamento | proposta publicada ao cliente, em versões | `Orcamento` | `quotes` |
| Versão do orçamento | cópia congelada de descrição, quantidade e preço no momento da publicação | `Orcamento.versao`, `ItemOrcamentoGravado` | `quotes.version`, `quote_items` |
| Publicar orçamento | gerar nova versão e levar a OS para aguardar aprovação | `GerenciarOrdens.publicarOrcamento()`, `calcularOrcamento()` | |
| Total da linha | quantidade vezes preço, em centavos, meio centavo para cima | `totalDaLinha()`, `LinhaOrcamento` | `quote_items.total_cents` |
| Decisão | aprovação ou rejeição do cliente sobre uma versão | `Decisao`, `DecidirOrcamento`, `avaliarDecisao()` | `quote_decisions` |
| Status do orçamento | situação de cada versão | `StatusOrcamento`: `PENDENTE`, `APROVADO`, `REJEITADO`, `INVALIDADO` | `quotes.status` |
| Reabrir diagnóstico | voltar ao diagnóstico, invalidando a versão atual e liberando reservas | `GerenciarOrdens.reabrirDiagnostico()` | |
| Execução | fase em que o técnico consome peças e conclui serviços | status `EM_EXECUCAO`, `ExecutarOrdens.iniciar()`, `exigirAprovado()` | `service_orders.execution_started_at` |
| Serviço concluído | serviço da OS marcado como feito | `ExecutarOrdens.concluirServico()`, `ItemServicoOS.concluidoEm` | `order_service_items.completed_at` |
| Finalizar | encerrar a execução, com todos os serviços concluídos | `ExecutarOrdens.finalizar()`, `exigirServicosConcluidos()` | `service_orders.finalized_at` |
| Entrega | devolução do veículo ao cliente, último status | `ExecutarOrdens.entregar()`, status `ENTREGUE` | `service_orders.delivered_at` |
| Tempo médio de execução | média de (finalização menos início da execução) das OS finalizadas no período | `ExecutarOrdens.tempoMedio()`, `TempoMedio`, `validarPeriodo()` | |
| Minhas OS | consulta do cliente às próprias ordens | `ConsultarMinhasOrdens` | |
| Chave de idempotência | identificador que faz uma repetição devolver o mesmo resultado | `RegistroIdempotente`, `hashCorpo()` | `idempotency_keys` |

## Catálogo e Estoque

| Termo | Significado | No código | No banco |
|---|---|---|---|
| Serviço | mão de obra do catálogo, com preço | `Servico`, `GerenciarServicos` | `service_catalog` |
| Peça | item de estoque contado em unidades inteiras | `Peca` com `tipo` `PECA`, `GerenciarPecas` | `parts` com `kind = 'PECA'` |
| Insumo | material fracionado (óleo, graxa) em litro, quilo ou metro | `Peca` com `tipo` `INSUMO` e `Unidade` `L`, `KG`, `M` | `parts` com `kind = 'INSUMO'` |
| SKU | código da peça no catálogo | `Peca.sku` | `parts.sku` |
| Saldo físico | quantidade na prateleira | `Peca.estoqueFisico`, `Saldo.fisico` | `parts.physical` |
| Reservado | quantidade presa a orçamentos aprovados | `Peca.estoqueReservado`, `Saldo.reservado` | `parts.reserved` |
| Disponível | físico menos reservado | `disponivel()`, `estoqueDisponivel` na resposta | |
| Movimento de estoque | registro que muda o saldo. Nunca é editado nem apagado | `MovimentoEstoque`, `TipoMovimento`, `aplicarMovimento()` | `stock_movements` |
| Entrada | chegada de peça, soma ao físico | `ENTRADA` | |
| Ajuste | baixa por perda ou inventário, com observação | `AJUSTE` | |
| Reserva | separação das peças de um orçamento aprovado, todas ou nenhuma | `RESERVA`, `reservarOrcamento()`, `exigirDisponibilidade()` | |
| Liberação | devolução de uma reserva ao disponível | `LIBERACAO`, `liberarReservas()` | |
| Consumo | baixa física da peça reservada, uma vez por linha | `CONSUMO`, `ExecutarOrdens.consumirPeca()` | |
| Estorno | movimento novo que desfaz entrada, ajuste ou consumo | `ESTORNO`, `aplicarEstorno()`, `MovimentarEstoque.estornar()` | `stock_movements.reverses_id` |

## Cadastros

| Termo | Significado | No código | No banco |
|---|---|---|---|
| Cliente | pessoa ou empresa dona do veículo | `Cliente`, `GerenciarClientes` | `customers` |
| Documento | CPF ou CNPJ, inclusive o CNPJ alfanumérico de 2026, validado pelo dígito verificador | `Documento`, `TipoDocumento`, `criarDocumento()` | `customers.document`, `document_type` |
| Veículo | carro do cliente, com placa, marca, modelo e ano | `Veiculo`, `GerenciarVeiculos`, `validarAno()` | `vehicles` |
| Placa | padrão antigo (`ABC1234`) ou Mercosul (`ABC1D23`), única entre ativos | `normalizarPlaca()` | `vehicles.plate` |
| Inativar | tirar de uso sem apagar o histórico | `ativo: false` | coluna `active` |

## Identidade

| Termo | Significado | No código | No banco |
|---|---|---|---|
| Usuário | quem entra na API com e-mail e senha | `UsuarioComSenha`, `Autenticar` | `users` |
| Perfil | papel que define o que o usuário pode fazer | `Perfil`: `ADMIN`, `ATENDENTE`, `TECNICO`, `CLIENTE` | `users.role` |
| Acesso do cliente | usuário CLIENTE ligado a um cliente, criado pelo atendente | `GerenciarClientes.criarAcesso()` | `users.customer_id` |
| Token | JWT com id, nome, perfil e cliente, válido por 1 hora | `UsuarioToken` | |
