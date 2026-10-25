import { createHash } from 'node:crypto';

/** Hash do corpo normalizado, ligado à chave de idempotência (RN09). */
export function hashCorpo(corpo: object): string {
  return createHash('sha256').update(JSON.stringify(corpo)).digest('hex');
}
