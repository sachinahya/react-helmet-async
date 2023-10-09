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
    it('renders style tags as React components', () => {
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <style type="text/css">{`body {background-color: green;}`}</style>
          <style type="text/css">{`p {font-size: 12px;}`}</style>
        </Helmet>,
        state
      );

      const head = state.getOutput();

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
      const state = new HelmetServerState();

      renderServer(
        <Helmet>
          <style type="text/css">{`body {background-color: green;}`}</style>
          <style type="text/css">{`p {font-size: 12px;}`}</style>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.style).toBeDefined();
      expect(head.style.toString).toBeDefined();
      expect(head.style.toString()).toMatchInlineSnapshot(
        `"<style data-rh=\\"true\\" type=\\"text/css\\">body {background-color: green;}</style><style data-rh=\\"true\\" type=\\"text/css\\">p {font-size: 12px;}</style>"`
      );
    });
  });
});
