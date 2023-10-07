import React, { Component, ReactNode } from 'react';
import HelmetData, { HelmetDataValue } from './HelmetData';

export const Context = React.createContext<HelmetDataValue>({} as HelmetDataValue);

const canUseDOM = typeof document !== 'undefined';

export interface ProviderProps {
  context: any;
  children?: ReactNode;
}

export default class Provider extends Component<ProviderProps> {
  static canUseDOM = canUseDOM;

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
