import { HTMLAttributes, ReactElement } from 'react';
import Dispatcher from './Dispatcher';
import mapStateOnServer from './server';

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

const instances: Dispatcher[] = [];

export function clearInstances() {
  instances.length = 0;
}

export interface HelmetDataValue {
  setHelmet: (serverState: HelmetServerState) => void;
  helmetInstances: {
    get: () => Dispatcher[];
    add: (instance: Dispatcher) => void;
    remove: (instance: Dispatcher) => void;
  };
}

export default class HelmetData {
  context: FilledContext;

  canUseDOM: boolean;

  instances: Dispatcher[] = [];

  value: HelmetDataValue = {
    setHelmet: serverState => {
      this.context.helmet = serverState;
    },
    helmetInstances: {
      get: () => (this.canUseDOM ? instances : this.instances),
      add: instance => {
        (this.canUseDOM ? instances : this.instances).push(instance);
      },
      remove: instance => {
        const index = (this.canUseDOM ? instances : this.instances).indexOf(instance);
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
