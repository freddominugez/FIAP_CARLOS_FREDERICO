import { describe, expect, it } from 'vitest';
import type { UsuarioComSenha } from '../../src/application/ports/usuario-repository.js';
import { Autenticar } from '../../src/application/use-cases/identidade/autenticar.js';
import { UnauthorizedError } from '../../src/domain/shared/errors.js';

const usuario: UsuarioComSenha = {
  id: '6f1c2c1e-0000-4000-8000-000000000001',
  email: 'tecnico@oficina.local',
  nome: 'Técnico',
  perfil: 'TECNICO',
  clienteId: null,
  senhaHash: 'hash-certo',
  ativo: true,
};

function caso(encontrado: UsuarioComSenha | null) {
  const buscados: string[] = [];
  const uc = new Autenticar(
    { buscarPorEmail: async (email) => (buscados.push(email), encontrado) },
    { confere: async (senha, hash) => senha === 'senha' && hash === 'hash-certo' },
  );
  return { uc, buscados };
}

describe('Autenticar', () => {
  it('devolve a identidade com senha correta', async () => {
    const { uc } = caso(usuario);
    await expect(uc.executar('tecnico@oficina.local', 'senha')).resolves.toEqual({
      usuarioId: usuario.id,
      nome: 'Técnico',
      perfil: 'TECNICO',
      clienteId: null,
    });
  });

  it('normaliza o e-mail antes de buscar', async () => {
    const { uc, buscados } = caso(usuario);
    await uc.executar('  Tecnico@Oficina.LOCAL ', 'senha');
    expect(buscados).toEqual(['tecnico@oficina.local']);
  });

  it.each([
    ['usuário inexistente', null, 'senha'],
    ['senha errada', usuario, 'outra'],
    ['usuário inativo', { ...usuario, ativo: false }, 'senha'],
  ])('recusa %s com o mesmo erro', async (_nome, encontrado, senha) => {
    const { uc } = caso(encontrado);
    const erro = await uc.executar('tecnico@oficina.local', senha).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(UnauthorizedError);
    expect(erro).toMatchObject({ code: 'CREDENCIAIS_INVALIDAS', status: 401 });
  });
});
