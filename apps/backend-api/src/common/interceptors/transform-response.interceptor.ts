import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@spm/shared-types';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((resData) => {
        // If data is already formatted with message and data:
        if (resData && typeof resData === 'object' && 'data' in resData && 'message' in resData) {
          return {
            status: 'success',
            message: resData.message || 'Thao tác thành công',
            data: resData.data,
            meta: resData.meta,
          };
        }

        return {
          status: 'success',
          message: 'Thao tác thành công',
          data: resData,
        };
      }),
    );
  }
}
