import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { HelmetServerCache } from '../src/server/server-cache';
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
  let serverCache: HelmetServerCache;
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
    clientCache = new HelmetClientCache({ sync: true });
    document.head.innerHTML = `<title>Test Title</title>`;
  });

  describe('updates attributes', () => {
    const Attributes = () => (
      <Helmet>
        <Component lang="ga" className="myClassName" />
      </Helmet>
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
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('lang,class');
    });
  });

  describe('sets attributes based on the deepest nested component', () => {
    const DeepestNested = () => (
      <div>
        <Helmet>
          <Component lang="en" />
        </Helmet>
        <Helmet>
          <Component lang="ja" />
        </Helmet>
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
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('lang');
    });
  });

  describe('should not render undefined attribute values', () => {
    const ValuelessAttributes = () => (
      <Helmet>
        <Component about={undefined} draggable />
      </Helmet>
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
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('draggable');
    });
  });

  describe('updates on client', () => {
    describe('initialized outside of helmet', () => {
      beforeEach(() => {
        const element = getElement();

        element.setAttribute('about', 'about');
      });

      it('attributes are not cleared', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

        renderClient(<Helmet />, clientCache);

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
      });

      it('overwritten if specified in helmet', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

        renderClient(
          <Helmet>
            <Component about="helmet-attr" />
          </Helmet>,
          clientCache
        );

        expect(element.getAttribute('about')).toBe('helmet-attr');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('about');
      });

      it('cleared once it is managed in helmet', () => {
        const element = getElement();

        expect(element.getAttribute('about')).toBe('about');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

        renderClient(
          <Helmet>
            <Component about="helmet-attr" />
          </Helmet>,
          clientCache
        );

        expect(element.getAttribute('about')).toBe('helmet-attr');
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('about');

        renderClient(<Helmet />, clientCache);

        expect(element.getAttribute('about')).toBeNull();
        expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
      });
    });

    it('clears html attributes that are handled within helmet', () => {
      renderClient(
        <Helmet>
          <Component lang="en" about={undefined} draggable />
        </Helmet>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('about')).toBeNull();

      expect(element.getAttribute('lang')).not.toBeNull();
      expect(element.getAttribute('draggable')).not.toBeNull();
      expect(element.getAttribute(HELMET_ATTRIBUTE)).not.toBeNull();

      renderClient(<Helmet />, clientCache);

      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('draggable')).toBeNull();
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
    });

    it('updates with multiple additions and removals - overwrite and new', () => {
      renderClient(
        <Helmet>
          <Component lang="en" draggable />
        </Helmet>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('draggable')).toBe('true');

      renderClient(
        <Helmet>
          <Component lang="ja" id="html-tag" title="html tag" />
        </Helmet>,
        clientCache
      );

      expect(element.getAttribute('draggable')).toBeNull();
      expect(element.getAttribute('lang')).toBe('ja');
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('lang,id,title');
    });

    it('updates with multiple additions and removals - all new', () => {
      renderClient(
        <Helmet>
          <Component lang="en" draggable />
        </Helmet>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('draggable')).toBe('true');

      renderClient(
        <Helmet>
          <Component id="html-tag" title="html tag" />
        </Helmet>,
        clientCache
      );

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('id,title');
    });

    it('updates with multiple additions and removals - all new with undefined attributes', () => {
      renderClient(
        <Helmet>
          <Component lang="en" about={undefined} />
        </Helmet>,
        clientCache
      );

      const element = getElement();

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBe('en');
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('lang');

      renderClient(
        <Helmet>
          <Component id="html-tag" title="html tag" />
        </Helmet>,
        clientCache
      );

      expect(element.getAttribute('about')).toBeNull();
      expect(element.getAttribute('lang')).toBeNull();
      expect(element.getAttribute('id')).toBe('html-tag');
      expect(element.getAttribute('title')).toBe('html tag');
      expect(element.getAttribute(HELMET_ATTRIBUTE)).toBe('id,title');
    });
  });
});
