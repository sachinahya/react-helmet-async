import { ReactElement } from 'react';
import { Helmet } from '../src/Helmet';
import { HelmetClientCache } from '../src/client/client-cache';
import { HelmetServerCache } from '../src/server/server-cache';
import { renderClient, renderResult, renderServer } from './utils';
import { HELMET_ATTRIBUTE } from '../src/constants';

Helmet.defaultProps.defer = true;

describe('title', () => {
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache();
  });

  describe.each<{
    test: string;
    Component: () => ReactElement;
    expected: string;
  }>([
    {
      test: 'should render title tag',
      Component: () => (
        <Helmet>
          <title>Amazing Title</title>
        </Helmet>
      ),
      expected: 'Amazing Title',
    },
    {
      test: 'should render title and allows children containing expressions',
      Component: () => (
        <Helmet>
          <title>Title: {`${'Some Great Title'}`} 1234</title>
        </Helmet>
      ),
      expected: 'Title: Some Great Title 1234',
    },
    {
      test: 'should encode HTML characters in title',
      Component: () => (
        <Helmet>
          <title>{`Dangerous <script> include`}</title>
        </Helmet>
      ),
      expected: 'Dangerous &lt;script&gt; include',
    },
    {
      test: 'should still encode HTML characters in title with encoding disabled',
      Component: () => (
        <Helmet encodeSpecialCharacters={false}>
          <title>{`Dangerous <script> include`}</title>
        </Helmet>
      ),
      expected: 'Dangerous <script> include',
    },
    {
      test: 'should not encode non-HTML characters when opt out of string encoding',
      Component: () => (
        <Helmet encodeSpecialCharacters={false}>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <title>This is text and & and '.</title>
        </Helmet>
      ),
      expected: `This is text and & and '.`,
    },
    {
      test: 'does not encode all characters with HTML character entity equivalents',
      Component: () => (
        <Helmet>
          <title>膣膗 鍆錌雔</title>
        </Helmet>
      ),
      expected: '膣膗 鍆錌雔',
    },
    {
      test: 'updates page title with multiple children',
      Component: () => (
        <>
          <Helmet>
            <title>Test Title</title>
          </Helmet>
          <Helmet>
            <title>Child One Title</title>
          </Helmet>
          <Helmet>
            <title>Child Two Title</title>
          </Helmet>
        </>
      ),
      expected: 'Child Two Title',
    },
    {
      test: 'sets title using deepest nested component with a defined title',
      Component: () => (
        <>
          <Helmet>
            <title>Main Title</title>
          </Helmet>
          <Helmet />
        </>
      ),
      expected: 'Main Title',
    },
  ])('$test', ({ Component, expected }) => {
    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe(expected);
    });
  });

  describe('should render title with itemprop name as string', () => {
    const TitleWithItemProp = () => (
      <Helmet>
        <title itemProp="name">Title with Itemprop</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<TitleWithItemProp />, serverCache);

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe(
        '<title data-rh="true" itemprop="name">Title with Itemprop</title>'
      );
      expect(renderResult(head.title.toElements())).toBe(
        '<title data-rh="true" itemProp="name">Title with Itemprop</title>'
      );
    });

    it('client', () => {
      renderClient(<TitleWithItemProp />, clientCache);

      const titleTag = document.querySelector('title');

      expect(document.title).toBe('Title with Itemprop');
      expect(titleTag?.getAttribute('itemProp')).toBe('name');
      expect(titleTag?.getAttribute(HELMET_ATTRIBUTE)).toBe('itemprop');
    });
  });

  it('retains existing title tag when no title tag is defined', () => {
    document.head.innerHTML = `<title>Existing Title</title>`;

    renderClient(
      <Helmet>
        <meta name="keywords" content="stuff" />
      </Helmet>,
      clientCache
    );

    expect(document.title).toBe('Existing Title');
  });

  it.skip('clears title tag if empty title is defined', () => {
    renderClient(
      <Helmet>
        <title>Existing Title</title>
        <meta name="keywords" content="stuff" />
      </Helmet>,
      clientCache
    );

    expect(document.title).toBe('Existing Title');

    renderClient(
      <Helmet>
        <title />
        <meta name="keywords" content="stuff" />
      </Helmet>,
      clientCache
    );

    expect(document.title).toBe('');
  });
});
