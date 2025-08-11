import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

import { MyLoggerService } from '../../my-logger/my-logger.service';

type MyResponseObj = {
  success: boolean;
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
      success: false,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };

    if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = exception.getResponse();
    } else if (exception instanceof MongoServerError) {
      // Handle MongoDB specific errors
      switch (exception.code) {
        case 13: // Unauthorized
          myResponseObj.statusCode = HttpStatus.FORBIDDEN;
          myResponseObj.response = {
            error: 'Database Permission Error',
            message: 'Insufficient database permissions',
            details: exception.message,
          };
          break;
        case 18: // Authentication failed
          myResponseObj.statusCode = HttpStatus.UNAUTHORIZED;
          myResponseObj.response = {
            error: 'Database Authentication Error',
            message: 'Database authentication failed',
            details: exception.message,
          };
          break;
        case 121: // Document validation failed
          myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
          myResponseObj.response = {
            error: 'Validation Error',
            message: 'Document validation failed',
            details: exception.message,
          };
          break;
        case 11000: // Duplicate key error
          myResponseObj.statusCode = HttpStatus.CONFLICT;
          myResponseObj.response = {
            error: 'Duplicate Entry',
            message: 'A record with this information already exists',
            details: this.extractDuplicateKeyInfo(exception),
          };
          break;
        default:
          // Handle connection and other MongoDB errors
          if (exception.message?.includes('ECONNREFUSED') ||
            exception.message?.includes('ENOTFOUND') ||
            exception.message?.includes('ETIMEDOUT') ||
            exception.message?.includes('connection timeout') ||
            exception.message?.includes('server selection timeout')) {
            myResponseObj.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
            myResponseObj.response = {
              error: 'Database Connection Error',
              message: 'Unable to connect to database',
              details: exception.message,
            };
          } else {
            myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
            myResponseObj.response = {
              error: 'MongoDB Error',
              message: exception.message,
              code: exception.code,
            };
          }
      }
    } else if (exception instanceof MongooseError) {
      if (exception instanceof MongooseError.MissingSchemaError) {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Schema Error',
          message: 'Database schema is missing',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.OverwriteModelError) {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Model Error',
          message: 'Model overwrite error',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.ParallelSaveError) {
        myResponseObj.statusCode = HttpStatus.CONFLICT;
        myResponseObj.response = {
          error: 'Parallel Save Error',
          message: 'Document was modified by another operation',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.VersionError) {
        myResponseObj.statusCode = HttpStatus.CONFLICT;
        myResponseObj.response = {
          error: 'Version Error',
          message: 'Document version conflict',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.DivergentArrayError) {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Array Update Error',
          message: 'Array update operation failed',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.ValidationError) {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Validation Error',
          message: 'Data validation failed',
          details: this.formatValidationErrors(exception),
        };
      } else if (exception instanceof MongooseError.StrictModeError) {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Strict Mode Error',
          message: 'Field not in schema',
          details: exception.message,
        };
      } else if (exception instanceof MongooseError.CastError) {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Invalid ID Format',
          message: `Invalid ${exception.path} format: ${exception.value}`,
          details: 'The provided ID is not in the correct format'
        };
      } else {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Mongoose Error',
          message: 'Database operation failed',
          details: exception.message,
        };
      }
    } else if (exception instanceof Error && this.isRedisError(exception)) {
      // Handle Redis-related errors
      if (exception.message?.includes('ECONNREFUSED') ||
        exception.message?.includes('ENOTFOUND') ||
        exception.message?.includes('ETIMEDOUT') ||
        exception.message?.includes('connection timeout')) {
        myResponseObj.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        myResponseObj.response = {
          error: 'Cache Service Unavailable',
          message: 'Cache service is temporarily unavailable',
          details: this.formatRedisConnectionError(exception),
        };
      }
      else if (exception.message?.includes('OOM') ||
        exception.message?.includes('memory')) {
        myResponseObj.statusCode = HttpStatus.INSUFFICIENT_STORAGE;
        myResponseObj.response = {
          error: 'Cache Storage Full',
          message: 'Cache storage is full',
          details: this.formatRedisStorageError(exception),
        };
      }
      else if (exception.name === 'AbortError') {
        myResponseObj.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        myResponseObj.response = {
          error: 'Cache Connection Error',
          message: 'Cache connection was aborted',
          details: this.formatRedisConnectionError(exception),
        };
      }
      else if (exception.name === 'ParserError') {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Cache Parser Error',
          message: 'Cache data parsing failed',
          details: this.formatRedisParserError(exception),
        };
      }
      else if (exception.name === 'ReplyError') {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Redis Command Error',
          message: 'Cache command failed',
          details: this.formatRedisReplyError(exception),
        };
      }
      else {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Redis Error',
          message: 'Cache operation failed',
          details: this.formatRedisError(exception),
        };
      }
    } else if (exception instanceof Error) {
      if (exception.message?.includes('network') || exception.message?.includes('connection')) {
        myResponseObj.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        myResponseObj.response = {
          error: 'Service Unavailable',
          message: 'Service temporarily unavailable',
          details: exception.message,
        };
      } else if (exception.message?.includes('timeout')) {
        myResponseObj.statusCode = HttpStatus.REQUEST_TIMEOUT;
        myResponseObj.response = {
          error: 'Request Timeout',
          message: 'The request timed out',
          details: exception.message,
        };
      } else if (exception.name === 'ReferenceError') {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Reference Error',
          message: 'Internal reference error',
          details: exception.message,
        };
      } else if (exception.name === 'SyntaxError') {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Syntax Error',
          message: 'Invalid syntax in request',
          details: exception.message,
        };
      } else if (exception.name === 'TypeError') {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Type Error',
          message: 'Invalid data type provided',
          details: exception.message,
        };
      } else if (exception.name === 'RangeError') {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Range Error',
          message: 'Value out of valid range',
          details: exception.message,
        };
      } else if (exception.name === 'ValidationError') {
        myResponseObj.statusCode = HttpStatus.BAD_REQUEST;
        myResponseObj.response = {
          error: 'Validation Error',
          message: 'Data validation failed',
          details: exception.message,
        };
      } else {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        myResponseObj.response = {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'prod' ? 'Internal server error' : exception.message,
        };
      }
    } else {
      myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      myResponseObj.response = {
        error: 'Unknown Error',
        message: 'An unknown error occurred',
        details: process.env.NODE_ENV === 'prod' ? 'Internal server error' : String(exception),
      };
    }
    response.status(myResponseObj.statusCode).json(myResponseObj);
    this.logger.error(myResponseObj.response, AllExceptionsFilter.name);
    super.catch(exception, host);
  }

  private extractDuplicateKeyInfo(error: MongoServerError): string {
    if (error.keyValue) {
      const keys = Object.keys(error.keyValue);
      const values = Object.values(error.keyValue);
      return `Duplicate value for field(s): ${keys.map((key, index) => `${key}=${values[index]}`).join(', ')}`;
    }
    return 'Duplicate key constraint violation';
  }

  private formatValidationErrors(error: MongooseError.ValidationError): object {
    const errors = {};
    for (const field in error.errors) {
      errors[field] = {
        message: error.errors[field].message,
        value: this.sanitizeErrorValue(error.errors[field].value),
        kind: error.errors[field].kind,
      };
    }
    return errors;
  }

  private isRedisError(error: Error): boolean {
    return (
      error.name === 'ReplyError' ||
      error.name === 'AbortError' ||
      error.name === 'ParserError' ||
      error.name === 'RedisError' ||
      error.message?.includes('Redis') ||
      error.message?.includes('redis') ||
      error.message?.includes('cache')
    );
  }

  private formatRedisConnectionError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      type: 'Redis Connection Error',
      timestamp: new Date().toISOString(),
      suggestion: 'Check if Redis server is running and accessible',
    };
  }

  private formatRedisStorageError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      type: 'Redis Storage Error',
      timestamp: new Date().toISOString(),
      suggestion: 'Check Redis memory configuration and available storage',
    };
  }

  private formatRedisParserError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      type: 'Redis Parser Error',
      timestamp: new Date().toISOString(),
      suggestion: 'Check Redis data format and encoding',
    };
  }

  private formatRedisReplyError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      type: 'Redis Reply Error',
      timestamp: new Date().toISOString(),
      suggestion: 'Check if the Redis command is valid and supported',
    };
  }

  private formatRedisError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      type: 'Redis Error',
      timestamp: new Date().toISOString(),
    };
  }

  private sanitizeErrorValue(value: any): any {
    if (process.env.NODE_ENV === 'prod') {
      // In production, don't expose sensitive values
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      if (typeof value === 'object' && value !== null) {
        return '[Object]';
      }
    }
    return value;
  }
}
