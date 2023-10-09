import React, { ReactNode, StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from '../../src/Provider';
import { HelmetClientState } from '../../src/client';

const state = new HelmetClientState();

export const renderClient = (node: ReactNode): void => {
  const mount = document.getElementById('mount');

  ReactDOM.render(
    <StrictMode>
      <HelmetProvider state={state}>{node}</HelmetProvider>
    </StrictMode>,
    mount
  );
};
