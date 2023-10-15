import { Helmet } from '../src/Helmet';
import { HelmetServerCache } from '../src/server/server-cache';
import { renderResult, renderServer } from './utils';

describe('server', () => {
  let serverCache: HelmetServerCache;

  beforeEach(() => {
    serverCache = new HelmetServerCache();
  });

  it('should provide an empty server output when no tags were rendered', () => {
    renderServer(<div />, serverCache);

    const head = serverCache.getOutput();

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
      serverCache
    );

    const head = serverCache.getOutput();

    const expected = '<script data-rh="true" src="foo.js"></script>';

    expect(head.script.toString()).toBe(expected);
    expect(renderResult(head.script.toElements())).toBe(expected);
  });
});
