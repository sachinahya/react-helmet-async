import { renderClient, renderResult, renderServer } from './utils';
import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';

describe('Fragments', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('should parse Fragments', () => {
    const WithFragments = () => (
      <Head>
        <>
          <title>Hello</title>
          <meta charSet="utf-8" />
        </>
      </Head>
    );

    it('server', () => {
      renderServer(<WithFragments />, serverCache);

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe('<title data-ht="true">Hello</title>');
      expect(renderResult(head.title.toElements())).toBe('<title data-ht="true">Hello</title>');

      expect(head.meta.toString()).toBe('<meta data-ht="true" charset="utf-8"/>');
      expect(renderResult(head.meta.toElements())).toBe('<meta data-ht="true" charSet="utf-8"/>');
    });

    it('client', () => {
      renderClient(<WithFragments />, clientCache);

      expect(document.title).toBe('Hello');
    });
  });

  describe('should traverse multiple levels of nested Fragments', () => {
    it('server', () => {
      renderServer(
        <Head>
          <>
            <title>Foo</title>
            <>
              <title>Bar</title>
              <>
                <title>Baz</title>
              </>
            </>
          </>
        </Head>,
        serverCache
      );

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe('<title data-ht="true">Baz</title>');
      expect(renderResult(head.title.toElements())).toBe('<title data-ht="true">Baz</title>');
    });

    it('client', () => {
      renderClient(
        <Head>
          <>
            <title>Foo</title>
            <>
              <title>Bar</title>
              <>
                <title>Baz</title>
              </>
            </>
          </>
        </Head>,
        clientCache
      );

      expect(document.title).toBe('Baz');
    });
  });
});
