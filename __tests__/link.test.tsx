import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { HelmetServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

describe('link tags', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache({ sync: true });
  });

  describe("tags 'rel' and 'href' properly use 'rel' as the primary identification for this tag, regardless of ordering", () => {
    const RelHrefAttributeIdentification = () => (
      <>
        <Helmet>
          <link href="http://localhost/helmet" rel="canonical" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/new" />
        </Helmet>
        <Helmet>
          <link href="http://localhost/helmet/newest" rel="canonical" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<RelHrefAttributeIdentification />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" href="http://localhost/helmet/newest" rel="canonical"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" href="http://localhost/helmet/newest" rel="canonical"/>'
      );
    });

    it('client', () => {
      renderClient(<RelHrefAttributeIdentification />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];

      expect(tagNodes).toHaveLength(1);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/newest');
      expect(firstTag?.outerHTML).toBe(
        '<link href="http://localhost/helmet/newest" rel="canonical" data-rh="true">'
      );
    });
  });

  describe("tags with rel='stylesheet' uses the href as the primary identification of the tag, regardless of ordering", () => {
    const RelStylesheetIdentification = () => (
      <>
        <Helmet>
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
        <Helmet>
          <link rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<RelStylesheetIdentification />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-rh="true" rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-rh="true" rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all"/>'
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
        '<link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" data-rh="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('stylesheet');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/inner.css');
      expect(secondTag?.getAttribute('type')).toBe('text/css');
      expect(secondTag?.getAttribute('media')).toBe('all');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all" data-rh="true">'
      );
    });
  });

  describe('sets link tags based on deepest nested component', () => {
    const DeepestNestedLink = () => (
      <>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
          <link href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedLink />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/><link data-rh="true" href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/><link data-rh="true" href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all"/>'
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
        '<link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" data-rh="true">'
      );

      expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet/innercomponent" data-rh="true">'
      );

      expect(thirdTag?.getAttribute('href')).toBe('http://localhost/inner.css');
      expect(thirdTag?.getAttribute('rel')).toBe('stylesheet');
      expect(thirdTag?.getAttribute('type')).toBe('text/css');
      expect(thirdTag?.getAttribute('media')).toBe('all');
      expect(thirdTag?.outerHTML).toBe(
        '<link href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all" data-rh="true">'
      );
    });
  });

  describe('allows duplicate link tags if specified in the same component', () => {
    const DuplicateTagsSameComponent = () => (
      <Helmet>
        <link rel="canonical" href="http://localhost/helmet" />
        <link rel="canonical" href="http://localhost/helmet/component" />
      </Helmet>
    );

    it('server', () => {
      renderServer(<DuplicateTagsSameComponent />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/component"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/component"/>'
      );
    });

    it('client', () => {
      renderClient(<DuplicateTagsSameComponent />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet" data-rh="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/component');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet/component" data-rh="true">'
      );
    });
  });

  describe('overrides duplicate link tags with a single link tag in a nested component', () => {
    const DuplicateTagsSingleNested = () => (
      <>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
          <link rel="canonical" href="http://localhost/helmet/component" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<DuplicateTagsSingleNested />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/>'
      );
    });

    it('client', () => {
      renderClient(<DuplicateTagsSingleNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];

      expect(tagNodes).toHaveLength(1);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet/innercomponent" data-rh="true">'
      );
    });
  });

  describe('overrides single link tag with duplicate link tags in a nested component', () => {
    const SingleTagDuplicatedNested = () => (
      <>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/component" />
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<SingleTagDuplicatedNested />, serverCache);

      const head = serverCache.getOutput();

      expect(head.link.toString()).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet/component"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/>'
      );
      expect(renderResult(head.link.toElements())).toBe(
        '<link data-rh="true" rel="canonical" href="http://localhost/helmet/component"/><link data-rh="true" rel="canonical" href="http://localhost/helmet/innercomponent"/>'
      );
    });

    it('client', () => {
      renderClient(<SingleTagDuplicatedNested />, clientCache);

      const tagNodes = getInjectedElementsByTagName('link');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('rel')).toBe('canonical');
      expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/component');
      expect(firstTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet/component" data-rh="true">'
      );

      expect(secondTag?.getAttribute('rel')).toBe('canonical');
      expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
      expect(secondTag?.outerHTML).toBe(
        '<link rel="canonical" href="http://localhost/helmet/innercomponent" data-rh="true">'
      );
    });
  });
});
