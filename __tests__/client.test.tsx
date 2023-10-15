import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('client', () => {
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    clientCache = new HelmetClientCache();
  });

  describe('onChangeClientState', () => {
    it('when handling client state change, calls the function with new state, addedTags and removedTags', () => {
      const onChange = jest.fn();
      renderClient(
        <div>
          <Helmet onChangeClientState={onChange}>
            <base href="http://mysite.com/" />
            <link href="http://localhost/helmet" rel="canonical" />
            <meta charSet="utf-8" />
            <script src="http://localhost/test.js" type="text/javascript" />
            <title>Main Title</title>
          </Helmet>
        </div>,
        clientCache
      );

      expect(onChange).toHaveBeenCalled();

      const newState = onChange.mock.calls[0][0];
      const addedTags = onChange.mock.calls[0][1];
      const removedTags = onChange.mock.calls[0][2];

      expect(newState).toEqual(expect.objectContaining({ title: 'Main Title' }));
      expect(newState.base[0]).toEqual(
        expect.objectContaining({
          href: 'http://mysite.com/',
        })
      );
      expect(newState.meta[0]).toEqual(expect.objectContaining({ charSet: 'utf-8' }));
      expect(newState.link[0]).toEqual(
        expect.objectContaining({
          href: 'http://localhost/helmet',
          rel: 'canonical',
        })
      );
      expect(newState.script[0]).toEqual(
        expect.objectContaining({
          src: 'http://localhost/test.js',
          type: 'text/javascript',
        })
      );

      expect(addedTags.baseTag).toBeDefined();
      expect(addedTags.baseTag[0]).toBeDefined();
      expect(addedTags.baseTag[0].outerHTML).toMatchInlineSnapshot(
        `"<base href="http://mysite.com/" data-rh="true">"`
      );

      expect(addedTags.metaTags).toBeDefined();
      expect(addedTags.metaTags[0]).toBeDefined();
      expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
        `"<meta charset="utf-8" data-rh="true">"`
      );

      expect(addedTags.linkTags).toBeDefined();
      expect(addedTags.linkTags[0]).toBeDefined();
      expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
        `"<link href="http://localhost/helmet" rel="canonical" data-rh="true">"`
      );

      expect(addedTags.scriptTags).toBeDefined();
      expect(addedTags.scriptTags[0]).toBeDefined();
      expect(addedTags.scriptTags[0].outerHTML).toMatchInlineSnapshot(
        `"<script src="http://localhost/test.js" type="text/javascript" data-rh="true"></script>"`
      );

      expect(removedTags).toEqual({});
    });

    it('does not change the DOM if it receives identical props', () => {
      const onChange = jest.fn();
      renderClient(
        <Helmet onChangeClientState={onChange}>
          <meta name="description" content="Test description" />
          <title>Test Title</title>
        </Helmet>,
        clientCache
      );

      // Re-rendering will pass new props to an already mounted Helmet
      renderClient(
        <Helmet onChangeClientState={onChange}>
          <meta name="description" content="Test description" />
          <title>Test Title</title>
        </Helmet>,
        clientCache
      );

      expect(onChange.mock.calls).toHaveLength(1);
    });
  });

  it('does not write the DOM if the client and server are identical', () => {
    document.head.innerHTML = `<script ${HELMET_ATTRIBUTE}="true" src="http://localhost/test.js" type="text/javascript" />`;

    const onChange = jest.fn();
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>,
      clientCache
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
      </Helmet>,
      clientCache
    );

    expect(onChange).toHaveBeenCalled();

    /* eslint-disable prefer-destructuring */
    addedTags = onChange.mock.calls[0][1];
    removedTags = onChange.mock.calls[0][2];
    /* eslint-enable prefer-destructuring */

    expect(addedTags).toHaveProperty('metaTags');
    expect(addedTags.metaTags[0]).toBeDefined();
    expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name="description" content="Test description" data-rh="true">"`
    );
    expect(addedTags).toHaveProperty('linkTags');
    expect(addedTags.linkTags[0]).toBeDefined();
    expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
      `"<link href="http://localhost/style.css" rel="stylesheet" type="text/css" data-rh="true">"`
    );
    expect(removedTags).toEqual({});

    // Re-rendering will pass new props to an already mounted Helmet
    renderClient(
      <Helmet onChangeClientState={onChange}>
        <link href="http://localhost/style.css" rel="stylesheet" type="text/css" />
        <link href="http://localhost/style2.css" rel="stylesheet" type="text/css" />
        <meta name="description" content="New description" />
      </Helmet>,
      clientCache
    );

    expect(onChange.mock.calls).toHaveLength(2);

    /* eslint-disable prefer-destructuring */
    addedTags = onChange.mock.calls[1][1];
    removedTags = onChange.mock.calls[1][2];
    /* eslint-enable prefer-destructuring */

    expect(addedTags).toHaveProperty('metaTags');
    expect(addedTags.metaTags[0]).toBeDefined();
    expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name="description" content="New description" data-rh="true">"`
    );
    expect(addedTags).toHaveProperty('linkTags');
    expect(addedTags.linkTags[0]).toBeDefined();
    expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
      `"<link href="http://localhost/style2.css" rel="stylesheet" type="text/css" data-rh="true">"`
    );
    expect(removedTags).toHaveProperty('metaTags');
    expect(removedTags.metaTags[0]).toBeDefined();
    expect(removedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
      `"<meta name="description" content="Test description" data-rh="true">"`
    );
    expect(removedTags).not.toHaveProperty('linkTags');
  });
});
