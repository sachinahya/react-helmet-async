import React, { Component, ReactNode } from 'react';
import PropTypes from 'prop-types';
import HelmetData, { HelmetDataValue } from './HelmetData';

export const Context = React.createContext<HelmetDataValue>({} as HelmetDataValue);

export const providerShape = PropTypes.shape({
  setHelmet: PropTypes.func,
  helmetInstances: PropTypes.shape({
    get: PropTypes.func,
    add: PropTypes.func,
    remove: PropTypes.func,
  }),
});

const canUseDOM = typeof document !== 'undefined';

export interface ProviderProps {
  context: any;
  children?: ReactNode;
}

export default class Provider extends Component<ProviderProps> {
  static canUseDOM = canUseDOM;

  static propTypes = {
    context: PropTypes.shape({
      helmet: PropTypes.shape(),
    }),
    children: PropTypes.node.isRequired,
  };

  static defaultProps = {
    context: {},
  };

  static displayName = 'HelmetProvider';

  helmetData: HelmetData;

  constructor(props: ProviderProps) {
    super(props);

    this.helmetData = new HelmetData(this.props.context, Provider.canUseDOM);
  }

  override render() {
    return <Context.Provider value={this.helmetData.value}>{this.props.children}</Context.Provider>;
  }
}
