import { FC } from 'react';
import { Helmet } from '../src/Helmet';
import { HelmetClientCache } from '../src/client/client-cache';
import { HelmetServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

describe('base', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache({ sync: true });
  });

  describe('determine base tag based on deepest nested component', () => {
    const DeepestNestedBase: FC = () => (
      <div>
        <Helmet>
          <base href="http://mysite.com" />
        </Helmet>
        <Helmet>
          <base href="http://mysite.com/public" />
        </Helmet>
      </div>
    );

    it('server', () => {
      renderServer(<DeepestNestedBase />, serverCache);

      const head = serverCache.getOutput();

      const expected = '<base data-rh="true" href="http://mysite.com/public"/>';

      expect(head.base.toString()).toBe(expected);
      expect(renderResult(head.base.toElements())).toBe(expected);
    });

    it('client', () => {
      renderClient(<DeepestNestedBase />, clientCache);

      const tags = getInjectedElementsByTagName('base');

      expect(tags).toHaveLength(1);

      expect(tags[0]?.outerHTML).toBe('<base href="http://mysite.com/public" data-rh="true">');
    });
  });

  describe('determine base tag based on last declared component', () => {
    const LastDeclaredBase: FC = () => (
      <div>
        <Helmet>
          <base href="http://mysite.com" />
          <base href="http://mysite.com/public" />
        </Helmet>
      </div>
    );

    it('server', () => {
      renderServer(<LastDeclaredBase />, serverCache);

      const head = serverCache.getOutput();

      const expected = '<base data-rh="true" href="http://mysite.com/public"/>';

      expect(head.base.toString()).toBe(expected);
      expect(renderResult(head.base.toElements())).toBe(expected);
    });

    it('client', () => {
      renderClient(<LastDeclaredBase />, clientCache);

      const tags = getInjectedElementsByTagName('base');

      expect(tags).toHaveLength(1);

      expect(tags[0]?.outerHTML).toBe('<base href="http://mysite.com/public" data-rh="true">');
    });
  });
});
