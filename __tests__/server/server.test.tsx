import { ReactElement, ReactNode, StrictMode, cloneElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Helmet, HelmetState } from '../../src';
import { HelmetServerCache } from '../../src/server/server-cache';
import { AttributeState, TagState } from '../../src/state';
import { HelmetProvider } from '../../src/Provider';

const renderServer = (node: ReactNode, state: HelmetState): void => {
  renderToStaticMarkup(
    <StrictMode>
      <HelmetProvider state={state}>{node}</HelmetProvider>
    </StrictMode>
  );
};

const renderResult = (elements: ReactElement | ReactElement[]): string => {
  return renderToStaticMarkup(
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{elements}</>
  );
};

describe('server', () => {
  let state: HelmetServerCache;

  beforeEach(() => {
    state = new HelmetServerCache();
  });

  it('should provide an empty server output when no tags were rendered', () => {
    renderServer(<div />, state);

    const head = state.getOutput();

    expect(head.bodyAttributes.toString()).toBe('');
    expect(head.bodyAttributes.toProps()).toStrictEqual({});

    expect(head.htmlAttributes.toString()).toBe('');
    expect(head.htmlAttributes.toProps()).toStrictEqual({});

    expect(head.title.toString()).toBe('<title data-rh="true"></title>');
    expect(renderResult(head.title.toElements())).toBe('<title data-rh="true"></title>');

    expect(head.base.toString()).toBe('');
    expect(head.base.toElements()).toHaveLength(0);

    expect(head.meta.toString()).toBe('');
    expect(head.meta.toElements()).toHaveLength(0);

    expect(head.link.toString()).toBe('');
    expect(head.link.toElements()).toHaveLength(0);

    expect(head.script.toString()).toBe('');
    expect(head.script.toElements()).toHaveLength(0);

    expect(head.noscript.toString()).toBe('');
    expect(head.noscript.toElements()).toHaveLength(0);

    expect(head.style.toString()).toBe('');
    expect(head.style.toElements()).toHaveLength(0);

    expect(head.priority.toString()).toBe('');
    expect(head.priority.toElements()).toHaveLength(0);
  });

  it('should not render undefined attribute values', () => {
    renderServer(
      <Helmet>
        <script src="foo.js" async={undefined} />
      </Helmet>,
      state
    );

    const head = state.getOutput();

    const expected = '<script data-rh="true" src="foo.js" async></script>';

    expect(head.script.toString()).toBe(expected);
    expect(renderResult(head.script.toElements())).toBe(expected);
  });

  describe('SEO prioritisation', () => {
    it('prioritizes SEO tags when asked to', () => {
      renderServer(
        <Helmet prioritizeSeoTags>
          <link rel="notImportant" href="https://www.chipotle.com" />
          <link rel="canonical" href="https://www.tacobell.com" />
          <meta property="og:title" content="A very important title" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.priority.toString()).toContain('rel="canonical" href="https://www.tacobell.com"');
      expect(head.priority.toString()).toContain(
        'property="og:title" content="A very important title"'
      );

      expect(head.link.toString()).toBe(
        '<link data-rh="true" rel="notImportant" href="https://www.chipotle.com"/>'
      );
      expect(head.meta.toString()).toBe('');
    });

    it('does not prioritize SEO unless asked to', () => {
      renderServer(
        <Helmet>
          <link rel="notImportant" href="https://www.chipotle.com" />
          <link rel="canonical" href="https://www.tacobell.com" />
          <meta property="og:title" content="A very important title" />
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.priority.toString()).not.toContain(
        'rel="canonical" href="https://www.tacobell.com"'
      );
      expect(head.link.toString()).toContain('rel="canonical" href="https://www.tacobell.com"');

      expect(head.priority.toString()).not.toContain(
        'property="og:title" content="A very important title"'
      );
      expect(head.meta.toString()).toContain(
        'property="og:title" content="A very important title"'
      );
    });
  });

  describe('base', () => {
    it('should set base tag based on deepest nested component', () => {
      renderServer(
        <div>
          <Helmet>
            <base href="http://mysite.com" />
          </Helmet>
          <Helmet>
            <base href="http://mysite.com/public" />
          </Helmet>
        </div>,
        state
      );

      const head = state.getOutput();

      const expected = '<base data-rh="true" href="http://mysite.com/public"/>';

      expect(head.base.toString()).toBe(expected);
      expect(renderResult(head.base.toElements())).toBe(expected);
    });
  });

  describe('title', () => {
    it('should render title tag', () => {
      renderServer(
        <Helmet>
          <title>Amazing Title</title>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      const expected = '<title data-rh="true">Amazing Title</title>';

      expect(head.title.toString()).toBe(expected);
      expect(renderResult(head.title.toElements())).toBe(expected);
    });

    it('should render title with itemprop name as string', () => {
      renderServer(
        <Helmet>
          <title itemProp="name">Title with Itemprop</title>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.title.toString()).toBe(
        '<title data-rh="true" itemprop="name">Title with Itemprop</title>'
      );
      expect(renderResult(head.title.toElements())).toBe(
        '<title data-rh="true" itemProp="name">Title with Itemprop</title>'
      );
    });

    it('should render title and allows children containing expressions', () => {
      const someValue = 'Some Great Title';

      renderServer(
        <Helmet>
          <title>Title: {someValue} 1234</title>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      const expected = '<title data-rh="true">Title: Some Great Title 1234</title>';

      expect(head.title.toString()).toBe(expected);
      expect(renderResult(head.title.toElements())).toBe(expected);
    });

    it('should encode HTML characters in title', () => {
      renderServer(
        <Helmet>
          <title>{`Dangerous <script> include`}</title>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      const expected = '<title data-rh="true">Dangerous &lt;script&gt; include</title>';

      expect(head.title.toString()).toBe(expected);
      expect(renderResult(head.title.toElements())).toBe(expected);
    });

    it('should still encode HTML characters in title with encoding disabled', () => {
      renderServer(
        <Helmet encodeSpecialCharacters={false}>
          <title>{`Dangerous <script> include`}</title>
        </Helmet>,
        state
      );

      const head = state.getOutput();

      expect(head.title.toString()).toBe(
        '<title data-rh="true">Dangerous <script> include</title>'
      );

      expect(head.title.toElements()).toMatchInlineSnapshot(`
        [
          <title
            data-rh={true}
          >
            Dangerous &lt;script&gt; include
          </title>,
        ]
      `);
      expect(renderResult(head.title.toElements())).toBe(
        '<title data-rh="true">Dangerous &lt;script&gt; include</title>'
      );
    });

    it('should not encode non-HTML characters when opt out of string encoding', () => {
      /* eslint-disable react/no-unescaped-entities */
      renderServer(
        <Helmet encodeSpecialCharacters={false}>
          <title>This is text and & and '.</title>
        </Helmet>,
        state
      );
      /* eslint-enable react/no-unescaped-entities */

      const head = state.getOutput();

      expect(head.title.toString()).toBe(`<title data-rh="true">This is text and & and '.</title>`);

      expect(head.title.toElements()).toMatchInlineSnapshot(`
        [
          <title
            data-rh={true}
          >
            This is text and & and '.
          </title>,
        ]
      `);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">This is text and & and '.</title>`
      );
    });

    it('does not encode all characters with HTML character entity equivalents', () => {
      const chineseTitle = '膣膗 鍆錌雔';

      renderServer(
        <div>
          <Helmet>
            <title>{chineseTitle}</title>
          </Helmet>
        </div>,
        state
      );

      const head = state.getOutput();

      expect(head.title.toString()).toBe('<title data-rh="true">膣膗 鍆錌雔</title>');
      expect(renderResult(head.title.toElements())).toBe(
        '<title data-rh="true">膣膗 鍆錌雔</title>'
      );
    });
  });

  describe('tags', () => {
    it.each<{
      tag: keyof TagState;
      elements: ReactElement[];
      expected: string | string[];
      expectedReact?: string | string[];
    }>([
      {
        tag: 'base',
        elements: [<base target="_blank" href="http://localhost/" />],
        expected: '<base data-rh="true" target="_blank" href="http://localhost/"/>',
      },
      {
        tag: 'link',
        elements: [
          <link href="http://localhost/helmet" rel="canonical" />,
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />,
        ],
        expected:
          '<link data-rh="true" href="http://localhost/helmet" rel="canonical"/><link data-rh="true" href="http://localhost/style.css" rel="stylesheet" type="text/css"/>',
      },
      {
        tag: 'meta',
        elements: [
          <meta charSet="utf-8" />,
          <meta
            name="description"
            content={'Test description & encoding of special characters like \' " > < `'}
          />,
          <meta httpEquiv="content-type" content="text/html" />,
          <meta property="og:type" content="article" />,
          <meta itemProp="name" content="Test name itemprop" />,
        ],
        expected: [
          '<meta data-rh="true" charset="utf-8"/>',
          '<meta data-rh="true" name="description" content="Test description &amp; encoding of special characters like &#x27; &quot; &gt; &lt; `"/>',
          '<meta data-rh="true" http-equiv="content-type" content="text/html"/>',
          '<meta data-rh="true" property="og:type" content="article"/>',
          '<meta data-rh="true" itemprop="name" content="Test name itemprop"/>',
        ],
        expectedReact: [
          '<meta data-rh="true" charSet="utf-8"/>',
          '<meta data-rh="true" name="description" content="Test description &amp; encoding of special characters like &#x27; &quot; &gt; &lt; `"/>',
          '<meta data-rh="true" http-equiv="content-type" content="text/html"/>',
          '<meta data-rh="true" property="og:type" content="article"/>',
          '<meta data-rh="true" itemProp="name" content="Test name itemprop"/>',
        ],
      },
      {
        tag: 'noscript',
        elements: [
          <noscript id="foo">{`<link rel="stylesheet" type="text/css" href="/style.css" />`}</noscript>,
          <noscript id="bar">{`<link rel="stylesheet" type="text/css" href="/style2.css" />`}</noscript>,
        ],
        expected: [
          '<noscript data-rh="true" id="foo"><link rel="stylesheet" type="text/css" href="/style.css" /></noscript>',
          '<noscript data-rh="true" id="bar"><link rel="stylesheet" type="text/css" href="/style2.css" /></noscript>',
        ],
      },
      {
        tag: 'script',
        elements: [
          <script src="http://localhost/test.js" type="text/javascript" />,
          <script src="http://localhost/test2.js" type="text/javascript" />,
        ],
        expected: [
          '<script data-rh="true" src="http://localhost/test.js" type="text/javascript"></script>',
          '<script data-rh="true" src="http://localhost/test2.js" type="text/javascript"></script>',
        ],
      },
      {
        tag: 'style',
        elements: [
          <style type="text/css">{`body {background-color: green;}`}</style>,
          <style type="text/css">{`p {font-size: 12px;}`}</style>,
        ],
        expected: [
          '<style data-rh="true" type="text/css">body {background-color: green;}</style>',
          '<style data-rh="true" type="text/css">p {font-size: 12px;}</style>',
        ],
      },
    ])('should render $tag tag', ({ tag, elements, expected, expectedReact }) => {
      elements = elements.map((element, i) =>
        cloneElement(element, {
          // eslint-disable-next-line react/no-array-index-key
          key: i,
        })
      );
      expected = Array.isArray(expected) ? expected.join('') : expected;
      expectedReact = Array.isArray(expectedReact) ? expectedReact.join('') : expectedReact;

      renderServer(<Helmet>{elements}</Helmet>, state);

      const head = state.getOutput();

      expect(head[tag].toString()).toBe(expected);
      expect(renderResult(head[tag].toElements())).toBe(expectedReact ?? expected);
    });
  });

  describe('attributes', () => {
    it.each<{
      tag: string;
      key: keyof AttributeState;
      element: ReactElement;
      expectedString: string;
      expectedProps: object;
    }>([
      {
        tag: 'body',
        key: 'bodyAttributes',
        element: <body lang="ga" className="myClassName" />,
        expectedString: 'lang="ga" class="myClassName"',
        expectedProps: {
          className: 'myClassName',
          lang: 'ga',
        },
      },
      {
        tag: 'html',
        key: 'htmlAttributes',
        element: <html lang="ga" className="myClassName" />,
        expectedString: 'lang="ga" class="myClassName"',
        expectedProps: {
          className: 'myClassName',
          lang: 'ga',
        },
      },
    ])('should render $tag attributes', ({ key, element, expectedString, expectedProps }) => {
      renderServer(<Helmet>{element}</Helmet>, state);

      const head = state.getOutput();

      expect(head[key].toString()).toBe(expectedString);
      expect(head[key].toProps()).toStrictEqual(expectedProps);
    });
  });
});
