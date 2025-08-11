import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, body } = request;

    const now = Date.now();
    console.log(`\n--- Request ---\n`);
    console.log(`[${method}]\t${url}`);
    console.log(
      `Query:`,
      JSON.parse(
        JSON.stringify(query, Object.getOwnPropertyNames(query))
      )
    );
    console.log(`Payload:`, body);

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        console.log(`Response sent after (${delay}ms)`);
        console.log(`\n--- Response Sent ---\n`);
      }),
      catchError((err) => {
        const delay = Date.now() - now;
        console.log(`Error thrown after (${delay}ms)`);
        console.log(`\n--- Error Response Sent ---\n`);
        return throwError(() => err);
      }),
    );
  }
}
