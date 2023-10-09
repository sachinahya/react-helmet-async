import React, { ReactNode, StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from '../../src/Provider';
import { HelmetClientCache } from '../../src/client/client-cache';

const state = new HelmetClientCache();

export const renderClient = (node: ReactNode): void => {
  const mount = document.getElementById('mount');

  ReactDOM.render(
    <StrictMode>
      <HelmetProvider state={state}>{node}</HelmetProvider>
    </StrictMode>,
    mount
  );
};
