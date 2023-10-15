import { Head } from '../src/Head';
import { TRACKING_ATTRIBUTE } from '../src/constants';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';

describe('misc', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('errors', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
    });

    describe('does not accept nested Head tags', () => {
      const NestedHeads = () => (
        <Head>
          <title>Test Title</title>
          <Head>
            <title>Title you will never see</title>
          </Head>
        </Head>
      );

      it('client', () => {
        expect(() => {
          renderClient(<NestedHeads />, clientCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: You may be attempting to nest <Head> components within each other, which is not allowed. Refer to our API for more information."`
        );
      });

      it('server', () => {
        expect(() => {
          renderServer(<NestedHeads />, serverCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: You may be attempting to nest <Head> components within each other, which is not allowed. Refer to our API for more information."`
        );
      });
    });

    describe('throws on invalid elements', () => {
      const InvalidElements = () => (
        <Head>
          <title>Test Title</title>
          <div>
            <title>Title you will never see</title>
          </div>
        </Head>
      );

      it('client', () => {
        expect(() => {
          renderClient(<InvalidElements />, clientCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Only elements types base, body, head, html, link, meta, noscript, script, style, title are allowed. Head does not support rendering <div> elements. Refer to our API for more information."`
        );
      });

      it('server', () => {
        expect(() => {
          renderServer(<InvalidElements />, serverCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Only elements types base, body, head, html, link, meta, noscript, script, style, title are allowed. Head does not support rendering <div> elements. Refer to our API for more information."`
        );
      });
    });

    describe('throws on invalid self-closing elements', () => {
      const InvalidSelfClosing = () => (
        <Head>
          <title>Test Title</title>
          <div data-custom-attribute />
        </Head>
      );

      it('client', () => {
        expect(() => {
          renderClient(<InvalidSelfClosing />, clientCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Only elements types base, body, head, html, link, meta, noscript, script, style, title are allowed. Head does not support rendering <div> elements. Refer to our API for more information."`
        );
      });

      it('server', () => {
        expect(() => {
          renderServer(<InvalidSelfClosing />, serverCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Only elements types base, body, head, html, link, meta, noscript, script, style, title are allowed. Head does not support rendering <div> elements. Refer to our API for more information."`
        );
      });
    });

    describe('throws on invalid strings as children', () => {
      const InvalidStringChildren = () => (
        <Head>
          <title>Test Title</title>
          {/* eslint-disable-next-line react/void-dom-elements-no-children */}
          <link href="http://localhost/head" rel="canonical">
            test
          </link>
        </Head>
      );

      it('client', () => {
        expect(() => {
          renderClient(<InvalidStringChildren />, clientCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"<link /> elements are self-closing and can not contain children. Refer to our API for more information."`
        );
      });

      it('server', () => {
        expect(() => {
          renderServer(<InvalidStringChildren />, serverCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"<link /> elements are self-closing and can not contain children. Refer to our API for more information."`
        );
      });
    });

    describe('throws on invalid children', () => {
      const InvalidChildren = () => (
        <Head>
          <title>Test Title</title>
          <script>
            <title>Title you will never see</title>
          </script>
        </Head>
      );

      it('client', () => {
        expect(() => {
          renderClient(<InvalidChildren />, clientCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Head expects a string as a child of <script>. Did you forget to wrap your children in braces? ( <script>{\`\`}</script> ) Refer to our API for more information."`
        );
      });

      it('server', () => {
        expect(() => {
          renderServer(<InvalidChildren />, serverCache);
        }).toThrowErrorMatchingInlineSnapshot(
          `"Invariant failed: Head expects a string as a child of <script>. Did you forget to wrap your children in braces? ( <script>{\`\`}</script> ) Refer to our API for more information."`
        );
      });
    });
  });

  describe('handles undefined children', () => {
    const charSet = undefined;

    const UndefinedChildren = () => (
      <Head>
        {charSet && <meta charSet={charSet} />}
        <title>Test Title</title>
      </Head>
    );

    it('client', () => {
      renderClient(<UndefinedChildren />, clientCache);

      const metaTags = getInjectedElementsByTagName('meta');

      expect(document.title).toBe('Test Title');
      expect(metaTags).toHaveLength(0);
    });

    it('server', () => {
      renderServer(<UndefinedChildren />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe('');
      expect(renderResult(head.meta.toElements())).toBe('');
    });
  });

  describe('handles falsy children', () => {
    const charSet = 0;

    const UndefinedChildren = () => (
      <Head>
        {charSet && <meta charSet={charSet} />}
        <title>Test Title</title>
      </Head>
    );

    it('client', () => {
      renderClient(<UndefinedChildren />, clientCache);

      const metaTags = getInjectedElementsByTagName('meta');

      expect(document.title).toBe('Test Title');
      expect(metaTags).toHaveLength(0);
    });

    it('server', () => {
      renderServer(<UndefinedChildren />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe('');
      expect(renderResult(head.meta.toElements())).toBe('');
    });
  });

  describe('recognizes valid tags regardless of attribute ordering', () => {
    const AttributeOrdering = () => (
      <Head>
        <meta content="Test Description" name="description" />
      </Head>
    );

    it('client', () => {
      renderClient(<AttributeOrdering />, clientCache);

      const existingTags = getInjectedElementsByTagName('meta');
      const existingTag = existingTags[0];

      expect(existingTags).toHaveLength(1);

      expect(existingTag?.getAttribute('name')).toBe('description');
      expect(existingTag?.getAttribute('content')).toBe('Test Description');
      expect(existingTag?.outerHTML).toBe(
        '<meta content="Test Description" name="description" data-ht="true">'
      );
    });

    it('server', () => {
      renderServer(<AttributeOrdering />, serverCache);

      const head = serverCache.getOutput();

      expect(head.meta.toString()).toBe(
        '<meta data-ht="true" content="Test Description" name="description"/>'
      );
      expect(renderResult(head.meta.toElements())).toBe(
        '<meta data-ht="true" content="Test Description" name="description"/>'
      );
    });
  });
});
