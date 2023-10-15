import { HelmetProps, reducePropsToState } from '../state';
import { HelmetCache } from '../cache';
import { handleStateChange } from './client-output';

export interface HelmetClientCacheOptions {
  sync?: boolean;
}

export class HelmetClientCache implements HelmetCache {
  #instances = new Map<unknown, HelmetProps>();

  #sync: boolean;

  constructor(options?: HelmetClientCacheOptions) {
    this.#sync = options?.sync ?? false;
  }

  update(instance: unknown, props: HelmetProps): void {
    this.#instances.set(instance, props);
    this.#emit();
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
    this.#emit();
  }

  #emit(): void {
    const propsList = [...this.#instances.values()];
    const state = reducePropsToState(propsList);

    handleStateChange(state, this.#sync);
  }
}
