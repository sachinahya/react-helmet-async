import { HeadProps, instancePropsToState } from '../state';
import { prioritiseState } from '../seo';
import { HeadCache } from '../cache';
import { HeadServerOutput, getServerOutput } from './server-output';

export interface HeadServerCacheOptions {
  prioritiseSeoTags?: boolean;
}

export class HeadServerCache implements HeadCache {
  #instances = new Map<unknown, HeadProps>();

  #prioritiseSeoTags: boolean;

  constructor(options?: HeadServerCacheOptions) {
    this.#prioritiseSeoTags = options?.prioritiseSeoTags ?? false;
  }

  getOutput(): HeadServerOutput {
    const propsList = [...this.#instances.values()];
    const state = instancePropsToState(propsList);
    const prioritisedState = this.#prioritiseSeoTags ? prioritiseState(state) : state;

    return getServerOutput(prioritisedState);
  }

  update(instance: unknown, props: HeadProps): void {
    this.#instances.set(instance, props);
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
  }
}
