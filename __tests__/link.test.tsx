import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

describe('link tags', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('combines link tags from nested components', () => {
    const DeepestNestedLink = () => (
      <>
        <Head>
          <link rel="canonical" href="http://localhost/head" />
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Head>
        <Head>
          <link rel="canonical" href="http://localhost/head/innercomponent" />
          <link href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedLink />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toMatchInlineSnapshot(
        `"<link data-ht="true" rel="canonical" href="http://localhost/head"/><link data-ht="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/><link data-ht="true" href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all"/>"`
      );
      expect(head.link.toElements()).toMatchInlineSnapshot(`
        [
          <link
            data-ht={true}
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/style.css"
            media="all"
            rel="stylesheet"
            type="text/css"
          />,
          <link
            data-ht={true}
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/inner.css"
            media="all"
            rel="stylesheet"
            type="text/css"
          />,
        ]
      `);
    });

    it('client', () => {
      renderClient(<DeepestNestedLink />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');

      expect(tagNodes).toMatchInlineSnapshot(`
        NodeList [
          <link
            data-ht="true"
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/style.css"
            media="all"
            rel="stylesheet"
            type="text/css"
          />,
          <link
            data-ht="true"
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/inner.css"
            media="all"
            rel="stylesheet"
            type="text/css"
          />,
        ]
      `);
    });
  });

  describe('allows duplicate link tags if specified in the same component', () => {
    const DuplicateTagsSameComponent = () => (
      <Head>
        <link rel="canonical" href="http://localhost/head" />
        <link rel="canonical" href="http://localhost/head/component" />
      </Head>
    );

    it('server', () => {
      renderServer(<DuplicateTagsSameComponent />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head"/><link data-ht="true" rel="canonical" href="http://localhost/head/component"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head"/><link data-ht="true" rel="canonical" href="http://localhost/head/component"/>'
      );
    });

    it('client', () => {
      renderClient(<DuplicateTagsSameComponent />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/head');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head" data-ht="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/head/component');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head/component" data-ht="true">'
      );
    });
  });

  describe('combines duplicate link tags with a single link tag in a nested component', () => {
    const DuplicateTagsSingleNested = () => (
      <>
        <Head>
          <link rel="canonical" href="http://localhost/head" />
          <link rel="canonical" href="http://localhost/head/component" />
        </Head>
        <Head>
          <link rel="canonical" href="http://localhost/head/innercomponent" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<DuplicateTagsSingleNested />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toMatchInlineSnapshot(
        `"<link data-ht="true" rel="canonical" href="http://localhost/head"/><link data-ht="true" rel="canonical" href="http://localhost/head/component"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>"`
      );
      expect(head.link.toElements()).toMatchInlineSnapshot(`
        [
          <link
            data-ht={true}
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/head/component"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
        ]
      `);
    });

    it('client', () => {
      renderClient(<DuplicateTagsSingleNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');

      expect(tagNodes).toMatchInlineSnapshot(`
        NodeList [
          <link
            data-ht="true"
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/head/component"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
        ]
      `);
    });
  });

  describe('combines single link tag with duplicate link tags in a nested component', () => {
    const SingleTagDuplicatedNested = () => (
      <>
        <Head>
          <link rel="canonical" href="http://localhost/head" />
        </Head>
        <Head>
          <link rel="canonical" href="http://localhost/head/component" />
          <link rel="canonical" href="http://localhost/head/innercomponent" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<SingleTagDuplicatedNested />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toMatchInlineSnapshot(
        `"<link data-ht="true" rel="canonical" href="http://localhost/head"/><link data-ht="true" rel="canonical" href="http://localhost/head/component"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>"`
      );
      expect(head.link.toElements()).toMatchInlineSnapshot(`
        [
          <link
            data-ht={true}
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/head/component"
            rel="canonical"
          />,
          <link
            data-ht={true}
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
        ]
      `);
    });

    it('client', () => {
      renderClient(<SingleTagDuplicatedNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');

      expect(tagNodes).toMatchInlineSnapshot(`
        NodeList [
          <link
            data-ht="true"
            href="http://localhost/head"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/head/component"
            rel="canonical"
          />,
          <link
            data-ht="true"
            href="http://localhost/head/innercomponent"
            rel="canonical"
          />,
        ]
      `);
    });
  });
});
