import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;

    const now = Date.now();
    console.log(`\n--- Request ---\n`);
    console.log(`[${method}]\t${url}`);
    console.log(`Payload:`, body);

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        console.log(`Response (${delay}ms)`);
        console.log(`\n--- Response Sent ---\n`);
      }),
    );
  }
}
