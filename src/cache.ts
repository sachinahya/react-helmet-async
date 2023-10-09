import { HelmetProps } from './state';

export interface HelmetCache {
  update(instance: unknown, props: HelmetProps): void;
  remove(instance: unknown): void;
}
