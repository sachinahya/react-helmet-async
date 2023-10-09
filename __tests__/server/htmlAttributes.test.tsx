import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerState } from '../../src/server';

Helmet.defaultProps.defer = false;

describe('server', () => {
  describe('Declarative API', () => {
    it('renders html attributes as component', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <html lang="ga" className="myClassName" />
        </Helmet>,
        state
      );

      const { htmlAttributes } = state.getOutput();
      const attrs = htmlAttributes.toComponent();

      expect(attrs).toBeDefined();

      const markup = ReactServer.renderToStaticMarkup(<html lang="en" {...attrs} />);

      expect(markup).toMatchInlineSnapshot(`"<html lang=\\"ga\\" class=\\"myClassName\\"></html>"`);
    });

    it('renders html attributes as string', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <html lang="ga" className="myClassName" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.htmlAttributes).toBeDefined();
      expect(head.htmlAttributes.toString).toBeDefined();
      expect(head.htmlAttributes.toString()).toMatchInlineSnapshot(
        `"lang=\\"ga\\" class=\\"myClassName\\""`
      );
    });
  });
});
