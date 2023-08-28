import Dispatcher from './Dispatcher';
import { HelmetContext } from './Provider';
import mapStateOnServer from './server';

const clientInstances: Dispatcher[] = [];

export function clearInstances() {
  clientInstances.length = 0;
}

export interface HelmetDataContext {
  helmet: any;
}

export default class HelmetData {
  instances: Dispatcher[] = [];

  value: HelmetContext = {
    setHelmet: serverState => {
      this.context.helmet = serverState;
    },
    helmetInstances: {
      get: () => (this.canUseDOM ? clientInstances : this.instances),
      add: instance => {
        (this.canUseDOM ? clientInstances : this.instances).push(instance);
      },
      remove: instance => {
        const index = (this.canUseDOM ? clientInstances : this.instances).indexOf(instance);
        (this.canUseDOM ? clientInstances : this.instances).splice(index, 1);
      },
    },
  };

  context: HelmetDataContext;
  canUseDOM: boolean;

  constructor(context: HelmetDataContext, canUseDOM = typeof document !== 'undefined') {
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
