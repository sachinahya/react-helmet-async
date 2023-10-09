import React from 'react';
import { Helmet } from '../../src';
import { HELMET_ATTRIBUTE } from '../../src/constants';
import { renderClient } from './utils';

/* eslint-disable jsx-a11y/html-has-lang, react/no-unknown-property */

Helmet.defaultProps.defer = false;

describe('html attributes', () => {
  it('clears html attributes that are handled within helmet', () => {
    renderClient(
      <Helmet>
        <html lang="en" about={undefined} draggable />
      </Helmet>
    );

    const htmlTag = document.documentElement;

    expect(htmlTag.getAttribute('lang')).not.toBeNull();
    expect(htmlTag.getAttribute('about')).not.toBeNull();
    expect(htmlTag.getAttribute('draggable')).not.toBeNull();
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).not.toBeNull();

    renderClient(<Helmet />);

    expect(htmlTag.getAttribute('lang')).toBeNull();
    expect(htmlTag.getAttribute('about')).toBeNull();
    expect(htmlTag.getAttribute('draggable')).toBeNull();
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
  });

  it('updates with multiple additions and removals - all new', () => {
    renderClient(
      <Helmet>
        <html lang="en" about={undefined} />
      </Helmet>
    );

    const htmlTag = document.documentElement;

    expect(htmlTag.getAttribute('about')).toBe('');
    expect(htmlTag.getAttribute('lang')).toBe('en');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('lang,about');

    renderClient(
      <Helmet>
        <html id="html-tag" title="html tag" />
      </Helmet>
    );

    expect(htmlTag.getAttribute('about')).toBeNull();
    expect(htmlTag.getAttribute('lang')).toBeNull();
    expect(htmlTag.getAttribute('id')).toBe('html-tag');
    expect(htmlTag.getAttribute('title')).toBe('html tag');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('id,title');
  });
});

it('updates html attributes', () => {
  renderClient(
    <Helmet>
      <html className="myClassName" lang="en" />
    </Helmet>
  );

  const htmlTag = document.documentElement;

  expect(htmlTag.getAttribute('class')).toBe('myClassName');
  expect(htmlTag.getAttribute('lang')).toBe('en');
  expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('class,lang');
});

it('sets attributes based on the deepest nested component', () => {
  renderClient(
    <div>
      <Helmet>
        <html lang="en" />
      </Helmet>
      <Helmet>
        <html lang="ja" />
      </Helmet>
    </div>
  );

  const htmlTag = document.documentElement;

  expect(htmlTag.getAttribute('lang')).toBe('ja');
  expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('lang');
});

it('handles valueless attributes', () => {
  renderClient(
    <Helmet>
      <html about={undefined} draggable />
    </Helmet>
  );

  const htmlTag = document.documentElement;

  expect(htmlTag.getAttribute('about')).toBe('');
  expect(htmlTag.getAttribute('draggable')).toBe('true');
  expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('about,draggable');
});

it('updates with multiple additions and removals - overwrite and new', () => {
  renderClient(
    <Helmet>
      <html lang="en" draggable />
    </Helmet>
  );

  const htmlTag = document.documentElement;

  expect(htmlTag.getAttribute('draggable')).toBe('true');

  renderClient(
    <Helmet>
      <html lang="ja" id="html-tag" title="html tag" />
    </Helmet>
  );

  expect(htmlTag.getAttribute('draggable')).toBeNull();
  expect(htmlTag.getAttribute('lang')).toBe('ja');
  expect(htmlTag.getAttribute('id')).toBe('html-tag');
  expect(htmlTag.getAttribute('title')).toBe('html tag');
  expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('lang,id,title');
});

it('updates with multiple additions and removals - all new', () => {
  renderClient(
    <Helmet>
      <html lang="en" draggable />
    </Helmet>
  );

  const htmlTag = document.documentElement;

  expect(htmlTag.getAttribute('draggable')).toBe('true');

  renderClient(
    <Helmet>
      <html id="html-tag" title="html tag" />
    </Helmet>
  );

  expect(htmlTag.getAttribute('about')).toBeNull();
  expect(htmlTag.getAttribute('lang')).toBeNull();
  expect(htmlTag.getAttribute('id')).toBe('html-tag');
  expect(htmlTag.getAttribute('title')).toBe('html tag');
  expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('id,title');
});

describe('initialized outside of helmet', () => {
  beforeEach(() => {
    const htmlTag = document.documentElement;
    htmlTag.setAttribute('about', 'about');
  });

  it('attributes are not cleared', () => {
    const htmlTag = document.documentElement;

    expect(htmlTag.getAttribute('about')).toBe('about');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

    renderClient(<Helmet />);

    expect(htmlTag.getAttribute('about')).toBe('about');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
  });

  it('overwritten if specified in helmet', () => {
    const htmlTag = document.documentElement;

    expect(htmlTag.getAttribute('about')).toBe('about');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

    renderClient(
      <Helmet>
        <html about="helmet-attr" />
      </Helmet>
    );

    expect(htmlTag.getAttribute('about')).toBe('helmet-attr');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('about');
  });

  it('cleared once it is managed in helmet', () => {
    const htmlTag = document.documentElement;

    expect(htmlTag.getAttribute('about')).toBe('about');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();

    renderClient(
      <Helmet>
        <html about="helmet-attr" />
      </Helmet>
    );

    expect(htmlTag.getAttribute('about')).toBe('helmet-attr');
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBe('about');

    renderClient(<Helmet />);

    expect(htmlTag.getAttribute('about')).toBeNull();
    expect(htmlTag.getAttribute(HELMET_ATTRIBUTE)).toBeNull();
  });
});
