import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { TypeORMError } from 'typeorm';
import { MyLoggerService } from '../../my-logger/my-logger.service';

type MyResponseObj = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new MyLoggerService(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const myResponseObj: MyResponseObj = {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };

    if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = exception.getResponse();
    } else if (exception instanceof MongoServerError) {
      myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
      myResponseObj.response = {
        error: 'MongoDB Error',
        message: exception.message,
        code: exception.code,
      };
    } else if (exception instanceof TypeORMError) {
      myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
      myResponseObj.response = {
        error: 'Postgres Error',
        message: exception.message,
      };
    } else {
      myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      myResponseObj.response = 'Internal Server Error';
    }

    response.status(myResponseObj.statusCode).json(myResponseObj);

    this.logger.error(myResponseObj.response, AllExceptionsFilter.name);
    super.catch(exception, host);
  }
}
