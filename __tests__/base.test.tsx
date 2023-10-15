import { FC } from 'react';
import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';

describe('base', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('determine base tag based on deepest nested component', () => {
    const DeepestNestedBase: FC = () => (
      <div>
        <Head>
          <base href="http://mysite.com" />
        </Head>
        <Head>
          <base href="http://mysite.com/public" />
        </Head>
      </div>
    );

    it('server', () => {
      renderServer(<DeepestNestedBase />, serverCache);

      const head = serverCache.getOutput();

      const expected = '<base data-ht="true" href="http://mysite.com/public"/>';

      expect(head.base.toString()).toBe(expected);
      expect(renderResult(head.base.toElements())).toBe(expected);
    });

    it('client', () => {
      renderClient(<DeepestNestedBase />, clientCache);

      const tags = getInjectedElementsByTagName('base');

      expect(tags).toHaveLength(1);

      expect(tags[0]?.outerHTML).toBe('<base href="http://mysite.com/public" data-ht="true">');
    });
  });

  describe('determine base tag based on last declared component', () => {
    const LastDeclaredBase: FC = () => (
      <div>
        <Head>
          <base href="http://mysite.com" />
          <base href="http://mysite.com/public" />
        </Head>
      </div>
    );

    it('server', () => {
      renderServer(<LastDeclaredBase />, serverCache);

      const head = serverCache.getOutput();

      const expected = '<base data-ht="true" href="http://mysite.com/public"/>';

      expect(head.base.toString()).toBe(expected);
      expect(renderResult(head.base.toElements())).toBe(expected);
    });

    it('client', () => {
      renderClient(<LastDeclaredBase />, clientCache);

      const tags = getInjectedElementsByTagName('base');

      expect(tags).toHaveLength(1);

      expect(tags[0]?.outerHTML).toBe('<base href="http://mysite.com/public" data-ht="true">');
    });
  });
});
