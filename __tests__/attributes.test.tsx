import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { TRACKING_ATTRIBUTE } from '../src/constants';
import { HeadServerCache } from '../src/server/server-cache';
import { renderClient, renderResult, renderServer } from './utils';

describe.each([
  {
    tag: 'body',
    cacheKey: 'bodyAttributes',
    getElement: () => document.body,
  },
  {
    tag: 'html',
    cacheKey: 'htmlAttributes',
    getElement: () => document.documentElement,
  },
] as const)('$tag attributes', ({ tag: Component, cacheKey, getElement }) => {
  let serverCache: HeadServerCache;
  let clientCache: HeadClientCache;

  beforeEach(() => {
    serverCache = new HeadServerCache();
    clientCache = new HeadClientCache({ sync: true });
    document.head.innerHTML = `<title>Test Title</title>`;
  });

  describe('updates attributes', () => {
    const Attributes = () => (
      <Head>
        <Component lang="ga" className="myClassName" />
      </Head>
    );

    it('server', () => {
      renderServer(<Attributes />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'lang="ga" class="myClassName"';

      expect(head[cacheKey].toString()).toBe(expected);

      expect(renderResult(<Component {...head[cacheKey].toProps()} />)).toBe(
        `<${Component} ${expected}></${Component}>`
      );
    });

    it('client', () => {
      renderClient(<Attributes />, clientCache);

      const element = getElement();

      expect(element.getAttribute('lang')).toBe('ga');
      expect(element.getAttribute('class')).toBe('myClassName');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('lang,class');
    });
  });

  describe('sets attributes based on the deepest nested component', () => {
    const DeepestNested = () => (
      <div>
        <Head>
          <Component lang="en" />
        </Head>
        <Head>
          <Component lang="ja" />
        </Head>
      </div>
    );

    it('server', () => {
      renderServer(<DeepestNested />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'lang="ja"';

      expect(head[cacheKey].toString()).toBe(expected);

      expect(renderResult(<Component {...head[cacheKey].toProps()} />)).toBe(
        `<${Component} ${expected}></${Component}>`
      );
    });

    it('client', () => {
      renderClient(<DeepestNested />, clientCache);

      const element = getElement();

      expect(element.getAttribute('lang')).toBe('ja');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('lang');
    });
  });

  describe('should not render undefined attribute values', () => {
    const ValuelessAttributes = () => (
      <Head>
        <Component about={undefined} draggable />
      </Head>
    );

    it('server', () => {
      renderServer(<ValuelessAttributes />, serverCache);

      const head = serverCache.getOutput();

      const expected = 'draggable="true"';

      expect(head[cacheKey].toString()).toBe(expected);

      expect(renderResult(<Component {...head[cacheKey].toProps()} />)).toBe(
        `<${Component} ${expected}></${Component}>`
      );
    });

    it('client', () => {
      renderClient(<ValuelessAttributes />, clientCache);

      const element = getElement();

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('draggable')).toBe('true');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('draggable');
    });
  });

  describe('updates on client', () => {
    describe('initialized outside of Head', () => {
      beforeEach(() => {
        const element = getElement();

        element.setAttribute('about', 'about');
      });

      it('attributes are not cleared', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();

        renderClient(<Head />, clientCache);

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();
      });

      it('overwritten if specified in Head', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();

        renderClient(
          <Head>
            <Component about="head-attr" />
          </Head>,
          clientCache
        );

        expect(element.getAttribute('about')).toBe('head-attr');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('about');
      });

      it('cleared once it is managed in head', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();

        renderClient(
          <Head>
            <Component about="head-attr" />
          </Head>,
          clientCache
        );

        expect(element.getAttribute('about')).toBe('head-attr');
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('about');

        renderClient(<Head />, clientCache);

        expect(element.getAttribute('about')).toBeNull();
        expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();
      });
    });

    it('clears html attributes that are handled within head', () => {
      renderClient(
        <Head>
          <Component lang="en" about={undefined} draggable />
        </Head>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('about')).toBeNull();

      expect(element.getAttribute('lang')).not.toBeNull();
      expect(element.getAttribute('draggable')).not.toBeNull();
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).not.toBeNull();

      renderClient(<Head />, clientCache);

      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('draggable')).toBeNull();
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBeNull();
    });

    it('updates with multiple additions and removals - overwrite and new', () => {
      renderClient(
        <Head>
          <Component lang="en" draggable />
        </Head>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('draggable')).toBe('true');

      renderClient(
        <Head>
          <Component lang="ja" id="html-tag" title="html tag" />
        </Head>,
        clientCache
      );

      expect(element.getAttribute('draggable')).toBeNull();
      expect(element.getAttribute('lang')).toBe('ja');
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('lang,id,title');
    });

    it('updates with multiple additions and removals - all new', () => {
      renderClient(
        <Head>
          <Component lang="en" draggable />
        </Head>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('draggable')).toBe('true');

      renderClient(
        <Head>
          <Component id="html-tag" title="html tag" />
        </Head>,
        clientCache
      );

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('id,title');
    });

    it('updates with multiple additions and removals - all new with undefined attributes', () => {
      renderClient(
        <Head>
          <Component lang="en" about={undefined} />
        </Head>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBe('en');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('lang');

      renderClient(
        <Head>
          <Component id="html-tag" title="html tag" />
        </Head>,
        clientCache
      );

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(TRACKING_ATTRIBUTE)).toBe('id,title');
    });
  });
});
