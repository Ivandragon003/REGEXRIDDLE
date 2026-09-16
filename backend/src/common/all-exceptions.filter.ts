import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Errore interno del server';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = this.extractMessage(res);
    } else if (this.isFileTooLargeError(exception)) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = "L'immagine non può superare 2 MB";
    }

    response.status(status).json({ error: message, status });
  }

  private extractMessage(res: string | object): string {
    if (typeof res === 'string') {
      return res;
    }
    const obj = res as { message?: string | string[] };
    if (Array.isArray(obj.message)) {
      return obj.message.join('; ');
    }
    if (typeof obj.message === 'string') {
      return obj.message;
    }
    return 'Richiesta non valida';
  }

  private isFileTooLargeError(exception: unknown): exception is { code: string } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code?: unknown }).code === 'LIMIT_FILE_SIZE'
    );
  }
}
