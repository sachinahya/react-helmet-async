import { PureComponent } from 'react';
import { handleStateChangeOnClient } from './client';
import mapStateOnServer from './server';
import { reducePropsToState } from './state';
import Provider from './Provider';
import { HelmetDataValue } from './HelmetData';
import { HelmetProps } from './Helmet';

export interface DispatcherProps extends HelmetProps {
  context: HelmetDataValue;
}

export default class Dispatcher extends PureComponent<DispatcherProps> {
  static displayName = 'HelmetDispatcher';

  rendered = false;

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

  override render() {
    if (this.rendered) {
      return null;
    }

    this.rendered = true;

    const { helmetInstances } = this.props.context;
    helmetInstances.add(this);
    this.emitChange();

    return null;
  }
}
