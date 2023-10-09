import React from 'react';
import { Helmet } from '../src';
import { renderClient } from './api/utils';

Helmet.defaultProps.defer = false;

describe('fragments', () => {
  it('parses Fragments', () => {
    renderClient(
      <Helmet>
        <>
          <title>Hello</title>
          <meta charSet="utf-8" />
        </>
      </Helmet>
    );

    expect(document.title).toMatchInlineSnapshot(`"Hello"`);
  });

  it('parses nested Fragments', () => {
    renderClient(
      <Helmet>
        <>
          <title>Foo</title>
          <>
            <title>Bar</title>
            <title>Baz</title>
          </>
        </>
      </Helmet>
    );

    expect(document.title).toMatchInlineSnapshot(`"Baz"`);
  });
});
