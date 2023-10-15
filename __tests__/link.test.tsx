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

  describe("tags 'rel' and 'href' properly use 'rel' as the primary identification for this tag, regardless of ordering", () => {
    const RelHrefAttributeIdentification = () => (
      <>
        <Head>
          <link href="http://localhost/head" rel="canonical" />
        </Head>
        <Head>
          <link rel="canonical" href="http://localhost/head/new" />
        </Head>
        <Head>
          <link href="http://localhost/head/newest" rel="canonical" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<RelHrefAttributeIdentification />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-ht="true" href="http://localhost/head/newest" rel="canonical"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" href="http://localhost/head/newest" rel="canonical"/>'
      );
    });

    it('client', () => {
      renderClient(<RelHrefAttributeIdentification />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];

      expect(tagNodes).toHaveLength(1);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/head/newest');
      expect(firstTag?.outerHTML).toBe(
        '<link href="http://localhost/head/newest" rel="canonical" data-ht="true">'
      );
    });
  });

  describe("tags with rel='stylesheet' uses the href as the primary identification of the tag, regardless of ordering", () => {
    const RelStylesheetIdentification = () => (
      <>
        <Head>
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Head>
        <Head>
          <link rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<RelStylesheetIdentification />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-ht="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-ht="true" rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-ht="true" rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all"/>'
      );
    });

    it('client', () => {
      renderClient(<RelStylesheetIdentification />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('href')).toBe('http://localhost/style.css');
      expect(firstTag?.getAttribute('rel')).toBe('stylesheet');
      expect(firstTag?.getAttribute('type')).toBe('text/css');
      expect(firstTag?.getAttribute('media')).toBe('all');
      expect(firstTag?.outerHTML).toBe(
        '<link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" data-ht="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('stylesheet');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/inner.css');
      expect(secondTag?.getAttribute('type')).toBe('text/css');
      expect(secondTag?.getAttribute('media')).toBe('all');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all" data-ht="true">'
      );
    });
  });

  describe('sets link tags based on deepest nested component', () => {
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

      expect(head.link.toString()).toBe(
        '<link data-ht="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/><link data-ht="true" href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/><link data-ht="true" href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all"/>'
      );
    });

    it('client', () => {
      renderClient(<DeepestNestedLink />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];
      const thirdTag = tagNodes[2];

      expect(tagNodes).toHaveLength(3);

      expect(firstTag?.getAttribute('href')).toBe('http://localhost/style.css');
      expect(firstTag?.getAttribute('rel')).toBe('stylesheet');
      expect(firstTag?.getAttribute('type')).toBe('text/css');
      expect(firstTag?.getAttribute('media')).toBe('all');
      expect(firstTag?.outerHTML).toBe(
        '<link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" data-ht="true">'
      );

      expect(secondTag?.getAttribute('href')).toBe('http://localhost/head/innercomponent');
      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head/innercomponent" data-ht="true">'
      );

      expect(thirdTag?.getAttribute('href')).toBe('http://localhost/inner.css');
      expect(thirdTag?.getAttribute('rel')).toBe('stylesheet');
      expect(thirdTag?.getAttribute('type')).toBe('text/css');
      expect(thirdTag?.getAttribute('media')).toBe('all');
      expect(thirdTag?.outerHTML).toBe(
        '<link href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all" data-ht="true">'
      );
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

  describe('overrides duplicate link tags with a single link tag in a nested component', () => {
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

      expect(head.link.toString()).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>'
      );
    });

    it('client', () => {
      renderClient(<DuplicateTagsSingleNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];

      expect(tagNodes).toHaveLength(1);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/head/innercomponent');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head/innercomponent" data-ht="true">'
      );
    });
  });

  describe('overrides single link tag with duplicate link tags in a nested component', () => {
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

      expect(head.link.toString()).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head/component"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-ht="true" rel="canonical" href="http://localhost/head/component"/><link data-ht="true" rel="canonical" href="http://localhost/head/innercomponent"/>'
      );
    });

    it('client', () => {
      renderClient(<SingleTagDuplicatedNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/head/component');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head/component" data-ht="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/head/innercomponent');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/head/innercomponent" data-ht="true">'
      );
    });
  });
});
