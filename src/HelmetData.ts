import { HTMLAttributes, ReactElement } from 'react';
import mapStateOnServer from './server';
import { Helmet, HelmetProps } from './Helmet';

export interface HelmetDatum {
  toString(): string;
  toComponent(): ReactElement[];
}

export interface HelmetAttributeDatum<T extends HTMLAttributes<HTMLElement>> {
  toString(): string;
  toComponent(): T;
}

export interface HelmetServerState {
  base: HelmetDatum;
  bodyAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLBodyElement>>;
  htmlAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLHtmlElement>>;
  link: HelmetDatum;
  meta: HelmetDatum;
  noscript: HelmetDatum;
  script: HelmetDatum;
  style: HelmetDatum;
  title: HelmetDatum;
  titleAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLTitleElement>>;
  priority: HelmetDatum;
}

export interface FilledContext {
  helmet: HelmetServerState;
}

const instances: [Helmet, HelmetProps][] = [];

export function clearInstances() {
  instances.length = 0;
}

interface HelmetInstances {
  get: () => [Helmet, HelmetProps][];
  add: (instance: Helmet, props: HelmetProps) => void;
  update: (instance: Helmet, props: HelmetProps) => void;
  remove: (instance: Helmet) => void;
}

export interface HelmetDataValue {
  setHelmet: (serverState: HelmetServerState) => void;
  helmetInstances: HelmetInstances;
}

export default class HelmetData {
  context: FilledContext;

  canUseDOM: boolean;

  instances: [Helmet, HelmetProps][] = [];

  value: HelmetDataValue = {
    setHelmet: serverState => {
      this.context.helmet = serverState;
    },
    helmetInstances: {
      get: () => (this.canUseDOM ? instances : this.instances),
      add: (instance, props) => {
        (this.canUseDOM ? instances : this.instances).push([instance, props]);
      },
      update: (instance, props) => {
        const int = this.canUseDOM ? instances : this.instances;

        const instanceToUpdate = int.find(i => i[0] === instance);

        if (instanceToUpdate) {
          instanceToUpdate[1] = props;
        }
      },
      remove: instance => {
        const index = (this.canUseDOM ? instances : this.instances).findIndex(
          i => i[0] === instance
        );
        (this.canUseDOM ? instances : this.instances).splice(index, 1);
      },
    },
  };

  constructor(context: FilledContext, canUseDOM = typeof document !== 'undefined') {
    this.context = context;
    this.canUseDOM = canUseDOM;

    if (!canUseDOM) {
      context.helmet = mapStateOnServer({
        baseTag: [],
        bodyAttributes: {},
        htmlAttributes: {},
        linkTags: [],
        metaTags: [],
        noscriptTags: [],
        scriptTags: [],
        styleTags: [],
        title: '',
        titleAttributes: {},
      });
    }
  }
}
