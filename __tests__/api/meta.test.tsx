import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { render } from './utils';

/* eslint-disable no-console */

Helmet.defaultProps.defer = false;

describe('meta tags', () => {
  it('updates meta tags', () => {
    render(
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content="Test description" />
        <meta httpEquiv="content-type" content="text/html" />
        <meta property="og:type" content="article" />
        <meta itemProp="name" content="Test name itemprop" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toBeDefined();

    const filteredTags = [...tagNodes].filter(
      tag =>
        tag.getAttribute('charset') === 'utf-8' ||
        (tag.getAttribute('name') === 'description' &&
          tag.getAttribute('content') === 'Test description') ||
        (tag.getAttribute('http-equiv') === 'content-type' &&
          tag.getAttribute('content') === 'text/html') ||
        (tag.getAttribute('itemprop') === 'name' &&
          tag.getAttribute('content') === 'Test name itemprop')
    );

    expect(filteredTags).toHaveLength(4);
  });

  it('clears all meta tags if none are specified', () => {
    render(
      <Helmet>
        <meta name="description" content="Test description" />
      </Helmet>
    );

    expect(document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`)).toHaveLength(1);

    render(<Helmet />);

    const existingTags = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it("tags without 'name', 'http-equiv', 'property', 'charset', or 'itemprop' are not accepted", () => {
    render(
      <Helmet>
        <meta id="won't work" />
      </Helmet>
    );

    const existingTags = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it('sets meta tags based on deepest nested component', () => {
    render(
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <meta name="description" content="Test description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
          <meta name="keywords" content="test,meta,tags" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);

    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];
    const thirdTag = tagNodes[2];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(3);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('charset')).toBe('utf-8');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta charset=\\"utf-8\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('name')).toBe('description');
    expect(secondTag?.getAttribute('content')).toBe('Inner description');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Inner description\\" data-rh=\\"true\\">"`
    );

    expect(thirdTag).toBeInstanceOf(Element);
    expect(thirdTag?.getAttribute).toBeDefined();
    expect(thirdTag?.getAttribute('name')).toBe('keywords');
    expect(thirdTag?.getAttribute('content')).toBe('test,meta,tags');
    expect(thirdTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"keywords\\" content=\\"test,meta,tags\\" data-rh=\\"true\\">"`
    );
  });

  it('allows duplicate meta tags if specified in the same component', () => {
    render(
      <Helmet>
        <meta name="description" content="Test description" />
        <meta name="description" content="Duplicate description" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('name')).toBe('description');
    expect(firstTag?.getAttribute('content')).toBe('Test description');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Test description\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('name')).toBe('description');
    expect(secondTag?.getAttribute('content')).toBe('Duplicate description');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Duplicate description\\" data-rh=\\"true\\">"`
    );
  });

  it('overrides duplicate meta tags with single meta tag in a nested component', () => {
    render(
      <div>
        <Helmet>
          <meta name="description" content="Test description" />
          <meta name="description" content="Duplicate description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(1);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('name')).toBe('description');
    expect(firstTag?.getAttribute('content')).toBe('Inner description');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Inner description\\" data-rh=\\"true\\">"`
    );
  });

  it('overrides single meta tag with duplicate meta tags in a nested component', () => {
    render(
      <div>
        <Helmet>
          <meta name="description" content="Test description" />
        </Helmet>
        <Helmet>
          <meta name="description" content="Inner description" />
          <meta name="description" content="Inner duplicate description" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('name')).toBe('description');
    expect(firstTag?.getAttribute('content')).toBe('Inner description');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Inner description\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('name')).toBe('description');
    expect(secondTag?.getAttribute('content')).toBe('Inner duplicate description');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Inner duplicate description\\" data-rh=\\"true\\">"`
    );
  });

  it('does not render tag when primary attribute is null', () => {
    render(
      <Helmet>
        <meta name={undefined} content="Inner duplicate description" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toHaveLength(0);
  });
});
