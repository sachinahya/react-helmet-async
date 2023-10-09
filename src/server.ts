import React, { AllHTMLAttributes, Attributes, HTMLAttributes, ReactElement } from 'react';
import { Entries } from 'type-fest';
import {
  HELMET_ATTRIBUTE,
  TAG_NAMES,
  TAG_PROPERTIES,
  SEO_PRIORITY_TAGS,
  getHtmlAttributeName,
} from './constants';
import { flattenArray } from './utils';
import { HelmetState, reducePropsToState } from './state';
import { SeoPriorityOptions, prioritizer } from './seo';
import { HelmetProps, HelmetPropsAttributes, HelmetPropsTags } from './Helmet';
import { HelmetStateClient } from './HelmetState';

export interface HelmetDatum {
  toString(): string;
  toComponent(): ReactElement[];
}

export interface HelmetAttributeDatum<T extends HTMLAttributes<HTMLElement>> {
  toString(): string;
  toComponent(): T;
}

export interface HelmetServerOutput {
  base: HelmetDatum;
  bodyAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLBodyElement>>;
  htmlAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLHtmlElement>>;
  link: HelmetDatum;
  meta: HelmetDatum;
  noscript: HelmetDatum;
  script: HelmetDatum;
  style: HelmetDatum;
  title: HelmetDatum;
  titleAttributes: HelmetAttributeDatum<HTMLAttributes<HTMLTitleElement>>;
  priority: HelmetDatum;
}

export interface FilledContext {
  helmet: HelmetServerOutput;
  state: HelmetState;
}

const SELF_CLOSING_TAGS: (keyof React.JSX.IntrinsicElements)[] = [
  TAG_NAMES.NOSCRIPT,
  TAG_NAMES.SCRIPT,
  TAG_NAMES.STYLE,
];

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
    if (key === TAG_PROPERTIES.INNER_HTML || key === TAG_PROPERTIES.CSS_TEXT) {
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

const generateTagsAsString = <T extends keyof HelmetPropsTags>(
  type: keyof React.JSX.IntrinsicElements,
  tags: HelmetState[T],
  encode: boolean | undefined
): string => {
  let str = '';

  for (const tag of tags) {
    const attributeString = generateElementAttributesAsString(tag, encode);
    const tagContent = tag.innerHTML || tag.cssText || '';

    const isNotSelfClosing = !SELF_CLOSING_TAGS.includes(type);

    str += `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}${
      isNotSelfClosing ? `/>` : `>${tagContent}</${type}>`
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
  tags: HelmetState[keyof HelmetPropsTags]
): ReactElement[] => {
  const elements: ReactElement[] = [];

  for (const [i, tag] of tags.entries()) {
    const mappedTag: { dangerouslySetInnerHTML?: unknown } & Record<string, unknown> = {
      key: i,
      [HELMET_ATTRIBUTE]: true,
    };

    for (const [attribute, value] of Object.entries(tag) as Entries<typeof tag>) {
      const mappedAttribute = attribute;

      if (
        mappedAttribute === TAG_PROPERTIES.INNER_HTML ||
        mappedAttribute === TAG_PROPERTIES.CSS_TEXT
      ) {
        const content = tag.innerHTML || tag.cssText;
        mappedTag.dangerouslySetInnerHTML = { __html: content };
      } else {
        mappedTag[mappedAttribute] = value;
      }
    }

    elements.push(React.createElement(type, mappedTag));
  }

  return elements;
};

const getMethodsForTag = (
  type: keyof React.JSX.IntrinsicElements,
  tags: HelmetState[keyof HelmetPropsTags],
  encode: boolean | undefined
): HelmetDatum => {
  return {
    toComponent: () => generateTagsAsReactComponent(type, tags),
    toString: () => generateTagsAsString(type, tags, encode),
  };
};

const getMethodsForTitleTag = (
  title: HelmetState['title'],
  titleAttributes: HelmetState['titleAttributes'],
  encode: boolean | undefined
): HelmetDatum => {
  return {
    toComponent: () => generateTitleAsReactComponent(title, titleAttributes),
    toString: () => generateTitleAsString(TAG_NAMES.TITLE, title, titleAttributes, encode),
  };
};

const getMethodsForAttributeTag = <
  T extends Required<HelmetPropsAttributes>[keyof HelmetPropsAttributes],
>(
  tags: T
) => {
  return {
    toComponent: () => tags,
    toString: () => generateElementAttributesAsString(tags),
  };
};

const getPriorityMethods = ({
  meta,
  link,
  script,
  encodeSpecialCharacters,
}: HelmetState): Pick<HelmetState, SeoPriorityOptions> & {
  priorityMethods: HelmetDatum;
} => {
  const metaP = prioritizer(meta, SEO_PRIORITY_TAGS.meta);
  const linkP = prioritizer(link, SEO_PRIORITY_TAGS.link);
  const scriptP = prioritizer(script, SEO_PRIORITY_TAGS.script);

  // need to have toComponent() and toString()
  const priorityMethods = {
    toComponent: () => [
      ...generateTagsAsReactComponent(TAG_NAMES.META, metaP.priority),
      ...generateTagsAsReactComponent(TAG_NAMES.LINK, linkP.priority),
      ...generateTagsAsReactComponent(TAG_NAMES.SCRIPT, scriptP.priority),
    ],
    toString: () =>
      // generate all the tags as strings and concatenate them
      `${getMethodsForTag(
        TAG_NAMES.META,
        metaP.priority,
        encodeSpecialCharacters
      )} ${getMethodsForTag(
        TAG_NAMES.LINK,
        linkP.priority,
        encodeSpecialCharacters
      )} ${getMethodsForTag(TAG_NAMES.SCRIPT, scriptP.priority, encodeSpecialCharacters)}`,
  };

  return {
    priorityMethods,
    meta: metaP.default,
    link: linkP.default,
    script: scriptP.default,
  };
};

const mapStateOnServer = (newState: HelmetState): HelmetServerOutput => {
  const {
    base,
    bodyAttributes,
    encodeSpecialCharacters,
    htmlAttributes,
    noscript,
    style,
    title,
    titleAttributes,
    prioritizeSeoTags,
  } = newState;
  let { link, meta, script } = newState;

  let priorityMethods: HelmetDatum = {
    toComponent: () => [],
    toString: () => {
      return '';
    },
  };

  if (prioritizeSeoTags) {
    ({ priorityMethods, link, meta, script } = getPriorityMethods(newState));
  }

  return {
    priority: priorityMethods,
    base: getMethodsForTag(TAG_NAMES.BASE, base, encodeSpecialCharacters),
    bodyAttributes: getMethodsForAttributeTag(bodyAttributes),
    htmlAttributes: getMethodsForAttributeTag(htmlAttributes),
    link: getMethodsForTag(TAG_NAMES.LINK, link, encodeSpecialCharacters),
    meta: getMethodsForTag(TAG_NAMES.META, meta, encodeSpecialCharacters),
    noscript: getMethodsForTag(TAG_NAMES.NOSCRIPT, noscript, encodeSpecialCharacters),
    script: getMethodsForTag(TAG_NAMES.SCRIPT, script, encodeSpecialCharacters),
    style: getMethodsForTag(TAG_NAMES.STYLE, style, encodeSpecialCharacters),
    title: getMethodsForTitleTag(title, titleAttributes, encodeSpecialCharacters),
    titleAttributes: getMethodsForAttributeTag(titleAttributes),
  };
};

export class HelmetServerState implements HelmetStateClient {
  #instances = new Map<unknown, HelmetProps>();

  getOutput(): HelmetServerOutput {
    const propsList = [...this.#instances.values()];
    const state = reducePropsToState(propsList);
    return mapStateOnServer(state);
  }

  update(instance: unknown, props: HelmetProps): void {
    this.#instances.set(instance, props);
  }

  remove(instance: unknown): void {
    this.#instances.delete(instance);
  }
}
