export const PERFIS = ['ADMIN', 'ATENDENTE', 'TECNICO', 'CLIENTE'] as const;

export type Perfil = (typeof PERFIS)[number];

export function isPerfil(valor: unknown): valor is Perfil {
  return typeof valor === 'string' && (PERFIS as readonly string[]).includes(valor);
}
