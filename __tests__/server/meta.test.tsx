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
    it('renders meta tags as React components', () => {
      const state = new HelmetServerCache();

      renderServer(
        <Helmet>
          <meta charSet="utf-8" />
          <meta
            name="description"
            content={'Test description & encoding of special characters like \' " > < `'}
          />
          <meta httpEquiv="content-type" content="text/html" />
          <meta property="og:type" content="article" />
          <meta itemProp="name" content="Test name itemprop" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.meta).toBeDefined();
      expect(head.meta.toElements).toBeDefined();

      const metaComponent = head.meta.toElements();

      expect(metaComponent).toEqual(isArray);
      expect(metaComponent).toHaveLength(5);

      metaComponent.forEach(meta => {
        expect(meta).toEqual(expect.objectContaining({ type: 'meta' }));
      });

      const markup = ReactServer.renderToStaticMarkup(metaComponent);

      expect(markup).toMatchInlineSnapshot(
        `"<meta data-rh="true" charSet="utf-8"/><meta data-rh="true" name="description" content="Test description &amp; encoding of special characters like &#x27; &quot; &gt; &lt; \`"/><meta data-rh="true" http-equiv="content-type" content="text/html"/><meta data-rh="true" property="og:type" content="article"/><meta data-rh="true" itemProp="name" content="Test name itemprop"/>"`
      );
    });

    it('renders meta tags as string', () => {
      const state = new HelmetServerCache();

      renderServer(
        <Helmet>
          <meta charSet="utf-8" />
          <meta
            name="description"
            content='Test description &amp; encoding of special characters like &#x27; " &gt; &lt; `'
          />
          <meta httpEquiv="content-type" content="text/html" />
          <meta property="og:type" content="article" />
          <meta itemProp="name" content="Test name itemprop" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.meta).toBeDefined();
      expect(head.meta.toString).toBeDefined();
      expect(head.meta.toString()).toMatchInlineSnapshot(
        `"<meta data-rh="true" charset="utf-8"/><meta data-rh="true" name="description" content="Test description &amp; encoding of special characters like &#x27; &quot; &gt; &lt; \`"/><meta data-rh="true" http-equiv="content-type" content="text/html"/><meta data-rh="true" property="og:type" content="article"/><meta data-rh="true" itemprop="name" content="Test name itemprop"/>"`
      );
    });
  });
});
