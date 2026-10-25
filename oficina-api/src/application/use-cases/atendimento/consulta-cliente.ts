import { NotFoundError } from '../../../domain/shared/errors.js';
import type { OrdemServico, UnidadeTrabalho } from '../../ports/atendimento.js';
import type { Lista, Paginacao } from '../../ports/cadastros.js';
import { detalhar, type DetalheOS } from './ordens.js';

/**
 * Consulta do cliente às próprias OS (RN11, RN13). O cliente vem do token, nunca da URL.
 * OS de outro cliente responde 404, para não revelar que existe (BOLA).
 */
export class ConsultarMinhasOrdens {
  constructor(private readonly uow: UnidadeTrabalho) {}

  listar(clienteId: string, pagina: Paginacao): Promise<Lista<OrdemServico>> {
    return this.uow.executar(({ atendimento }) => atendimento.listarOS({ clienteId }, pagina));
  }

  detalhar(clienteId: string, id: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento }) => {
      const os = await atendimento.buscarOS(id);
      if (!os || os.clienteId !== clienteId) throw new NotFoundError('OS_NAO_ENCONTRADA', 'Ordem de serviço não encontrada');
      return detalhar(atendimento, id);
    });
  }
}
