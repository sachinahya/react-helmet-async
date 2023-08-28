import React, { Component, ReactNode } from 'react';
import HelmetData, { HelmetDataContext } from './HelmetData';
import Dispatcher from './Dispatcher';

const defaultValue = {};

export interface HelmetInstancesMutation {
  get: () => Dispatcher[];
  add: (instance: Dispatcher) => void;
  remove: (instance: Dispatcher) => void;
}

export interface HelmetContext {
  setHelmet: (...args: any[]) => any;
  helmetInstances: HelmetInstancesMutation;
}

export const Context = React.createContext<HelmetContext>(defaultValue as HelmetContext);

const canUseDOM = typeof document !== 'undefined';

export interface ProviderProps {
  children?: ReactNode;
  context: HelmetDataContext;
}

export default class Provider extends Component<ProviderProps> {
  static canUseDOM = canUseDOM;

  helmetData: HelmetData;

  constructor(props: ProviderProps) {
    super(props);

    this.helmetData = new HelmetData(this.props.context, Provider.canUseDOM);
  }

  render() {
    return <Context.Provider value={this.helmetData.value}>{this.props.children}</Context.Provider>;
  }
}
