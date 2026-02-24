import { ClassConstructor } from 'class-transformer';

export type AppSerializeConstructor<T = unknown> = ClassConstructor<T>;
