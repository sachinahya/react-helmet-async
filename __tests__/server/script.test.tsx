import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerState } from '../../src/server';

Helmet.defaultProps.defer = false;

const isArray = {
  asymmetricMatch: actual => Array.isArray(actual),
};

describe('server', () => {
  describe('Declarative API', () => {
    it('renders script tags as React components', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <script src="http://localhost/test.js" type="text/javascript" />
          <script src="http://localhost/test2.js" type="text/javascript" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.script).toBeDefined();
      expect(head.script.toComponent).toBeDefined();

      const scriptComponent = head.script.toComponent();

      expect(scriptComponent).toEqual(isArray);
      expect(scriptComponent).toHaveLength(2);

      scriptComponent.forEach(script => {
        expect(script).toEqual(expect.objectContaining({ type: 'script' }));
      });

      const markup = ReactServer.renderToStaticMarkup(scriptComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<script data-rh=\\"true\\" src=\\"http://localhost/test.js\\" type=\\"text/javascript\\"></script><script data-rh=\\"true\\" src=\\"http://localhost/test2.js\\" type=\\"text/javascript\\"></script>"`
      );
    });

    it('renders script tags as string', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <script src="http://localhost/test.js" type="text/javascript" />
          <script src="http://localhost/test2.js" type="text/javascript" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.script).toBeDefined();
      expect(head.script.toString).toBeDefined();
      expect(head.script.toString()).toMatchInlineSnapshot(
        `"<script data-rh=\\"true\\" src=\\"http://localhost/test.js\\" type=\\"text/javascript\\"></script><script data-rh=\\"true\\" src=\\"http://localhost/test2.js\\" type=\\"text/javascript\\"></script>"`
      );
    });
  });
});
