import { renderClient, renderResult, renderServer } from './utils';
import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HelmetServerCache } from '../src/server/server-cache';

describe('Fragments', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache({ sync: true });
  });

  describe('should parse Fragments', () => {
    const WithFragments = () => (
      <Helmet>
        <>
          <title>Hello</title>
          <meta charSet="utf-8" />
        </>
      </Helmet>
    );

    it('server', () => {
      renderServer(<WithFragments />, serverCache);

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe('<title data-rh="true">Hello</title>');
      expect(renderResult(head.title.toElements())).toBe('<title data-rh="true">Hello</title>');

      expect(head.meta.toString()).toBe('<meta data-rh="true" charset="utf-8"/>');
      expect(renderResult(head.meta.toElements())).toBe('<meta data-rh="true" charSet="utf-8"/>');
    });

    it('client', () => {
      renderClient(<WithFragments />, clientCache);

      expect(document.title).toBe('Hello');
    });
  });

  describe('should traverse multiple levels of nested Fragments', () => {
    it('server', () => {
      renderServer(
        <Helmet>
          <>
            <title>Foo</title>
            <>
              <title>Bar</title>
              <>
                <title>Baz</title>
              </>
            </>
          </>
        </Helmet>,
        serverCache
      );

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe('<title data-rh="true">Baz</title>');
      expect(renderResult(head.title.toElements())).toBe('<title data-rh="true">Baz</title>');
    });

    it('client', () => {
      renderClient(
        <Helmet>
          <>
            <title>Foo</title>
            <>
              <title>Bar</title>
              <>
                <title>Baz</title>
              </>
            </>
          </>
        </Helmet>,
        clientCache
      );

      expect(document.title).toBe('Baz');
    });
  });
});
