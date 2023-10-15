import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HelmetServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

Helmet.defaultProps.defer = false;

describe('script tags', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache();
  });

  describe('should not render undefined attribute values', () => {
    const UndefinedAttributeValue = () => (
      <Helmet>
        <script src="foo.js" async={undefined} />
      </Helmet>
    );

    it('client', () => {
      renderClient(<UndefinedAttributeValue />, clientCache);

      const scriptTags = getInjectedElementsByTagName('script');

      expect(scriptTags).toHaveLength(1);

      expect(scriptTags[0]?.getAttribute('async')).toBeNull();
      expect(scriptTags[0]?.outerHTML).toBe('<script src="foo.js" data-rh="true"></script>');
    });

    it('server', () => {
      renderServer(<UndefinedAttributeValue />, serverCache);

      const head = serverCache.getOutput();

      const expected = '<script data-rh="true" src="foo.js"></script>';

      expect(head.script.toString()).toBe(expected);
      expect(renderResult(head.script.toElements())).toBe(expected);
    });
  });

  describe('should render boolean attributes', () => {
    const BooleanAttributes = () => (
      <Helmet>
        <script src="foo.js" async />
      </Helmet>
    );

    it('client', () => {
      renderClient(<BooleanAttributes />, clientCache);

      const scriptTags = getInjectedElementsByTagName('script');

      expect(scriptTags).toHaveLength(1);

      expect(scriptTags[0]?.getAttribute('async')).toBe('true');
      expect(scriptTags[0]?.outerHTML).toBe(
        '<script src="foo.js" async="true" data-rh="true"></script>'
      );
    });

    it('server', () => {
      renderServer(<BooleanAttributes />, serverCache);

      const head = serverCache.getOutput();

      expect(head.script.toString()).toBe(
        '<script data-rh="true" src="foo.js" async="true"></script>'
      );
      expect(renderResult(head.script.toElements())).toBe(
        '<script data-rh="true" src="foo.js" async=""></script>'
      );
    });
  });
});
