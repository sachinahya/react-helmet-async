import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerCache } from '../../src/server/server-cache';

Helmet.defaultProps.defer = false;

describe('server', () => {
  describe('Declarative API', () => {
    it('renders body attributes as component', () => {
      const state = new HelmetServerCache();

      renderServer(
        <Helmet>
          <body lang="ga" className="myClassName" />
        </Helmet>,
        state
      );

      const { bodyAttributes } = state.getOutput();
      const attrs = bodyAttributes.toProps();

      expect(attrs).toBeDefined();

      const markup = ReactServer.renderToStaticMarkup(<body lang="en" {...attrs} />);

      expect(markup).toMatchInlineSnapshot(`"<body lang="ga" class="myClassName"></body>"`);
    });

    it('renders body attributes as string', () => {
      const state = new HelmetServerCache();

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
        `"lang="ga" class="myClassName""`
      );
    });
  });
});
