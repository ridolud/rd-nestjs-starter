import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { IResponse } from 'src/utils/interfaces/response.interface';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, IResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const res: Response = context.switchToHttp().getResponse();
        // Logger.debug(this.getMessage(data), res.req.url);

        // file stream.
        if (res.getHeader('Content-Type') == 'text/csv; charset=utf-8')
          return data;

        // data include type of bigint, change to number.
        this.changeBigIntToNumber(data);

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: this.getMessage(data),
          data: data,
        };
      }),
    );
  }

  private getMessage(data: any) {
    return data?.message || 'success';
  }

  /**
   * change any type of bigint to number
   * @param obj
   */
  private changeBigIntToNumber(obj: any) {
    for (var prop in obj) {
      if (typeof obj[prop] === 'bigint') {
        obj[prop] = Number(obj[prop]);
      } else if (typeof obj[prop] === 'object') {
        if (Array.isArray(obj[prop])) {
          for (var i = 0; i < obj[prop].length; i++) {
            this.changeBigIntToNumber(obj[prop][i]);
          }
        } else {
          this.changeBigIntToNumber(obj[prop]);
        }
      }
    }
  }
}
