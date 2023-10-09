import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { renderClient } from './utils';

Helmet.defaultProps.defer = false;

describe('Declarative API', () => {
  it('updates style tags', () => {
    const cssText1 = `
            body {
                background-color: green;
            }
        `;
    const cssText2 = `
            p {
                font-size: 12px;
            }
        `;

    renderClient(
      <Helmet>
        <style type="text/css">{cssText1}</style>
        <style>{cssText2}</style>
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`style[${HELMET_ATTRIBUTE}]`);

    const [firstTag, secondTag] = tagNodes;

    expect(tagNodes).toBeDefined();
    expect(tagNodes).toHaveLength(2);

    expect(firstTag).toBeInstanceOf(Element);
    expect(firstTag?.getAttribute).toBeDefined();
    expect(firstTag?.getAttribute('type')).toBe('text/css');
    expect(firstTag?.innerHTML).toEqual(cssText1);
    expect(firstTag?.outerHTML).toMatchInlineSnapshot(`
      "<style type=\\"text/css\\" data-rh=\\"true\\">
                  body {
                      background-color: green;
                  }
              </style>"
    `);

    expect(secondTag).toBeInstanceOf(Element);
    expect(secondTag?.innerHTML).toEqual(cssText2);
    expect(secondTag?.outerHTML).toMatchInlineSnapshot(`
      "<style data-rh=\\"true\\">
                  p {
                      font-size: 12px;
                  }
              </style>"
    `);
  });

  it('clears all style tags if none are specified', () => {
    const cssText = `
            body {
                background-color: green;
            }
        `;
    renderClient(
      <Helmet>
        <style type="text/css">{cssText}</style>
      </Helmet>
    );

    expect(document.head.querySelectorAll(`style[${HELMET_ATTRIBUTE}]`)).toHaveLength(1);

    renderClient(<Helmet />);

    const existingTags = document.head.querySelectorAll(`style[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it("tags without 'cssText' are not accepted", () => {
    renderClient(
      <Helmet>
        <style id="won't work" />
      </Helmet>
    );

    const existingTags = document.head.querySelectorAll(`style[${HELMET_ATTRIBUTE}]`);

    expect(existingTags).toBeDefined();
    expect(existingTags).toHaveLength(0);
  });

  it('does not render tag when primary attribute is null', () => {
    renderClient(
      <Helmet>
        <style>{undefined}</style>
      </Helmet>
    );

    const tagNodes = document.head.querySelectorAll(`style[${HELMET_ATTRIBUTE}]`);

    expect(tagNodes).toHaveLength(0);
  });
});
