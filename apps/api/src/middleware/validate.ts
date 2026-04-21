import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequest } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(BadRequest('Validation failed', result.error.flatten()));
    }
    // Replace the source with the parsed + coerced data.
    (req as any)[source] = result.data;
    next();
  };
}
