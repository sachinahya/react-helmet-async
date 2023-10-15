import { FC, ReactNode, createContext } from 'react';
import { HeadCache } from './cache';

export const HeadContext = createContext<HeadCache | undefined>(undefined);

export interface HeadProviderProps {
  state: HeadCache;
  children?: ReactNode;
}

export const HeadProvider: FC<HeadProviderProps> = ({ state, children }) => {
  return <HeadContext.Provider value={state}>{children}</HeadContext.Provider>;
};
