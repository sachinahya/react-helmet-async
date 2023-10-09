import React from 'react';
import ReactServer from 'react-dom/server';
import { Helmet } from '../../src';
import { renderServer } from './utils';
import { HelmetServerCache } from '../../src/server/server-cache';

Helmet.defaultProps.defer = false;

const isArray = {
  asymmetricMatch: actual => Array.isArray(actual),
};

describe('server', () => {
  it('provides initial values if no state is found', () => {
    const state = new HelmetServerCache();

    const NullComponent = () => null;
    renderServer(<NullComponent />, state);
    const head = state.getOutput();

    expect(head.meta).toBeDefined();
    expect(head.meta.toString).toBeDefined();
    expect(head.meta.toString()).toBe('');
  });

  it('encodes special characters in title', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title>{`Dangerous <script> include`}</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">Dangerous &lt;script&gt; include</title>"`
    );
  });

  it('opts out of string encoding', () => {
    const state = new HelmetServerCache();

    /* eslint-disable react/no-unescaped-entities */
    renderServer(
      <Helmet encodeSpecialCharacters={false}>
        <title>This is text and & and '.</title>
      </Helmet>,
      state
    );
    /* eslint-enable react/no-unescaped-entities */

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">This is text and & and '.</title>"`
    );
  });

  it('renders title with itemprop name as React component', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title itemProp="name">Title with Itemprop</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toElements).toBeDefined();

    const titleComponent = head.title.toElements();

    expect(titleComponent).toEqual(isArray);
    expect(titleComponent).toHaveLength(1);

    titleComponent.forEach(title => {
      expect(title).toEqual(expect.objectContaining({ type: 'title' }));
    });

    const markup = ReactServer.renderToStaticMarkup(titleComponent);

    expect(markup).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\" itemProp=\\"name\\">Title with Itemprop</title>"`
    );
  });

  it('renders title tag as string', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title>{'Dangerous <script> include'}</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">Dangerous &lt;script&gt; include</title>"`
    );
  });

  it('renders title and allows children containing expressions', () => {
    const state = new HelmetServerCache();

    const someValue = 'Some Great Title';

    renderServer(
      <Helmet>
        <title>Title: {someValue}</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">Title: Some Great Title</title>"`
    );
  });

  it('renders title with itemprop name as string', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title itemProp="name">Title with Itemprop</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();

    const titleString = head.title.toString();

    expect(titleString).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\" itemprop=\\"name\\">Title with Itemprop</title>"`
    );
  });

  it('does not encode all characters with HTML character entity equivalents', () => {
    const state = new HelmetServerCache();

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

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">膣膗 鍆錌雔</title>"`
    );
  });

  it('does html encode title', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title>{`Dangerous <script> include`}</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toString).toBeDefined();
    expect(head.title.toString()).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">Dangerous &lt;script&gt; include</title>"`
    );
  });

  it('renders title as React component', () => {
    const state = new HelmetServerCache();

    renderServer(
      <Helmet>
        <title>{`Dangerous <script> include`}</title>
      </Helmet>,
      state
    );

    const head = state.getOutput();

    expect(head.title).toBeDefined();
    expect(head.title.toElements).toBeDefined();

    const titleComponent = head.title.toElements();

    expect(titleComponent).toEqual(isArray);
    expect(titleComponent).toHaveLength(1);

    titleComponent.forEach(title => {
      expect(title).toEqual(expect.objectContaining({ type: 'title' }));
    });

    const markup = ReactServer.renderToStaticMarkup(titleComponent);

    expect(markup).toMatchInlineSnapshot(
      `"<title data-rh=\\"true\\">Dangerous &lt;script&gt; include</title>"`
    );
  });
});
