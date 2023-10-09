import React, { FC, ReactNode } from 'react';
import { HelmetCache } from './cache';

export const Context = React.createContext<HelmetCache>({} as HelmetCache);

export interface HelmetProviderProps {
  state: HelmetCache;
  children?: ReactNode;
}

export const HelmetProvider: FC<HelmetProviderProps> = ({ state, children }) => {
  return <Context.Provider value={state}>{children}</Context.Provider>;
};
