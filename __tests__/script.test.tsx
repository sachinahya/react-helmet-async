import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
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

  it('should not render undefined attribute values on client', () => {
    renderClient(
      <Helmet>
        <script src="foo.js" async={undefined} />
      </Helmet>,
      clientCache
    );

    const scriptTags = getInjectedElementsByTagName('script');

    expect(scriptTags).toHaveLength(1);
    expect(scriptTags[1]?.outerHTML).toBe('<script src="foo.js" data-rh="true"></script>');
  });

  it('should not render undefined attribute values on server', () => {
    renderServer(
      <Helmet>
        <script src="foo.js" async={undefined} />
      </Helmet>,
      serverCache
    );

    const head = serverCache.getOutput();

    const expected = '<script data-rh="true" src="foo.js"></script>';

    expect(head.script.toString()).toBe(expected);
    expect(renderResult(head.script.toElements())).toBe(expected);
  });
});
