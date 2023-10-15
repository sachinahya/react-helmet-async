import { HelmetProps, reducePropsToState } from '../state';
import { prioritiseState } from '../seo';
import { HelmetCache } from '../cache';
import { HelmetServerOutput, getServerOutput } from './server-output';

export interface HelmetServerCacheOptions {
  prioritiseSeoTags?: boolean;
}

export class HelmetServerCache implements HelmetCache {
  #instances = new Map<unknown, HelmetProps>();

  #prioritiseSeoTags: boolean;

  constructor(options?: HelmetServerCacheOptions) {
    this.#prioritiseSeoTags = options?.prioritiseSeoTags ?? false;
  }

  getOutput(): HelmetServerOutput {
    const propsList = [...this.#instances.values()];
    const state = reducePropsToState(propsList);
    const prioritisedState = this.#prioritiseSeoTags ? prioritiseState(state) : state;

    return getServerOutput(prioritisedState);
  }

  update(instance: unknown, props: HelmetProps): void {
    this.#instances.set(instance, props);
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
  }
}
