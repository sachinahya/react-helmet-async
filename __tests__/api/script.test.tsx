import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('script tags', () => {
  it('updates script tags', () => {
    const scriptInnerHTML = `
          {
            "@context": "http://schema.org",
            "@type": "NewsArticle",
            "url": "http://localhost/helmet"
          }
        `;
    renderClient(
      <Helmet>
        <script src="http://localhost/test.js" type="text/javascript" />
        <script src="http://localhost/test2.js" type="text/javascript" />
        <script type="application/ld+json">{scriptInnerHTML}</script>
      </Helmet>
    );

    const existingTags = document.head.getElementsByTagName('script');

    expect(existingTags).toBeDefined();

    const filteredTags = [...existingTags].filter(
      tag =>
        (tag.getAttribute('src') === 'http://localhost/test.js' &&
          tag.getAttribute('type') === 'text/javascript') ||
        (tag.getAttribute('src') === 'http://localhost/test2.js' &&
          tag.getAttribute('type') === 'text/javascript') ||
        (tag.getAttribute('type') === 'application/ld+json' && tag.innerHTML === scriptInnerHTML)
    );

    expect(filteredTags).toHaveLength(3);
  });

  it('clears all scripts tags if none are specified', () => {
    renderClient(
      <Helmet>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>
    );

    expect(document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`)).toHaveLength(1);

    renderClient(<Helmet />);

    const existingTags = document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it("tags without 'src' are not accepted", () => {
    renderClient(
      <Helmet>
        <script id="won't work" />
      </Helmet>
    );

    const existingTags = document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it('sets script tags based on deepest nested component', () => {
    renderClient(
      <div>
        <Helmet>
          <script src="http://localhost/test.js" type="text/javascript" />
          <script src="http://localhost/test2.js" type="text/javascript" />
        </Helmet>
      </div>
    );

    const tagNodes = document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`);
    const firstTag = tagNodes[0];
    const secondTag = tagNodes[1];

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('src')).toBe('http://localhost/test.js');
    expect(firstTag?.getAttribute('type')).toBe('text/javascript');
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(
      `"<script src=\\"http://localhost/test.js\\" type=\\"text/javascript\\" data-rh=\\"true\\"></script>"`
    );

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.getAttribute).toBeDefined();
    expect(secondTag?.getAttribute('src')).toBe('http://localhost/test2.js');
    expect(secondTag?.getAttribute('type')).toBe('text/javascript');
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(
      `"<script src=\\"http://localhost/test2.js\\" type=\\"text/javascript\\" data-rh=\\"true\\"></script>"`
    );
  });

  it('sets undefined attribute values to empty strings', () => {
    renderClient(
      <Helmet>
        <script src="foo.js" async={undefined} />
      </Helmet>
    );

    const existingTag = document.head.querySelector(`script[${HELMET_ATTRIBUTE}]`);

    expect(existingTag).toBeDefined();
    expect(existingTag?.outerHTML).toMatchInlineSnapshot(
      `"<script src=\\"foo.js\\" async=\\"\\" data-rh=\\"true\\"></script>"`
    );
  });

  it('does not render tag when primary attribute (src) is null', () => {
    renderClient(
      <Helmet>
        <script src={undefined} type="text/javascript" />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toHaveLength(0);
  });

  it('does not render tag when primary attribute (innerHTML) is null', () => {
    renderClient(
      <Helmet>
        <script />
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`script[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toHaveLength(0);
  });
});
