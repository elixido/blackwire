import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function fail(status: number, code: string, message: string): never {
  throw new AppError(status, code, message);
}

export function ok<T extends object>(
  res: Response,
  code: string,
  message: string,
  payload?: T
) {
  return res.status(200).json({
    ok: true,
    code,
    message,
    ...(payload ?? {})
  });
}

export function asyncRoute(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      ok: false,
      code: error.code,
      message: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    ok: false,
    code: 'INTERNAL_ERROR',
    message: 'The node returned an unexpected fault.'
  });
}
