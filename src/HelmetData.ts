import mapStateOnServer from './server';

const instances = [];

export function clearInstances() {
  instances.length = 0;
}

export interface HelmetDataValue {
  setHelmet: (serverState: any) => void;
  helmetInstances: {
    get: () => any[];
    add: (instance: any) => void;
    remove: (instance: any) => void;
  };
}

export default class HelmetData {
  context: any;

  canUseDOM: boolean;

  instances: any[] = [];

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

  constructor(context: any, canUseDOM = typeof document !== 'undefined') {
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
