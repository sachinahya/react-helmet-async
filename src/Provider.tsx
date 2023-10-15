import { FC, ReactNode, createContext } from 'react';
import { HelmetCache } from './cache';

export const Context = createContext<HelmetCache | undefined>(undefined);

export interface HelmetProviderProps {
  state: HelmetCache;
  children?: ReactNode;
}

export const HelmetProvider: FC<HelmetProviderProps> = ({ state, children }) => {
  return <Context.Provider value={state}>{children}</Context.Provider>;
};
