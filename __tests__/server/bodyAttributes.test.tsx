import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerState } from '../../src/server';

Helmet.defaultProps.defer = false;

describe('server', () => {
  describe('Declarative API', () => {
    it('renders body attributes as component', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <body lang="ga" className="myClassName" />
        </Helmet>,
        state
      );

      const { bodyAttributes } = state.getOutput();
      const attrs = bodyAttributes.toComponent();

      expect(attrs).toBeDefined();

      const markup = ReactServer.renderToStaticMarkup(<body lang="en" {...attrs} />);

      expect(markup).toMatchInlineSnapshot(`"<body lang=\\"ga\\" class=\\"myClassName\\"></body>"`);
    });

    it('renders body attributes as string', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <body lang="ga" className="myClassName" />
        </Helmet>,
        state
      );

      const body = state.getOutput();

      expect(body.bodyAttributes).toBeDefined();
      expect(body.bodyAttributes.toString).toBeDefined();
      expect(body.bodyAttributes.toString()).toMatchInlineSnapshot(
        `"lang=\\"ga\\" class=\\"myClassName\\""`
      );
    });
  });
});
