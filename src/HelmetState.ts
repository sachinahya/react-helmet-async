import { HelmetProps } from './Helmet';

export function clearInstances() {
  //
}

export interface HelmetStateClient {
  update(instance: unknown, props: HelmetProps): void;
  remove(instance: unknown): void;
}
