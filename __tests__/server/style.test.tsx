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

const isArray = {
  asymmetricMatch: actual => Array.isArray(actual),
};

describe('server', () => {
  describe('Declarative API', () => {
    it('renders style tags as React components', () => {
      const context = {};
      render(
        <Helmet>
          <style type="text/css">{`body {background-color: green;}`}</style>
          <style type="text/css">{`p {font-size: 12px;}`}</style>
        </Helmet>,
        context
      );

      const head = context.helmet;

      expect(head.style).toBeDefined();
      expect(head.style.toComponent).toBeDefined();

      const styleComponent = head.style.toComponent();

      expect(styleComponent).toEqual(isArray);
      expect(styleComponent).toHaveLength(2);

      const markup = ReactServer.renderToStaticMarkup(styleComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<style data-rh=\\"true\\" type=\\"text/css\\">body {background-color: green;}</style><style data-rh=\\"true\\" type=\\"text/css\\">p {font-size: 12px;}</style>"`
      );
    });

    it('renders style tags as string', () => {
      const context = {};
      render(
        <Helmet>
          <style type="text/css">{`body {background-color: green;}`}</style>
          <style type="text/css">{`p {font-size: 12px;}`}</style>
        </Helmet>,
        context
      );

      const head = context.helmet;

      expect(head.style).toBeDefined();
      expect(head.style.toString).toBeDefined();
      expect(head.style.toString()).toMatchInlineSnapshot(
        `"<style data-rh=\\"true\\" type=\\"text/css\\">body {background-color: green;}</style><style data-rh=\\"true\\" type=\\"text/css\\">p {font-size: 12px;}</style>"`
      );
    });
  });
});
