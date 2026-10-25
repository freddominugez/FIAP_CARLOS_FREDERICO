// Erros de domínio e de aplicação. A camada HTTP traduz cada tipo num status.

export abstract class AppError extends Error {
  abstract readonly status: number;

  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Entrada que viola formato ou regra de validação. */
export class ValidationError extends AppError {
  readonly status = 400;
}

/** Credencial ausente ou inválida. */
export class UnauthorizedError extends AppError {
  readonly status = 401;
}

/** Usuário autenticado sem perfil para a ação. */
export class ForbiddenError extends AppError {
  readonly status = 403;
}

/** Recurso ausente ou pertencente a outro cliente. */
export class NotFoundError extends AppError {
  readonly status = 404;
}

/** Conflito de regra de negócio, versão ou estado. */
export class ConflictError extends AppError {
  readonly status = 409;
}
