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
    it('renders noscript tags as React components', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <noscript id="foo">{`<link rel="stylesheet" type="text/css" href="/style.css" />`}</noscript>
          <noscript id="bar">{`<link rel="stylesheet" type="text/css" href="/style2.css" />`}</noscript>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.noscript).toBeDefined();
      expect(head.noscript.toComponent).toBeDefined();

      const noscriptComponent = head.noscript.toComponent();

      expect(noscriptComponent).toEqual(isArray);
      expect(noscriptComponent).toHaveLength(2);

      noscriptComponent.forEach(noscript => {
        expect(noscript).toEqual(expect.objectContaining({ type: 'noscript' }));
      });

      const markup = ReactServer.renderToStaticMarkup(noscriptComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<noscript data-rh=\\"true\\" id=\\"foo\\"><link rel=\\"stylesheet\\" type=\\"text/css\\" href=\\"/style.css\\" /></noscript><noscript data-rh=\\"true\\" id=\\"bar\\"><link rel=\\"stylesheet\\" type=\\"text/css\\" href=\\"/style2.css\\" /></noscript>"`
      );
    });
  });
});
