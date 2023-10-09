import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('base tag', () => {
  describe('Declarative API', () => {
    it('updates base tag', () => {
      renderClient(
        <Helmet>
          <base href="http://mysite.com/" />
        </Helmet>
      );

      const existingTags = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);

      expect(existingTags).toBeDefined();

      const filteredTags = [...existingTags].filter(
        tag => tag.getAttribute('href') === 'http://mysite.com/'
      );

      expect(filteredTags).toHaveLength(1);
    });

    it('clears the base tag if one is not specified', () => {
      renderClient(
        <Helmet>
          <base href="http://mysite.com/" />
        </Helmet>
      );
      renderClient(<Helmet />);

      const existingTags = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);

      expect(existingTags).toBeDefined();
      expect(existingTags).toHaveLength(0);
    });

    it("tags without 'href' are not accepted", () => {
      renderClient(
        <Helmet>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <base property="won't work" />
        </Helmet>
      );

      const existingTags = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);

      expect(existingTags).toBeDefined();
      expect(existingTags).toHaveLength(0);
    });

    it('sets base tag based on deepest nested component', () => {
      renderClient(
        <div>
          <Helmet>
            <base href="http://mysite.com" />
          </Helmet>
          <Helmet>
            <base href="http://mysite.com/public" />
          </Helmet>
        </div>
      );

      const existingTags = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);
      const firstTag = existingTags[0];

      expect(existingTags).toBeDefined();
      expect(existingTags).toHaveLength(1);

      expect(firstTag).toBeInstanceOf(Element);
      expect(firstTag?.getAttribute).toBeDefined();
      expect(firstTag?.getAttribute('href')).toBe('http://mysite.com/public');
      expect(firstTag?.outerHTML).toMatchInlineSnapshot(
        `"<base href=\\"http://mysite.com/public\\" data-rh=\\"true\\">"`
      );
    });

    it('sets base tag based on last declared component', () => {
      renderClient(
        <div>
          <Helmet>
            <base href="http://mysite.com" />
            <base href="http://mysite.com/public" />
          </Helmet>
        </div>
      );

      const existingTags = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);
      const firstTag = existingTags[0];

      expect(existingTags).toBeDefined();
      expect(existingTags).toHaveLength(1);

      expect(firstTag).toBeInstanceOf(Element);
      expect(firstTag?.getAttribute).toBeDefined();
      expect(firstTag?.getAttribute('href')).toBe('http://mysite.com/public');
      expect(firstTag?.outerHTML).toMatchInlineSnapshot(
        `"<base href=\\"http://mysite.com/public\\" data-rh=\\"true\\">"`
      );
    });

    it('does not render tag when primary attribute is null', () => {
      renderClient(
        <Helmet>
          <base href={undefined} />
        </Helmet>
      );

      const tagNodes = document.head.querySelectorAll(`base[${HELMET_ATTRIBUTE}]`);
      const existingTags = [].slice.call(tagNodes);

      expect(existingTags).toHaveLength(0);
    });
  });
});
