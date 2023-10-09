import { HelmetProps, reducePropsToState } from '../state';
import { prioritiseState } from '../seo';
import { HelmetCache } from '../cache';
import { HelmetServerOutput, getServerOutput } from './server-output';

export class HelmetServerCache implements HelmetCache {
  #instances = new Map<unknown, HelmetProps>();

  getOutput(): HelmetServerOutput {
    const propsList = [...this.#instances.values()];
    const state = reducePropsToState(propsList);
    const prioritisedState = prioritiseState(state);
    return getServerOutput(prioritisedState);
  }

  update(instance: unknown, props: HelmetProps): void {
    this.#instances.set(instance, props);
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
  }
}
