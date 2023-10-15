import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { HelmetServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

Helmet.defaultProps.defer = false;

describe('meta tags', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache();
  });

  describe('determine meta tags based on deepest nested component', () => {
    const DeepestNestedMeta = () => (
      <>
        <Helmet>
          <meta charSet="utf-8" />
          <meta name="description" content="Test description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
          <meta name="keywords" content="test,meta,tags" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedMeta />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-rh="true" charset="utf-8"/><meta data-rh="true" name="description" content="Inner description"/><meta data-rh="true" name="keywords" content="test,meta,tags"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-rh="true" charSet="utf-8"/><meta data-rh="true" name="description" content="Inner description"/><meta data-rh="true" name="keywords" content="test,meta,tags"/>'
      );
    });

    it('client', () => {
      renderClient(<DeepestNestedMeta />, clientCache);

      const tagNodes = getInjectedElementsByTagName('meta');

      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];
      const thirdTag = tagNodes[2];

      expect(tagNodes).toBeDefined();
      expect(tagNodes).toHaveLength(3);

      expect(firstTag?.getAttribute('charset')).toBe('utf-8');
      expect(firstTag?.outerHTML).toBe('<meta charset="utf-8" data-rh="true">');

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Inner description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Inner description" data-rh="true">'
      );

      expect(thirdTag?.getAttribute('name')).toBe('keywords');
      expect(thirdTag?.getAttribute('content')).toBe('test,meta,tags');
      expect(thirdTag?.outerHTML).toBe(
        '<meta name="keywords" content="test,meta,tags" data-rh="true">'
      );
    });
  });

  describe('allows duplicate meta tags if specified in the same component', () => {
    const MultipleMetaTags = () => (
      <Helmet>
        <meta name="description" content="Test description" />
        <meta name="description" content="Duplicate description" />
      </Helmet>
    );

    it('server', () => {
      renderServer(<MultipleMetaTags />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-rh="true" name="description" content="Test description"/><meta data-rh="true" name="description" content="Duplicate description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-rh="true" name="description" content="Test description"/><meta data-rh="true" name="description" content="Duplicate description"/>'
      );
    });

    it('client', () => {
      renderClient(<MultipleMetaTags />, clientCache);

      const tagNodes = getInjectedElementsByTagName('meta');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('name')).toBe('description');
      expect(firstTag?.getAttribute('content')).toBe('Test description');
      expect(firstTag?.outerHTML).toBe(
        '<meta name="description" content="Test description" data-rh="true">'
      );

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Duplicate description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Duplicate description" data-rh="true">'
      );
    });
  });

  describe('overrides duplicate meta tags with single meta tag in a nested component', () => {
    const MultipleNestedMetaOverride = () => (
      <>
        <Helmet>
          <meta name="description" content="Test description" />
          <meta name="description" content="Duplicate description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<MultipleNestedMetaOverride />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-rh="true" name="description" content="Inner description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-rh="true" name="description" content="Inner description"/>'
      );
    });

    it('client', () => {
      renderClient(<MultipleNestedMetaOverride />, clientCache);

      const tagNodes = getInjectedElementsByTagName('meta');
      const firstTag = tagNodes[0];

      expect(tagNodes).toHaveLength(1);

      expect(firstTag?.getAttribute('name')).toBe('description');
      expect(firstTag?.getAttribute('content')).toBe('Inner description');
      expect(firstTag?.outerHTML).toBe(
        '<meta name="description" content="Inner description" data-rh="true">'
      );
    });
  });

  describe('overrides single meta tag with duplicate meta tags in a nested component', () => {
    const MultipleNestedMetaOverride = () => (
      <>
        <Helmet>
          <meta name="description" content="Test description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
          <meta name="description" content="Inner duplicate description" />
        </Helmet>
      </>
    );

    it('server', () => {
      renderServer(<MultipleNestedMetaOverride />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-rh="true" name="description" content="Inner description"/><meta data-rh="true" name="description" content="Inner duplicate description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-rh="true" name="description" content="Inner description"/><meta data-rh="true" name="description" content="Inner duplicate description"/>'
      );
    });

    it('client', () => {
      renderClient(<MultipleNestedMetaOverride />, clientCache);

      const tagNodes = getInjectedElementsByTagName('meta');
      const firstTag = tagNodes[0];
      const secondTag = tagNodes[1];

      expect(tagNodes).toHaveLength(2);

      expect(firstTag?.getAttribute('name')).toBe('description');
      expect(firstTag?.getAttribute('content')).toBe('Inner description');
      expect(firstTag?.outerHTML).toBe(
        '<meta name="description" content="Inner description" data-rh="true">'
      );

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Inner duplicate description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Inner duplicate description" data-rh="true">'
      );
    });
  });

  describe('encodes special characters', () => {
    const AttributeSpecialCharacters = () => (
      <Helmet>
        <meta name="description" content={'This is "quoted" text and & and \'.'} />
      </Helmet>
    );

    it('server', () => {
      renderServer(<AttributeSpecialCharacters />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-rh="true" name="description" content="This is &quot;quoted&quot; text and &amp; and &#x27;."/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-rh="true" name="description" content="This is &quot;quoted&quot; text and &amp; and &#x27;."/>'
      );
    });

    it('client', () => {
      renderClient(<AttributeSpecialCharacters />, clientCache);

      const existingTags = getInjectedElementsByTagName('meta');
      const existingTag = existingTags[0];

      expect(existingTags).toHaveLength(1);

      expect(existingTag?.getAttribute('name')).toBe('description');
      expect(existingTag?.getAttribute('content')).toBe('This is "quoted" text and & and \'.');
      expect(existingTag?.outerHTML).toMatchInlineSnapshot(
        `"<meta name="description" content="This is &quot;quoted&quot; text and &amp; and '." data-rh="true">"`
      );
    });
  });
});
