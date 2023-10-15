import { ReactElement, cloneElement } from 'react';
import { Helmet } from '../src/Helmet';
import { HelmetServerCache } from '../src/server/server-cache';
import { TagState } from '../src/state';
import { getInjectedElementsByTagName, renderClient, renderResult, renderServer } from './utils';
import { HelmetClientCache } from '../src/client/client-cache';

describe.each<{
  tag: keyof TagState;
  elements: {
    jsx: ReactElement;
    expectedServerString: string;
    expectedReactString?: string;
    expectedAttributes: Record<string, string>;
    expectedInnerHTML?: string;
  }[];
}>([
  {
    tag: 'base',
    elements: [
      {
        jsx: <base target="_blank" href="http://localhost/" />,
        expectedServerString: '<base data-rh="true" target="_blank" href="http://localhost/"/>',
        expectedAttributes: {
          'data-rh': 'true',
          target: '_blank',
          href: 'http://localhost/',
        },
      },
    ],
  },
  {
    tag: 'link',
    elements: [
      {
        jsx: <link href="http://localhost/helmet" rel="canonical" />,
        expectedServerString:
          '<link data-rh="true" href="http://localhost/helmet" rel="canonical"/>',
        expectedAttributes: {
          'data-rh': 'true',
          href: 'http://localhost/helmet',
          rel: 'canonical',
        },
      },
    ],
  },
  {
    tag: 'meta',
    elements: [
      {
        jsx: <meta charSet="utf-8" />,
        expectedServerString: '<meta data-rh="true" charset="utf-8"/>',
        expectedReactString: '<meta data-rh="true" charSet="utf-8"/>',
        expectedAttributes: {
          'data-rh': 'true',
          charset: 'utf-8',
        },
      },
      {
        jsx: <meta name="description" content="Test description" />,
        expectedServerString:
          '<meta data-rh="true" name="description" content="Test description"/>',
        expectedAttributes: {
          'data-rh': 'true',
          name: 'description',
          content: 'Test description',
        },
      },
      {
        jsx: <meta httpEquiv="content-type" content="text/html" />,
        expectedServerString:
          '<meta data-rh="true" http-equiv="content-type" content="text/html"/>',
        expectedAttributes: {
          'data-rh': 'true',
          'http-equiv': 'content-type',
          content: 'text/html',
        },
      },
      {
        jsx: <meta property="og:type" content="article" />,
        expectedServerString: '<meta data-rh="true" property="og:type" content="article"/>',
        expectedAttributes: {
          'data-rh': 'true',
          property: 'og:type',
          content: 'article',
        },
      },
      {
        jsx: <meta itemProp="name" content="Test name itemprop" />,
        expectedServerString: '<meta data-rh="true" itemprop="name" content="Test name itemprop"/>',
        expectedReactString: '<meta data-rh="true" itemProp="name" content="Test name itemprop"/>',
        expectedAttributes: {
          'data-rh': 'true',
          itemprop: 'name',
          content: 'Test name itemprop',
        },
      },
    ],
  },
  {
    tag: 'noscript',
    elements: [
      {
        jsx: (
          <noscript id="foo">{`<link rel="stylesheet" type="text/css" href="/style.css" />`}</noscript>
        ),
        expectedServerString:
          '<noscript data-rh="true" id="foo"><link rel="stylesheet" type="text/css" href="/style.css" /></noscript>',
        expectedAttributes: {
          'data-rh': 'true',
          id: 'foo',
        },
        expectedInnerHTML: '<link rel="stylesheet" type="text/css" href="/style.css" />',
      },
      {
        jsx: (
          <noscript id="bar">{`<link rel="stylesheet" type="text/css" href="/style2.css" />`}</noscript>
        ),
        expectedServerString:
          '<noscript data-rh="true" id="bar"><link rel="stylesheet" type="text/css" href="/style2.css" /></noscript>',
        expectedAttributes: {
          'data-rh': 'true',
          id: 'bar',
        },
        expectedInnerHTML: '<link rel="stylesheet" type="text/css" href="/style2.css" />',
      },
    ],
  },
  {
    tag: 'script',
    elements: [
      {
        jsx: <script src="http://localhost/test.js" type="text/javascript" />,
        expectedServerString:
          '<script data-rh="true" src="http://localhost/test.js" type="text/javascript"></script>',
        expectedAttributes: {
          'data-rh': 'true',
          src: 'http://localhost/test.js',
          type: 'text/javascript',
        },
      },
      {
        jsx: <script src="http://localhost/test2.js" type="text/javascript" />,
        expectedServerString:
          '<script data-rh="true" src="http://localhost/test2.js" type="text/javascript"></script>',
        expectedAttributes: {
          'data-rh': 'true',
          src: 'http://localhost/test2.js',
          type: 'text/javascript',
        },
      },
      {
        jsx: (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'http://schema.org',
              '@type': 'NewsArticle',
              url: 'http://localhost/helmet',
            })}
          </script>
        ),
        expectedServerString: `<script data-rh="true" type="application/ld+json">${JSON.stringify({
          '@context': 'http://schema.org',
          '@type': 'NewsArticle',
          url: 'http://localhost/helmet',
        })}</script>`,
        expectedAttributes: {
          'data-rh': 'true',
          type: 'application/ld+json',
        },
        expectedInnerHTML: JSON.stringify({
          '@context': 'http://schema.org',
          '@type': 'NewsArticle',
          url: 'http://localhost/helmet',
        }),
      },
    ],
  },
  {
    tag: 'style',
    elements: [
      {
        jsx: <style type="text/css">{`body {background-color: green;}`}</style>,
        expectedServerString:
          '<style data-rh="true" type="text/css">body {background-color: green;}</style>',
        expectedAttributes: {
          'data-rh': 'true',
          type: 'text/css',
        },
        expectedInnerHTML: 'body {background-color: green;}',
      },
      {
        jsx: <style type="text/css">{`p {font-size: 12px;}`}</style>,
        expectedServerString: '<style data-rh="true" type="text/css">p {font-size: 12px;}</style>',
        expectedAttributes: {
          'data-rh': 'true',
          type: 'text/css',
        },
        expectedInnerHTML: 'p {font-size: 12px;}',
      },
    ],
  },
])('$tag tag', ({ tag, elements }) => {
  const mapElements = () =>
    elements.map((element, i) =>
      cloneElement(element.jsx, {
        key: i,
      })
    );

  it('should render tags on the server', () => {
    const serverCache = new HelmetServerCache();

    renderServer(<Helmet>{mapElements()}</Helmet>, serverCache);

    const head = serverCache.getOutput();

    expect(head[tag].toString()).toBe(elements.map(e => e.expectedServerString).join(''));
    expect(renderResult(head[tag].toElements())).toBe(
      elements.map(e => e.expectedReactString ?? e.expectedServerString).join('')
    );
  });

  it('should render and then remove tags on the client', () => {
    const clientCache = new HelmetClientCache();

    renderClient(<Helmet>{mapElements()}</Helmet>, clientCache);

    expect(getInjectedElementsByTagName(tag)).toHaveLength(elements.length);

    renderClient(<Helmet />, clientCache);

    expect(getInjectedElementsByTagName(tag)).toHaveLength(0);
  });

  it.each([...elements.entries()].map(([index, element]) => ({ index, ...element })))(
    'should render on the client - $expectedServerString',
    ({ index, expectedAttributes, expectedInnerHTML }) => {
      const clientCache = new HelmetClientCache();

      renderClient(<Helmet>{mapElements()}</Helmet>, clientCache);

      const foundTags = getInjectedElementsByTagName(tag);

      expect(foundTags).toHaveLength(elements.length);

      const foundTag = foundTags[index]!;

      expect(
        Object.assign(
          {},
          ...[...foundTag.attributes].map(attr => ({
            [attr.name]: attr.value,
          }))
        )
      ).toStrictEqual(expectedAttributes);
      expect(foundTag.innerHTML).toBe(expectedInnerHTML ?? '');
    }
  );
});
