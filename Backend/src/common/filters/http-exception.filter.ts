import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type HttpExceptionLike = {
  getStatus(): number;
  getResponse(): string | { message?: string | string[]; code?: string };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (this.isHttpException(exception)) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.defaultCodeForStatus(status);
      } else {
        message = exceptionResponse.message ?? message;
        const defaultCode = this.defaultCodeForStatus(status);
        code =
          status === HttpStatus.TOO_MANY_REQUESTS
            ? 'TOO_MANY_REQUESTS'
            : exceptionResponse.code &&
                exceptionResponse.code !== 'INTERNAL_SERVER_ERROR'
              ? exceptionResponse.code
              : defaultCode;
      }
    }

    const logMessage = `${request.method} ${request.url} ${status} - ${Array.isArray(message) ? message.join(', ') : message}`;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isHttpException(exception: unknown): exception is HttpExceptionLike {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'getStatus' in exception &&
      typeof exception.getStatus === 'function' &&
      'getResponse' in exception &&
      typeof exception.getResponse === 'function'
    );
  }

  private defaultCodeForStatus(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return codes[status] ?? `HTTP_${status}`;
  }
}