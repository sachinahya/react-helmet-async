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

  describe('should render title tag', () => {
    const Component = () => (
      <Helmet>
        <title>Amazing Title</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Amazing Title';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Amazing Title');
    });
  });

  describe('should render title and allows children containing expressions', () => {
    const Component = () => (
      <Helmet>
        <title>Title: {`${'Some Great Title'}`} 1234</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Title: Some Great Title 1234';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Title: Some Great Title 1234');
    });
  });

  describe('should encode HTML characters in title', () => {
    const Component = () => (
      <Helmet>
        <title>{`Dangerous <script> include`}</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Dangerous &lt;script&gt; include';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Dangerous &lt;script&gt; include');
    });
  });

  describe('should still encode HTML characters in title with encoding disabled', () => {
    const Component = () => (
      <Helmet encodeSpecialCharacters={false}>
        <title>{`Dangerous <script> include`}</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Dangerous <script> include';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Dangerous <script> include');
    });
  });

  describe('should not encode non-HTML characters when opt out of string encoding', () => {
    const Component = () => (
      <Helmet encodeSpecialCharacters={false}>
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        <title>This is text and & and '.</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = `This is text and & and '.`;

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe(`This is text and & and '.`);
    });
  });

  describe('does not encode all characters with HTML character entity equivalents', () => {
    const Chinese = () => (
      <Helmet>
        <title>膣膗 鍆錌雔</title>
      </Helmet>
    );

    it('server', () => {
      renderServer(<Chinese />, serverCache);

      const head = serverCache.getOutput();

      const expected = '膣膗 鍆錌雔';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Chinese />, clientCache);

      expect(document.title).toBe('膣膗 鍆錌雔');
    });
  });

  describe('updates page title with multiple children', () => {
    const MultipleChildren = () => (
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
    );

    it('server', () => {
      renderServer(<MultipleChildren />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Child Two Title';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<MultipleChildren />, clientCache);

      expect(document.title).toBe('Child Two Title');
    });
  });

  describe('sets title using deepest nested component with a defined title', () => {
    const DeepestNestedDefinedTitle = () => (
      <>
        <Helmet>
          <title>Main Title</title>
        </Helmet>
        <Helmet />
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedDefinedTitle />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Main Title';

      expect(head.title.toString()).toBe(`<title data-rh="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-rh="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<DeepestNestedDefinedTitle />, clientCache);

      expect(document.title).toBe('Main Title');
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
