import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map(
        (data: T): StandardResponse<T> => ({
          success: true,
          message: 'successful',
          data,
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }
}
