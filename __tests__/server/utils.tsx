import React, { ReactNode, StrictMode } from 'react';
import ReactDOM from 'react-dom';
import ReactServer from 'react-dom/server';
import { HelmetProvider } from '../../src/Provider';
import { HelmetState } from '../../src';

export const renderServer = (node: ReactNode, state: HelmetState): void => {
  ReactServer.renderToStaticMarkup(
    <StrictMode>
      <HelmetProvider state={state}>{node}</HelmetProvider>
    </StrictMode>
  );
};
