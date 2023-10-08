import React from 'react';
import { Helmet } from '../../src';
import { render } from './utils';

Helmet.defaultProps.defer = false;

describe('onChangeClientState', () => {
  describe('API', () => {
    it('when handling client state change, calls the function with new state, addedTags and removedTags', () => {
      const onChange = jest.fn();
      render(
        <div>
          <Helmet onChangeClientState={onChange}>
            <base href="http://mysite.com/" />
            <link href="http://localhost/helmet" rel="canonical" />
            <meta charSet="utf-8" />
            <script src="http://localhost/test.js" type="text/javascript" />
            <title>Main Title</title>
          </Helmet>
        </div>
      );

      expect(onChange).toHaveBeenCalled();

      const newState = onChange.mock.calls[0][0];
      const addedTags = onChange.mock.calls[0][1];
      const removedTags = onChange.mock.calls[0][2];

      expect(newState).toEqual(expect.objectContaining({ title: 'Main Title' }));
      expect(newState.baseTag[0]).toEqual(
        expect.objectContaining({
          href: 'http://mysite.com/',
        })
      );
      expect(newState.metaTags[0]).toEqual(expect.objectContaining({ charSet: 'utf-8' }));
      expect(newState.linkTags[0]).toEqual(
        expect.objectContaining({
          href: 'http://localhost/helmet',
          rel: 'canonical',
        })
      );
      expect(newState.scriptTags[0]).toEqual(
        expect.objectContaining({
          src: 'http://localhost/test.js',
          type: 'text/javascript',
        })
      );

      expect(addedTags.baseTag).toBeDefined();
      expect(addedTags.baseTag[0]).toBeDefined();
      expect(addedTags.baseTag[0].outerHTML).toMatchInlineSnapshot(
        `"<base href=\\"http://mysite.com/\\" data-rh=\\"true\\">"`
      );

      expect(addedTags.metaTags).toBeDefined();
      expect(addedTags.metaTags[0]).toBeDefined();
      expect(addedTags.metaTags[0].outerHTML).toMatchInlineSnapshot(
        `"<meta charset=\\"utf-8\\" data-rh=\\"true\\">"`
      );

      expect(addedTags.linkTags).toBeDefined();
      expect(addedTags.linkTags[0]).toBeDefined();
      expect(addedTags.linkTags[0].outerHTML).toMatchInlineSnapshot(
        `"<link href=\\"http://localhost/helmet\\" rel=\\"canonical\\" data-rh=\\"true\\">"`
      );

      expect(addedTags.scriptTags).toBeDefined();
      expect(addedTags.scriptTags[0]).toBeDefined();
      expect(addedTags.scriptTags[0].outerHTML).toMatchInlineSnapshot(
        `"<script src=\\"http://localhost/test.js\\" type=\\"text/javascript\\" data-rh=\\"true\\"></script>"`
      );

      expect(removedTags).toEqual({});
    });
  });
});
