import { ReactElement } from 'react';
import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { getInjectedElementsByTagName, renderClient, renderServer } from './utils';
import { HeadServerCache } from '../src/server/server-cache';
import { TagState } from '../src/state';

const validTags: Record<keyof TagState, ReactElement> = {
  base: <base href="http://somewhere-cool.com" />,
  link: <link rel="stylesheet" href="something-cool.css" />,
  meta: <meta name="description" content="So cool" />,
  noscript: <noscript>{'<div/>'}</noscript>,
  script: <script>console.log()</script>,
  style: <style>{`body { background-color: green; }`}</style>,
};

describe('tag validation', () => {
  describe.each<{
    tag: keyof TagState;
    case: string;
    element: ReactElement;
  }>([
    {
      tag: 'base',
      case: 'base tags without href',
      element: <base property="won't work" />,
    },
    {
      tag: 'base',
      case: 'base tags with empty href',
      element: <base href="" />,
    },
    {
      tag: 'link',
      case: 'link tags without href or rel',
      // @ts-expect-error
      element: <link httpEquiv="won't work" />,
    },
    {
      tag: 'link',
      case: 'link tags with rel="icon" and empty href',
      element: <link rel="icon" sizes="192x192" href="" />,
    },
    {
      tag: 'meta',
      case: 'meta tag without "name", "http-equiv", "property", "charset", or "itemprop"',
      element: <meta />,
    },
    {
      tag: 'meta',
      case: 'meta tag with empty name',
      element: <meta name="" content="Inner duplicate description" />,
    },
    {
      tag: 'noscript',
      case: 'noscript tag without children',
      element: <noscript />,
    },
    {
      tag: 'noscript',
      case: 'noscript tag with empty string children',
      element: <noscript>{null}</noscript>,
    },
    {
      tag: 'script',
      case: 'script without src or children',
      element: <script />,
    },
    {
      tag: 'script',
      case: 'script with undefined src',
      element: <script src={undefined} />,
    },
    {
      tag: 'script',
      case: 'script with empty src',
      element: <script src="" />,
    },
    {
      tag: 'style',
      case: 'style without children',
      element: <style />,
    },
    {
      tag: 'style',
      case: 'style with null children',
      element: <style>{null}</style>,
    },
  ])('$case', ({ tag, element }) => {
    it('should render no tags on client', () => {
      const cache = new HeadClientCache({ sync: true });

      renderClient(<Head>{element}</Head>, cache);

      expect(getInjectedElementsByTagName(tag)).toHaveLength(0);
    });

    it('should remove a previously valid tag', () => {
      const cache = new HeadClientCache({ sync: true });

      renderClient(<Head>{validTags[tag]}</Head>, cache);

      expect(getInjectedElementsByTagName(tag)).toHaveLength(1);

      renderClient(<Head>{element}</Head>, cache);

      expect(getInjectedElementsByTagName(tag)).toHaveLength(0);
    });

    it('should render no tags on server', () => {
      const cache = new HeadServerCache();

      renderServer(<Head>{element}</Head>, cache);

      const head = cache.getOutput();

      expect(head[tag].toString()).toBe('');
      expect(head[tag].toElements).toHaveLength(0);
    });
  });
});
