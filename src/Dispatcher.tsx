import { Component } from 'react';
import shallowEqual from 'shallowequal';
import handleStateChangeOnClient from './client';
import mapStateOnServer from './server';
import { reducePropsToState } from './utils';
import Provider, { HelmetContext } from './Provider';
import { HelmetProps } from './index';

export interface DispatcherProps extends HelmetProps {
  context: HelmetContext;
}

export default class Dispatcher extends Component<DispatcherProps> {
  rendered = false;

  shouldComponentUpdate(nextProps) {
    return !shallowEqual(nextProps, this.props);
  }

  componentDidUpdate() {
    this.emitChange();
  }

  componentWillUnmount() {
    const { helmetInstances } = this.props.context;
    helmetInstances.remove(this);
    this.emitChange();
  }

  emitChange() {
    const { helmetInstances, setHelmet } = this.props.context;
    let serverState = null;
    const propsList = helmetInstances.get().map(instance => {
      const props = { ...instance.props };
      delete props.context;
      return props;
    });
    const state = reducePropsToState(propsList);
    if (Provider.canUseDOM) {
      handleStateChangeOnClient(state);
    } else if (mapStateOnServer) {
      serverState = mapStateOnServer(state);
    }
    setHelmet(serverState);
  }

  // componentWillMount will be deprecated
  // for SSR, initialize on first render
  // constructor is also unsafe in StrictMode
  init() {
    if (this.rendered) {
      return;
    }

    this.rendered = true;

    const { helmetInstances } = this.props.context;
    helmetInstances.add(this);
    this.emitChange();
  }

  render() {
    this.init();

    return null;
  }
}
