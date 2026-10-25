# Linguagem ubíqua

Rascunho do D+0. Revisar depois do Event Storming (D+1) e ligar cada termo à classe correspondente.

| Termo | Significado | No código |
|---|---|---|
| Ordem de serviço (OS) | atendimento de um veículo, da recepção à entrega | `OrdemServico` |
| Solicitação | o que o cliente relata ao chegar | `Solicitacao` |
| Diagnóstico | etapa em que o técnico define serviços e peças | status `EM_DIAGNOSTICO` |
| Orçamento | proposta de serviços e peças com total, em versões | `Orcamento` |
| Versão do orçamento | cópia congelada de itens e preços no momento da publicação | `Orcamento.versao` |
| Decisão | aprovação ou rejeição do cliente sobre uma versão | `DecisaoOrcamento` |
| Reserva | separação de peça para uma OS aprovada, sem baixa física | `MovimentoEstoque(RESERVA)` |
| Consumo | baixa física da peça reservada, durante a execução | `MovimentoEstoque(CONSUMO)` |
| Estorno | movimento que corrige um consumo, sem apagar o anterior | `MovimentoEstoque(ESTORNO)` |
| Saldo físico | unidades na prateleira | `Peca.fisico` |
| Disponível | físico menos reservado | `Peca.disponivel()` |
| Insumo | material fracionado (óleo, graxa), com unidade e escala | `Peca` com `unidade` decimal |
| Entrega | devolução do veículo ao cliente, encerra a OS | status `ENTREGUE` |
| Tempo médio de execução | média de finalizada menos iniciada, em OS finalizadas no período | `MetricaTempoExecucao` |
| Documento fiscal | CPF ou CNPJ do cliente, validado | `DocumentoFiscal` |
| Placa | identificação do veículo, padrão antigo ou Mercosul | `Placa` |
