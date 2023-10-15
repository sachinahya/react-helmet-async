import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

describe('meta tags', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('determine meta tags based on deepest nested component', () => {
    const DeepestNestedMeta = () => (
      <>
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content="Test description" />
        </Head>
        <Head>
          <meta name="description" content="Inner description" />
          <meta name="keywords" content="test,meta,tags" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedMeta />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" charset="utf-8"/><meta data-ht="true" name="description" content="Inner description"/><meta data-ht="true" name="keywords" content="test,meta,tags"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" charSet="utf-8"/><meta data-ht="true" name="description" content="Inner description"/><meta data-ht="true" name="keywords" content="test,meta,tags"/>'
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
      expect(firstTag?.outerHTML).toBe('<meta charset="utf-8" data-ht="true">');

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Inner description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Inner description" data-ht="true">'
      );

      expect(thirdTag?.getAttribute('name')).toBe('keywords');
      expect(thirdTag?.getAttribute('content')).toBe('test,meta,tags');
      expect(thirdTag?.outerHTML).toBe(
        '<meta name="keywords" content="test,meta,tags" data-ht="true">'
      );
    });
  });

  describe('allows duplicate meta tags if specified in the same component', () => {
    const MultipleMetaTags = () => (
      <Head>
        <meta name="description" content="Test description" />
        <meta name="description" content="Duplicate description" />
      </Head>
    );

    it('server', () => {
      renderServer(<MultipleMetaTags />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" name="description" content="Test description"/><meta data-ht="true" name="description" content="Duplicate description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" name="description" content="Test description"/><meta data-ht="true" name="description" content="Duplicate description"/>'
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
        '<meta name="description" content="Test description" data-ht="true">'
      );

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Duplicate description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Duplicate description" data-ht="true">'
      );
    });
  });

  describe('overrides duplicate meta tags with single meta tag in a nested component', () => {
    const MultipleNestedMetaOverride = () => (
      <>
        <Head>
          <meta name="description" content="Test description" />
          <meta name="description" content="Duplicate description" />
        </Head>
        <Head>
          <meta name="description" content="Inner description" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<MultipleNestedMetaOverride />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" name="description" content="Inner description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" name="description" content="Inner description"/>'
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
        '<meta name="description" content="Inner description" data-ht="true">'
      );
    });
  });

  describe('overrides single meta tag with duplicate meta tags in a nested component', () => {
    const MultipleNestedMetaOverride = () => (
      <>
        <Head>
          <meta name="description" content="Test description" />
        </Head>
        <Head>
          <meta name="description" content="Inner description" />
          <meta name="description" content="Inner duplicate description" />
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<MultipleNestedMetaOverride />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" name="description" content="Inner description"/><meta data-ht="true" name="description" content="Inner duplicate description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" name="description" content="Inner description"/><meta data-ht="true" name="description" content="Inner duplicate description"/>'
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
        '<meta name="description" content="Inner description" data-ht="true">'
      );

      expect(secondTag?.getAttribute('name')).toBe('description');
      expect(secondTag?.getAttribute('content')).toBe('Inner duplicate description');
      expect(secondTag?.outerHTML).toBe(
        '<meta name="description" content="Inner duplicate description" data-ht="true">'
      );
    });
  });

  describe('encodes special characters', () => {
    const AttributeSpecialCharacters = () => (
      <Head>
        <meta name="description" content={'This is "quoted" text and & and \'.'} />
      </Head>
    );

    it('server', () => {
      renderServer(<AttributeSpecialCharacters />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" name="description" content="This is &quot;quoted&quot; text and &amp; and &#x27;."/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" name="description" content="This is &quot;quoted&quot; text and &amp; and &#x27;."/>'
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
        `"<meta name="description" content="This is &quot;quoted&quot; text and &amp; and '." data-ht="true">"`
      );
    });
  });
});
