import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống nội bộ';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = res.message || exception.message;
        code = res.error || `HTTP_${status}`;
        if (Array.isArray(res.message)) {
          details = res.message.map((msg: string) => ({ issue: msg }));
          message = 'Dữ liệu yêu cầu không hợp lệ';
          code = 'VALIDATION_ERROR';
        } else if (res.details) {
          details = res.details;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    const traceId = `trace-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    response.status(status).json({
      status: 'error',
      message: Array.isArray(message) ? message[0] : message,
      error: {
        code,
        details: details || [{ issue: message }],
        timestamp: new Date().toISOString(),
        trace_id: traceId,
        path: request.url,
      },
    });
  }
}
