import { HelmetProps, reducePropsToState } from '../state';
import { HelmetCache } from '../cache';
import { handleStateChangeOnClient } from './client-output';

export class HelmetClientCache implements HelmetCache {
  #instances = new Map<unknown, HelmetProps>();

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

    handleStateChangeOnClient(state);
  }
}
