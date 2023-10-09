import React from 'react';
import { Helmet } from '../src';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { renderClient } from './api/utils';

Helmet.defaultProps.defer = false;

describe('misc', () => {
  it('does not accept nested Helmets', () => {
    const consoleError = global.console.error;
    global.console.error = jest.fn();

    const renderInvalid = () => {
      renderClient(
        <Helmet>
          <title>Test Title</title>
          <Helmet>
            <title>Title you will never see</title>
          </Helmet>
        </Helmet>
      );
    };

    expect(renderInvalid).toThrow(Error);

    global.console.error = consoleError;
  });

  it('encodes special characters', () => {
    renderClient(
      <Helmet>
        <meta name="description" content={'This is "quoted" text and & and \'.'} />
      </Helmet>
    );

    const existingTags = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);
    const existingTag = existingTags[0];

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(1);

    expect(existingTag).toBeInstanceOf(Element);
    expect(existingTag?.getAttribute).toBeDefined();
    expect(existingTag?.getAttribute('name')).toBe('description');
    expect(existingTag?.getAttribute('content')).toBe('This is "quoted" text and & and \'.');
    expect(existingTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"This is &quot;quoted&quot; text and &amp; and '.\\" data-rh=\\"true\\">"`
    );
  });

  it('does not change the DOM if it recevies identical props', () => {
    const onChange = jest.fn();
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <meta name="description" content="Test description" />
        <title>Test Title</title>
      </Helmet>
    );

    // Re-rendering will pass new props to an already mounted Helmet
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <meta name="description" content="Test description" />
        <title>Test Title</title>
      </Helmet>
    );

    expect(onChange.mock.calls).toHaveLength(1);
  });

  it('does not write the DOM if the client and server are identical', () => {
    document.head.innerHTML = `<script ${HELMET_ATTRIBUTE}="true" src="http://localhost/test.js" type="text/javascript" />`;

    const onChange = jest.fn();
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>
    );

    expect(onChange).toHaveBeenCalled();

    const [, addedTags, removedTags] = onChange.mock.calls[0];

    expect(addedTags).toEqual({});
    expect(removedTags).toEqual({});
  });

  it('only adds new tags and preserves tags when rendering additional Helmet instances', () => {
    const onChange = jest.fn();
    let addedTags;
    let removedTags;
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
        <meta name="description" content="Test description" />
      </Helmet>
    );

    expect(onChange).toHaveBeenCalled();

    /* eslint-disable prefer-destructuring */
    addedTags = onChange.mock.calls[0][1];
    removedTags = onChange.mock.calls[0][2];
    /* eslint-enable prefer-destructuring */

    expect(addedTags).toHaveProperty('metaTags');
    expect(addedTags.metaTags[0]).toBeDefined();
    expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Test description\\" data-rh=\\"true\\">"`
    );
    expect(addedTags).toHaveProperty('linkTags');
    expect(addedTags.linkTags[0]).toBeDefined();
    expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/style.css\\" rel=\\"stylesheet\\" type=\\"text/css\\" data-rh=\\"true\\">"`
    );
    expect(removedTags).toEqual({});

    // Re-rendering will pass new props to an already mounted Helmet
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
        <link href="http://localhost/style2.css" rel="stylesheet" type="text/css" />
        <meta name="description" content="New description" />
      </Helmet>
    );

    expect(onChange.mock.calls).toHaveLength(2);

    /* eslint-disable prefer-destructuring */
    addedTags = onChange.mock.calls[1][1];
    removedTags = onChange.mock.calls[1][2];
    /* eslint-enable prefer-destructuring */

    expect(addedTags).toHaveProperty('metaTags');
    expect(addedTags.metaTags[0]).toBeDefined();
    expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"New description\\" data-rh=\\"true\\">"`
    );
    expect(addedTags).toHaveProperty('linkTags');
    expect(addedTags.linkTags[0]).toBeDefined();
    expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
      `"<link href=\\"http://localhost/style2.css\\" rel=\\"stylesheet\\" type=\\"text/css\\" data-rh=\\"true\\">"`
    );
    expect(removedTags).toHaveProperty('metaTags');
    expect(removedTags.metaTags[0]).toBeDefined();
    expect(removedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name=\\"description\\" content=\\"Test description\\" data-rh=\\"true\\">"`
    );
    expect(removedTags).not.toHaveProperty('linkTags');
  });

  it('throws on invalid elements', () => {
    const consoleError = global.console.error;
    global.console.error = jest.fn();

    const renderInvalid = () => {
      renderClient(
        <Helmet>
          <title>Test Title</title>
          <div>
            <title>Title you will never see</title>
          </div>
        </Helmet>
      );
    };

    expect(renderInvalid).toThrow(Error);

    global.console.error = consoleError;
  });

  it('throws on invalid self-closing elements', () => {
    const consoleError = global.console.error;
    global.console.error = jest.fn();

    const renderInvalid = () => {
      renderClient(
        <Helmet>
          <title>Test Title</title>
          <div data-custom-attribute />
        </Helmet>
      );
    };

    expect(renderInvalid).toThrow(Error);

    global.console.error = consoleError;
  });

  it('throws on invalid strings as children', () => {
    const consoleError = global.console.error;
    global.console.error = jest.fn();

    const renderInvalid = () => {
      /* eslint-disable react/void-dom-elements-no-children */
      renderClient(
        <Helmet>
          <title>Test Title</title>
          <link href="http://localhost/helmet" rel="canonical">
            test
          </link>
        </Helmet>
      );
      /* eslint-enable react/void-dom-elements-no-children */
    };

    expect(renderInvalid).toThrow(Error);

    global.console.error = consoleError;
  });

  it('throws on invalid children', () => {
    const consoleError = global.console.error;
    global.console.error = jest.fn();

    const renderInvalid = () => {
      renderClient(
        <Helmet>
          <title>Test Title</title>
          <script>
            <title>Title you will never see</title>
          </script>
        </Helmet>
      );
    };

    expect(renderInvalid).toThrow(Error);

    global.console.error = consoleError;
  });

  it('handles undefined children', () => {
    const charSet = undefined;

    renderClient(
      <Helmet>
        {charSet && <meta charSet={charSet} />}
        <title>Test Title</title>
      </Helmet>
    );

    expect(document.title).toBe('Test Title');
  });

  it('recognizes valid tags regardless of attribute ordering', () => {
    renderClient(
      <Helmet>
        <meta content="Test Description" name="description" />
      </Helmet>
    );

    const existingTags = document.head.querySelectorAll(`meta[${HELMET_ATTRIBUTE}]`);
    const existingTag = existingTags[0];

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(1);

    expect(existingTag).toBeInstanceOf(Element);
    expect(existingTag?.getAttribute).toBeDefined();
    expect(existingTag?.getAttribute('name')).toBe('description');
    expect(existingTag?.getAttribute('content')).toBe('Test Description');
    expect(existingTag?.outerHTML).toMatchInlineSnapshot(
      `"<meta content=\\"Test Description\\" name=\\"description\\" data-rh=\\"true\\">"`
    );
  });
});
