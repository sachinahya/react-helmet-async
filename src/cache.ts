import { HeadProps } from './state';

export interface HeadCache {
  update(instance: unknown, props: HeadProps): void;
  remove(instance: unknown): void;
}
