import { UseInterceptors } from '@nestjs/common';
import { AppSerializeConstructor } from '@/app/@types/serialize-constructor';
import { AppSerializerInterceptor } from '@/app/interceptors/serialize.interceptor';

export function Serialize<T>(dto: AppSerializeConstructor<T>) {
  return UseInterceptors(new AppSerializerInterceptor<T>(dto));
}
