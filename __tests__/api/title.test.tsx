import React from 'react';
import { Helmet } from '../../src';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('title', () => {
  it('updates page title', () => {
    renderClient(
      <Helmet>
        <title>Test Title</title>
      </Helmet>
    );

    expect(document.title).toBe('Test Title');
  });

  it('updates page title and allows children containing expressions', () => {
    const someValue = 'Some Great Title';

    renderClient(
      <Helmet>
        <title>Title: {someValue}</title>
      </Helmet>
    );

    expect(document.title).toBe('Title: Some Great Title');
  });

  it('updates page title with multiple children', () => {
    renderClient(
      <div>
        <Helmet>
          <title>Test Title</title>
        </Helmet>
        <Helmet>
          <title>Child One Title</title>
        </Helmet>
        <Helmet>
          <title>Child Two Title</title>
        </Helmet>
      </div>
    );

    expect(document.title).toBe('Child Two Title');
  });

  it('sets title based on deepest nested component', () => {
    renderClient(
      <div>
        <Helmet>
          <title>Main Title</title>
        </Helmet>
        <Helmet>
          <title>Nested Title</title>
        </Helmet>
      </div>
    );

    expect(document.title).toBe('Nested Title');
  });

  it('sets title using deepest nested component with a defined title', () => {
    renderClient(
      <div>
        <Helmet>
          <title>Main Title</title>
        </Helmet>
        <Helmet />
      </div>
    );

    expect(document.title).toBe('Main Title');
  });

  it('does not encode all characters with HTML character entity equivalents', () => {
    const chineseTitle = '膣膗 鍆錌雔';

    renderClient(
      <Helmet>
        <title>{chineseTitle}</title>
      </Helmet>
    );

    expect(document.title).toBe('膣膗 鍆錌雔');
  });

  it('page title with prop itemProp', () => {
    renderClient(
      <Helmet>
        <title itemProp="name">Test Title with itemProp</title>
      </Helmet>
    );

    const titleTag = document.getElementsByTagName('title')[0];

    expect(document.title).toBe('Test Title with itemProp');
    expect(titleTag?.getAttribute('itemprop')).toBe('name');
  });

  it('retains existing title tag when no title tag is defined', () => {
    document.head.innerHTML = `<title>Existing Title</title>`;

    renderClient(
      <Helmet>
        <meta name="keywords" content="stuff" />
      </Helmet>
    );

    expect(document.title).toBe('Existing Title');
  });

  it.skip('clears title tag if empty title is defined', () => {
    renderClient(
      <Helmet>
        <title>Existing Title</title>
        <meta name="keywords" content="stuff" />
      </Helmet>
    );

    expect(document.title).toBe('Existing Title');

    renderClient(
      <Helmet>
        <title />
        <meta name="keywords" content="stuff" />
      </Helmet>
    );

    expect(document.title).toBe('');
  });
});
