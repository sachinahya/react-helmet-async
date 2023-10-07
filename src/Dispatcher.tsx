import { Component } from 'react';
import shallowEqual from 'shallowequal';
import { handleStateChangeOnClient } from './client';
import mapStateOnServer from './server';
import { reducePropsToState } from './utils';
import Provider, { providerShape } from './Provider';
import { HelmetDataValue, HelmetServerState } from './HelmetData';
import { HelmetProps } from './Helmet';

export interface DispatcherProps extends HelmetProps {
  context: HelmetDataValue;
}

export default class Dispatcher extends Component<DispatcherProps> {
  static propTypes = {
    context: providerShape.isRequired,
  };

  static displayName = 'HelmetDispatcher';

  rendered = false;

  override shouldComponentUpdate(nextProps: DispatcherProps) {
    return !shallowEqual(nextProps, this.props);
  }

  override componentDidUpdate() {
    this.emitChange();
  }

  override componentWillUnmount() {
    const { helmetInstances } = this.props.context;
    helmetInstances.remove(this);
    this.emitChange();
  }

  emitChange() {
    const { helmetInstances, setHelmet } = this.props.context;
    const propsList = helmetInstances.get().map(instance => {
      const { context, ...props } = instance.props;
      return props;
    });
    const state = reducePropsToState(propsList);
    if (Provider.canUseDOM) {
      handleStateChangeOnClient(state);
    } else if (mapStateOnServer) {
      const serverState = mapStateOnServer(state);
      setHelmet(serverState);
    }
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

  override render() {
    this.init();

    return null;
  }
}
