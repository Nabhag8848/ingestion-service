import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { map } from 'rxjs';

export class AppSerializerInterceptor<T> implements NestInterceptor {
  constructor(private dto: ClassConstructor<T>) {}
  intercept(_context: ExecutionContext, handler: CallHandler) {
    //run something before a request is been handled by request handler

    return handler.handle().pipe(
      map((data: unknown) => {
        // run something before the response is sent out
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      })
    );
  }
}
