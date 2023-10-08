import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import Provider from '../../src/Provider';
import { render } from './utils';

Helmet.defaultProps.defer = false;

beforeAll(() => {
  Provider.canUseDOM = false;
});

afterAll(() => {
  Provider.canUseDOM = true;
});

describe('server', () => {
  describe('Declarative API', () => {
    it('renders html attributes as component', () => {
      const context = {};
      render(
        <Helmet>
          <html lang="ga" className="myClassName" />
        </Helmet>,
        context
      );

      const { htmlAttributes } = context.helmet;
      const attrs = htmlAttributes.toComponent();

      expect(attrs).toBeDefined();

      const markup = ReactServer.renderToStaticMarkup(<html lang="en" {...attrs} />);

      expect(markup).toMatchInlineSnapshot(`"<html lang=\\"ga\\" class=\\"myClassName\\"></html>"`);
    });

    it('renders html attributes as string', () => {
      const context = {};
      render(
        <Helmet>
          <html lang="ga" className="myClassName" />
        </Helmet>,
        context
      );

      const head = context.helmet;

      expect(head.htmlAttributes).toBeDefined();
      expect(head.htmlAttributes.toString).toBeDefined();
      expect(head.htmlAttributes.toString()).toMatchInlineSnapshot(
        `"lang=\\"ga\\" class=\\"myClassName\\""`
      );
    });
  });
});
