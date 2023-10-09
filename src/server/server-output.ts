import React, { HTMLAttributes, ReactElement } from 'react';
import { Entries } from 'type-fest';
import {
  HELMET_ATTRIBUTE,
  TAG_NAMES,
  TAG_PROPERTIES,
  getHtmlAttributeName,
  NON_SELF_CLOSING_TAGS,
} from '../constants';
import { flattenArray } from '../utils';
import { AttributeState, HelmetState, TagState } from '../state';
import { PrioritisedHelmetState, PriorityTags } from '../seo';

export interface HelmetDatum {
  toString(): string;
}

export interface HelmetTagDatum extends HelmetDatum {
  toElements(): ReactElement[];
}

export interface HelmetAttributeDatum<T extends HTMLAttributes<HTMLElement>> extends HelmetDatum {
  toProps(): T;
}

export interface HelmetServerOutput {
  base: HelmetTagDatum;
  bodyAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLBodyElement>>;
  htmlAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLHtmlElement>>;
  link: HelmetTagDatum;
  meta: HelmetTagDatum;
  noscript: HelmetTagDatum;
  script: HelmetTagDatum;
  style: HelmetTagDatum;
  title: HelmetTagDatum;
  titleAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLTitleElement>>;
  priority: HelmetTagDatum;
}

const encodeSpecialCharactersString = (str: string, encode = true): string => {
  if (encode === false) {
    return String(str);
  }

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const generateElementAttributesAsString = (attributes: object, encode?: boolean): string => {
  let str = '';

  for (const [key, value] of Object.entries(attributes)) {
    if (key === TAG_PROPERTIES.CHILDREN) {
      continue;
    }

    const htmlAttributeName = getHtmlAttributeName(key);

    const attr =
      value != null
        ? `${htmlAttributeName}="${encodeSpecialCharactersString(value, encode)}"`
        : `${htmlAttributeName}`;
    str += str ? ` ${attr}` : attr;
  }

  return str;
};

const generateTitleAsString = (
  type: typeof TAG_NAMES.TITLE,
  title: HelmetState['title'],
  attributes: HelmetState['titleAttributes'],
  encode: boolean | undefined
) => {
  const attributeString = generateElementAttributesAsString(attributes);
  const flattenedTitle = encodeSpecialCharactersString(flattenArray(title) || '', encode);

  return `<${type} ${HELMET_ATTRIBUTE}="true"${
    attributeString ? ` ${attributeString}` : ''
  }>${flattenedTitle}</${type}>`;
};

const generateTagsAsString = <T extends keyof TagState>(
  type: keyof React.JSX.IntrinsicElements,
  tags: TagState[T],
  encode: boolean | undefined
): string => {
  let str = '';

  for (const tag of tags) {
    const attributeString = generateElementAttributesAsString(tag, encode);
    const tagContent = tag.children || '';

    const isSelfClosing = !NON_SELF_CLOSING_TAGS.includes(type);

    str += `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}${
      isSelfClosing ? `/>` : `>${tagContent}</${type}>`
    }`;
  }

  return str;
};

const generateTitleAsReactComponent = (
  title: string | string[] | undefined,
  attributes: HelmetState['titleAttributes']
): ReactElement[] => {
  // assigning into an array to define toString function on it
  const props = {
    key: String(title),
    [HELMET_ATTRIBUTE]: true,
    ...attributes,
  };

  return [React.createElement(TAG_NAMES.TITLE, props, title)];
};

const generateTagsAsReactComponent = (
  type: keyof React.JSX.IntrinsicElements,
  tags: TagState[keyof TagState]
): ReactElement[] => {
  const elements: ReactElement[] = [];

  for (const [i, tag] of tags.entries()) {
    const mappedTag: { dangerouslySetInnerHTML?: unknown } & Record<string, unknown> = {
      key: i,
      [HELMET_ATTRIBUTE]: true,
    };

    for (const [attribute, value] of Object.entries(tag) as Entries<typeof tag>) {
      const mappedAttribute = attribute;

      if (mappedAttribute === TAG_PROPERTIES.CHILDREN) {
        const content = tag.children || '';
        mappedTag.dangerouslySetInnerHTML = { __html: content };
      } else {
        mappedTag[mappedAttribute] = value;
      }
    }

    elements.push(React.createElement(type, mappedTag));
  }

  return elements;
};

const getMethodsForTags = (
  type: keyof React.JSX.IntrinsicElements,
  tags: TagState[keyof TagState],
  encode: boolean | undefined
): HelmetTagDatum => {
  return {
    toElements: () => generateTagsAsReactComponent(type, tags),
    toString: () => generateTagsAsString(type, tags, encode),
  };
};

const getMethodsForTitleTag = (
  title: HelmetState['title'],
  titleAttributes: HelmetState['titleAttributes'],
  encode: boolean | undefined
): HelmetTagDatum => {
  return {
    toElements: () => generateTitleAsReactComponent(title, titleAttributes),
    toString: () => generateTitleAsString(TAG_NAMES.TITLE, title, titleAttributes, encode),
  };
};

const getMethodsForAttributes = <T extends AttributeState[keyof AttributeState]>(
  tags: T
): HelmetAttributeDatum<T> => {
  return {
    toProps: () => tags,
    toString: () => generateElementAttributesAsString(tags),
  };
};

const getPriorityMethods = (
  priority: PriorityTags | undefined,
  encodeSpecialCharacters: boolean
): HelmetTagDatum => {
  if (!priority) {
    return {
      toElements: () => [],
      toString: () => '',
    };
  }

  const { meta, link, script } = priority;

  return {
    toElements: () => [
      ...generateTagsAsReactComponent(TAG_NAMES.META, meta),
      ...generateTagsAsReactComponent(TAG_NAMES.LINK, link),
      ...generateTagsAsReactComponent(TAG_NAMES.SCRIPT, script),
    ],
    toString: () =>
      `${getMethodsForTags(TAG_NAMES.META, meta, encodeSpecialCharacters)} ${getMethodsForTags(
        TAG_NAMES.LINK,
        link,
        encodeSpecialCharacters
      )} ${getMethodsForTags(TAG_NAMES.SCRIPT, script, encodeSpecialCharacters)}`,
  };
};

export const getServerOutput = (state: PrioritisedHelmetState): HelmetServerOutput => {
  const {
    base,
    bodyAttributes,
    encodeSpecialCharacters,
    htmlAttributes,
    link,
    meta,
    noscript,
    script,
    style,
    title,
    titleAttributes,
    priority,
  } = state;

  return {
    priority: getPriorityMethods(priority, encodeSpecialCharacters),
    base: getMethodsForTags(TAG_NAMES.BASE, base, encodeSpecialCharacters),
    bodyAttributes: getMethodsForAttributes(bodyAttributes),
    htmlAttributes: getMethodsForAttributes(htmlAttributes),
    link: getMethodsForTags(TAG_NAMES.LINK, link, encodeSpecialCharacters),
    meta: getMethodsForTags(TAG_NAMES.META, meta, encodeSpecialCharacters),
    noscript: getMethodsForTags(TAG_NAMES.NOSCRIPT, noscript, encodeSpecialCharacters),
    script: getMethodsForTags(TAG_NAMES.SCRIPT, script, encodeSpecialCharacters),
    style: getMethodsForTags(TAG_NAMES.STYLE, style, encodeSpecialCharacters),
    title: getMethodsForTitleTag(title, titleAttributes, encodeSpecialCharacters),
    titleAttributes: getMethodsForAttributes(titleAttributes),
  };
};
