import Dispatcher from './Dispatcher';
import mapStateOnServer from './server';

export interface HelmetDatum {
  toString(): string;
  toComponent(): React.Component<any>;
}

export interface HelmetHTMLBodyDatum {
  toString(): string;
  toComponent(): React.HTMLAttributes<HTMLBodyElement>;
}

export interface HelmetHTMLElementDatum {
  toString(): string;
  toComponent(): React.HTMLAttributes<HTMLHtmlElement>;
}

export interface HelmetServerState {
  base: HelmetDatum;
  bodyAttributes: HelmetHTMLBodyDatum;
  htmlAttributes: HelmetHTMLElementDatum;
  link: HelmetDatum;
  meta: HelmetDatum;
  noscript: HelmetDatum;
  script: HelmetDatum;
  style: HelmetDatum;
  title: HelmetDatum;
  titleAttributes: HelmetDatum;
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
  setHelmet: (serverState: HelmetServerState | null) => void;
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
        encodeSpecialCharacters: true,
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
