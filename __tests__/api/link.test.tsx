import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('link tags', () => {
  it('clears all link tags if none are specified', () => {
    renderClient(
      <Helmet>
        <link href="http://localhost/helmet" rel="canonical" />
      </Helmet>
    );

    expect(document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`)).toHaveLength(1);

    renderClient(<Helmet />);

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(0);
  });

  it("tags without 'href' or 'rel' are not accepted, even if they are valid for other tags", () => {
    renderClient(
      <Helmet>
        <link httpEquiv="won't work" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(0);
  });

  it("tags 'rel' and 'href' properly use 'rel' as the primary identification for this tag, regardless of ordering", () => {
    renderClient(
      <div>
        <Helmet>
          <link href="http://localhost/helmet" rel="canonical" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/new" />
        </Helmet>
        <Helmet>
          <link href="http://localhost/helmet/newest" rel="canonical" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(1);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('rel')).toBe('canonical');
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/newest');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/helmet/newest\\" rel=\\"canonical\\" data-rh=\\"true\\">"`
    );
  });

  it("tags with rel='stylesheet' uses the href as the primary identification of the tag, regardless of ordering", () => {
    renderClient(
      <div>
        <Helmet>
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
        <Helmet>
          <link rel="stylesheet" href="http://localhost/inner.css" type="text/css" media="all" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/style.css');
    expect(firstTag?.getAttribute('rel')).toBe('stylesheet');
    expect(firstTag?.getAttribute('type')).toBe('text/css');
    expect(firstTag?.getAttribute('media')).toBe('all');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/style.css\\" rel=\\"stylesheet\\" type=\\"text/css\\" media=\\"all\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('rel')).toBe('stylesheet');
    expect(secondTag?.getAttribute('href')).toBe('http://localhost/inner.css');
    expect(secondTag?.getAttribute('type')).toBe('text/css');
    expect(secondTag?.getAttribute('media')).toBe('all');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"stylesheet\\" href=\\"http://localhost/inner.css\\" type=\\"text/css\\" media=\\"all\\" data-rh=\\"true\\">"`
    );
  });

  it('sets link tags based on deepest nested component', () => {
    renderClient(
      <div>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
          <link href="http://localhost/style.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
          <link href="http://localhost/inner.css" rel="stylesheet" type="text/css" media="all" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];
    const thirdTag = tagNodes[2];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(3);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/style.css');
    expect(firstTag?.getAttribute('rel')).toBe('stylesheet');
    expect(firstTag?.getAttribute('type')).toBe('text/css');
    expect(firstTag?.getAttribute('media')).toBe('all');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/style.css\\" rel=\\"stylesheet\\" type=\\"text/css\\" media=\\"all\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
    expect(secondTag?.getAttribute('rel')).toBe('canonical');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/innercomponent\\" data-rh=\\"true\\">"`
    );

    expect(thirdTag).toBeInstanceOf(Element);
    expect(thirdTag?.getAttribute).toBeDefined();
    expect(thirdTag?.getAttribute('href')).toBe('http://localhost/inner.css');
    expect(thirdTag?.getAttribute('rel')).toBe('stylesheet');
    expect(thirdTag?.getAttribute('type')).toBe('text/css');
    expect(thirdTag?.getAttribute('media')).toBe('all');
    expect(thirdTag?.outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/inner.css\\" rel=\\"stylesheet\\" type=\\"text/css\\" media=\\"all\\" data-rh=\\"true\\">"`
    );
  });

  it('allows duplicate link tags if specified in the same component', () => {
    renderClient(
      <Helmet>
        <link rel="canonical" href="http://localhost/helmet" />
        <link rel="canonical" href="http://localhost/helmet/component" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('rel')).toBe('canonical');
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('rel')).toBe('canonical');
    expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/component');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/component\\" data-rh=\\"true\\">"`
    );
  });

  it('overrides duplicate link tags with a single link tag in a nested component', () => {
    renderClient(
      <div>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
          <link rel="canonical" href="http://localhost/helmet/component" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(1);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('rel')).toBe('canonical');
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/innercomponent\\" data-rh=\\"true\\">"`
    );
  });

  it('overrides single link tag with duplicate link tags in a nested component', () => {
    renderClient(
      <div>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet" />
        </Helmet>
        <Helmet>
          <link rel="canonical" href="http://localhost/helmet/component" />
          <link rel="canonical" href="http://localhost/helmet/innercomponent" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('rel')).toBe('canonical');
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/component');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/component\\" data-rh=\\"true\\">"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('rel')).toBe('canonical');
    expect(secondTag?.getAttribute('href')).toBe('http://localhost/helmet/innercomponent');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/innercomponent\\" data-rh=\\"true\\">"`
    );
  });

  it('does not render tag when primary attribute is null', () => {
    renderClient(
      <Helmet>
        <link rel="icon" sizes="192x192" href={null} />
        <link rel="canonical" href="http://localhost/helmet/component" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(1);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('rel')).toBe('canonical');
    expect(firstTag?.getAttribute('href')).toBe('http://localhost/helmet/component');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<link rel=\\"canonical\\" href=\\"http://localhost/helmet/component\\" data-rh=\\"true\\">"`
    );
  });

  it('updates link tags', () => {
    renderClient(
      <Helmet>
        <link href="http://localhost/helmet" rel="canonical" />
        <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`link[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toBeDefined();

    const filteredTags = [...tagNodes].filter(
      tag =>
        (tag.getAttribute('href') === 'http://localhost/style.css' &&
          tag.getAttribute('rel') === 'stylesheet' &&
          tag.getAttribute('type') === 'text/css') ||
        (tag.getAttribute('href') === 'http://localhost/helmet' &&
          tag.getAttribute('rel') === 'canonical')
    );

    expect(filteredTags).toHaveLength(2);
  });
});
