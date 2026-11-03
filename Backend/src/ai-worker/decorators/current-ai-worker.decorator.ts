import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedAiWorker } from '../guards/ai-worker-auth.guard';

export const CurrentAiWorker = createParamDecorator(
  (
    _data: unknown,
    ctx: ExecutionContext,
  ): AuthenticatedAiWorker | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ worker?: AuthenticatedAiWorker }>();
    return request.worker;
  },
);
