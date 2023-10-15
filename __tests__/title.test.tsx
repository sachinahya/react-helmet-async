import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';
import { renderClient, renderResult, renderServer } from './utils';
import { TRACKING_ATTRIBUTE } from '../src/constants';

describe('title', () => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
  });

  describe('should render title tag', () => {
    const Component = () => (
      <Head>
        <title>Amazing Title</title>
      </Head>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Amazing Title';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Amazing Title');
    });
  });

  describe('should render title and allows children containing expressions', () => {
    const Component = () => (
      <Head>
        <title>Title: {`${'Some Great Title'}`} 1234</title>
      </Head>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Title: Some Great Title 1234';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Title: Some Great Title 1234');
    });
  });

  describe('should encode HTML characters in title', () => {
    const Component = () => (
      <Head>
        <title>{`Dangerous <script> include`}</title>
      </Head>
    );

    it('server', () => {
      renderServer(<Component />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Dangerous &lt;script&gt; include';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<Component />, clientCache);

      expect(document.title).toBe('Dangerous <script> include');
      expect(document.querySelector('title')?.outerHTML).toBe(
        '<title>Dangerous &lt;script&gt; include</title>'
      );
    });
  });

  describe('does not encode all characters with HTML character entity equivalents', () => {
    const Chinese = () => (
      <Head>
        <title>膣膗 鍆錌雔</title>
      </Head>
    );

    it('server', () => {
      renderServer(<Chinese />, serverCache);

      const head = serverCache.getOutput();

      const expected = '膣膗 鍆錌雔';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
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
        <Head>
          <title>Test Title</title>
        </Head>
        <Head>
          <title>Child One Title</title>
        </Head>
        <Head>
          <title>Child Two Title</title>
        </Head>
      </>
    );

    it('server', () => {
      renderServer(<MultipleChildren />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Child Two Title';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
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
        <Head>
          <title>Main Title</title>
        </Head>
        <Head />
      </>
    );

    it('server', () => {
      renderServer(<DeepestNestedDefinedTitle />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'Main Title';

      expect(head.title.toString()).toBe(`<title data-ht="true">${expected}</title>`);
      expect(renderResult(head.title.toElements())).toBe(
        `<title data-ht="true">${expected}</title>`
      );
    });

    it('client', () => {
      renderClient(<DeepestNestedDefinedTitle />, clientCache);

      expect(document.title).toBe('Main Title');
    });
  });

  describe('should render title with itemprop name as string', () => {
    const TitleWithItemProp = () => (
      <Head>
        <title itemProp="name">Title with Itemprop</title>
      </Head>
    );

    it('server', () => {
      renderServer(<TitleWithItemProp />, serverCache);

      const head = serverCache.getOutput();

      expect(head.title.toString()).toBe(
        '<title data-ht="true" itemprop="name">Title with Itemprop</title>'
      );
      expect(renderResult(head.title.toElements())).toBe(
        '<title data-ht="true" itemProp="name">Title with Itemprop</title>'
      );
    });

    it('client', () => {
      renderClient(<TitleWithItemProp />, clientCache);

      const titleTag = document.querySelector('title');

      expect(document.title).toBe('Title with Itemprop');
      expect(titleTag?.getAttribute('itemProp')).toBe('name');
      expect(titleTag?.getAttribute(TRACKING_ATTRIBUTE)).toBe('itemprop');
    });
  });

  describe('client updates', () => {
    it('clears title tag when updated with empty title', () => {
      renderClient(
        <Head>
          <title>Existing Title</title>
          <meta name="keywords" content="stuff" />
        </Head>,
        clientCache
      );

      expect(document.title).toBe('Existing Title');

      renderClient(
        <Head>
          <title />
          <meta name="keywords" content="stuff" />
        </Head>,
        clientCache
      );

      expect(document.title).toBe('');
    });

    it('clears title tag when updated with no title', () => {
      renderClient(
        <Head>
          <title>Existing Title</title>
          <meta name="keywords" content="stuff" />
        </Head>,
        clientCache
      );

      expect(document.title).toBe('Existing Title');

      renderClient(
        <Head>
          <meta name="keywords" content="stuff" />
        </Head>,
        clientCache
      );

      expect(document.title).toBe('');
    });
  });
});
