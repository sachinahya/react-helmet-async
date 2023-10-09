import React, { FC, ReactNode } from 'react';
import { HelmetStateClient } from './HelmetState';

export const Context = React.createContext<HelmetStateClient>({} as HelmetStateClient);

export interface HelmetProviderProps {
  state: HelmetStateClient;
  children?: ReactNode;
}

export const HelmetProvider: FC<HelmetProviderProps> = ({ state, children }) => {
  return <Context.Provider value={state}>{children}</Context.Provider>;
};
