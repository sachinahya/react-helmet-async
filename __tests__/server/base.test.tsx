import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerCache } from '../../src/server/server-cache';

Helmet.defaultProps.defer = false;

const isArray = {
  asymmetricMatch: (actual: any) => Array.isArray(actual),
};

describe('server', () => {
  describe('Declarative API', () => {
    it('renders base tag as React component', () => {
      const state = new HelmetServerCache();

      renderServer(
        <Helmet>
          <base target="_blank" href="http://localhost/" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.base).toBeDefined();
      expect(head.base.toElements).toBeDefined();

      const baseComponent = head.base.toElements();

      expect(baseComponent).toEqual(isArray);
      expect(baseComponent).toHaveLength(1);

      baseComponent.forEach(base => {
        expect(base).toEqual(expect.objectContaining({ type: 'base' }));
      });

      const markup = ReactServer.renderToStaticMarkup(baseComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<base data-rh=\\"true\\" target=\\"_blank\\" href=\\"http://localhost/\\"/>"`
      );
    });

    it('renders base tags as string', () => {
      const state = new HelmetServerCache();

      renderServer(
        <Helmet>
          <base target="_blank" href="http://localhost/" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.base).toBeDefined();
      expect(head.base.toString).toBeDefined();
      expect(head.base.toString()).toMatchInlineSnapshot(
        `"<base data-rh=\\"true\\" target=\\"_blank\\" href=\\"http://localhost/\\"/>"`
      );
    });
  });
});
