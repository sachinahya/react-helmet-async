import { createElement, JSX, HTMLAttributes, ReactElement } from 'react';
import { Entries } from 'type-fest';
import {
  TRACKING_ATTRIBUTE,
  TAG_NAMES,
  TAG_PROPERTIES,
  getHtmlAttributeName,
  NON_SELF_CLOSING_TAGS,
} from '../constants';
import { AttributeState, HeadState, TagState, TitleState } from '../state';
import { PrioritisedHeadState, PriorityTags } from '../seo';

export interface HeadDatum {
  toString(): string;
}

export interface HeadTagDatum extends HeadDatum {
  toElements(): ReactElement[];
}

export interface HeadAttributeDatum<T extends HTMLAttributes<HTMLElement>> extends HeadDatum {
  toProps(): T;
}

export type TagServerOutput = { [K in keyof TagState]: HeadTagDatum };

export type AttributeServerOutput = {
  [K in keyof AttributeState]: HeadAttributeDatum<AttributeState[K]>;
};

export type TitleServerOutput = {
  [K in keyof TitleState]: HeadTagDatum;
};

export interface HeadServerOutput
  extends TagServerOutput,
    AttributeServerOutput,
    TitleServerOutput {
  priority: HeadTagDatum;
}

const encodeSpecialCharactersString = (str: string): string => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const generateElementAttributesAsString = (attributes: object): string => {
  let str = '';

  for (const [key, value] of Object.entries(attributes)) {
    if (key === TAG_PROPERTIES.CHILDREN || value === undefined) {
      continue;
    }

    const htmlAttributeName = getHtmlAttributeName(key);

    const attr =
      value != null
        ? `${htmlAttributeName}="${encodeSpecialCharactersString(value)}"`
        : `${htmlAttributeName}`;
    str += str ? ` ${attr}` : attr;
  }

  return str;
};

const generateTitleAsString = (
  type: typeof TAG_NAMES.TITLE,
  title: HeadState['title'],
  attributes: HeadState['titleAttributes']
) => {
  title = Array.isArray(title) ? title.join('') : title;

  const attributeString = generateElementAttributesAsString(attributes);
  const flattenedTitle = encodeSpecialCharactersString(title || '');

  return `<${type} ${TRACKING_ATTRIBUTE}="true"${
    attributeString ? ` ${attributeString}` : ''
  }>${flattenedTitle}</${type}>`;
};

const generateTagsAsString = <T extends keyof TagState>(
  type: keyof JSX.IntrinsicElements,
  tags: TagState[T]
): string => {
  let str = '';

  for (const tag of tags) {
    const attributeString = generateElementAttributesAsString(tag);
    const tagContent = tag.children || '';

    const isSelfClosing = !NON_SELF_CLOSING_TAGS.includes(type);

    str += `<${type} ${TRACKING_ATTRIBUTE}="true" ${attributeString}${
      isSelfClosing ? `/>` : `>${tagContent}</${type}>`
    }`;
  }

  return str;
};

const generateTitleAsReactComponent = (
  title: string | string[] | undefined,
  attributes: HeadState['titleAttributes']
): ReactElement[] => {
  // assigning into an array to define toString function on it
  const props = {
    key: String(title),
    [TRACKING_ATTRIBUTE]: true,
    ...attributes,
  };

  return [createElement(TAG_NAMES.TITLE, props, title)];
};

const generateTagsAsReactComponent = (
  type: keyof JSX.IntrinsicElements,
  tags: TagState[keyof TagState]
): ReactElement[] => {
  const elements: ReactElement[] = [];

  for (const [i, tag] of tags.entries()) {
    const mappedTag: { dangerouslySetInnerHTML?: unknown } & Record<string, unknown> = {
      key: i,
      [TRACKING_ATTRIBUTE]: true,
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

    elements.push(createElement(type, mappedTag));
  }

  return elements;
};

const getMethodsForTags = (
  type: keyof JSX.IntrinsicElements,
  tags: TagState[keyof TagState]
): HeadServerOutput[keyof TagState] => {
  return {
    toElements: () => generateTagsAsReactComponent(type, tags),
    toString: () => generateTagsAsString(type, tags),
  };
};

const getMethodsForTitleTag = (
  title: HeadState['title'],
  titleAttributes: HeadState['titleAttributes']
): HeadServerOutput[keyof TagState] => {
  return {
    toElements: () => generateTitleAsReactComponent(title, titleAttributes),
    toString: () => generateTitleAsString(TAG_NAMES.TITLE, title, titleAttributes),
  };
};

const getMethodsForAttributes = <T extends AttributeState[keyof AttributeState]>(
  tags: T
): HeadAttributeDatum<T> => {
  return {
    toProps: () => tags,
    toString: () => generateElementAttributesAsString(tags),
  };
};

const getPriorityMethods = (
  priority: PriorityTags | undefined
): HeadServerOutput[keyof TagState] => {
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
      `${getMethodsForTags(TAG_NAMES.META, meta)} ${getMethodsForTags(
        TAG_NAMES.LINK,
        link
      )} ${getMethodsForTags(TAG_NAMES.SCRIPT, script)}`,
  };
};

export const getServerOutput = (state: PrioritisedHeadState): HeadServerOutput => {
  const {
    base,
    bodyAttributes,
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
    priority: getPriorityMethods(priority),
    base: getMethodsForTags(TAG_NAMES.BASE, base),
    bodyAttributes: getMethodsForAttributes(bodyAttributes),
    htmlAttributes: getMethodsForAttributes(htmlAttributes),
    link: getMethodsForTags(TAG_NAMES.LINK, link),
    meta: getMethodsForTags(TAG_NAMES.META, meta),
    noscript: getMethodsForTags(TAG_NAMES.NOSCRIPT, noscript),
    script: getMethodsForTags(TAG_NAMES.SCRIPT, script),
    style: getMethodsForTags(TAG_NAMES.STYLE, style),
    title: getMethodsForTitleTag(title, titleAttributes),
    titleAttributes: getMethodsForAttributes(titleAttributes),
  };
};
