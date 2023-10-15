import { HeadProps, instancePropsToState } from '../state';
import { HeadCache } from '../cache';
import { handleStateChange } from './client-output';

export interface HeadClientCacheOptions {
  sync?: boolean;
}

export class HeadClientCache implements HeadCache {
  #instances = new Map<unknown, HeadProps>();

  #sync: boolean;

  constructor(options?: HeadClientCacheOptions) {
    this.#sync = options?.sync ?? false;
  }

  update(instance: unknown, props: HeadProps): void {
    this.#instances.set(instance, props);
    this.#emit();
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
    this.#emit();
  }

  #emit(): void {
    const propsList = [...this.#instances.values()];
    const state = instancePropsToState(propsList);

    handleStateChange(state, this.#sync);
  }
}
