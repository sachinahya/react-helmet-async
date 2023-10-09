import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerState } from '../../src/server';

Helmet.defaultProps.defer = false;

const isArray = {
  asymmetricMatch: (actual: any) => Array.isArray(actual),
};

describe('server', () => {
  describe('Declarative API', () => {
    it('renders link tags as React components', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <link href="http://localhost/helmet" rel="canonical" />
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.link).toBeDefined();
      expect(head.link.toComponent).toBeDefined();

      const linkComponent = head.link.toComponent();

      expect(linkComponent).toEqual(isArray);
      expect(linkComponent).toHaveLength(2);

      linkComponent.forEach(link => {
        expect(link).toEqual(expect.objectContaining({ type: 'link' }));
      });

      const markup = ReactServer.renderToStaticMarkup(linkComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<link data-rh=\\"true\\" href=\\"http://localhost/helmet\\" rel=\\"canonical\\"/><link data-rh=\\"true\\" href=\\"http://localhost/style.css\\" rel=\\"stylesheet\\" type=\\"text/css\\"/>"`
      );
    });

    it('renders link tags as string', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <link href="http://localhost/helmet" rel="canonical" />
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.link).toBeDefined();
      expect(head.link.toString).toBeDefined();
      expect(head.link.toString()).toMatchInlineSnapshot(
        `"<link data-rh=\\"true\\" href=\\"http://localhost/helmet\\" rel=\\"canonical\\"/><link data-rh=\\"true\\" href=\\"http://localhost/style.css\\" rel=\\"stylesheet\\" type=\\"text/css\\"/>"`
      );
    });
  });
});
