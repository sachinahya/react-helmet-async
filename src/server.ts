import React, { Attributes, HTMLAttributes, ReactElement } from 'react';
import {
  HELMET_ATTRIBUTE,
  TAG_NAMES,
  REACT_TAG_MAP,
  TAG_PROPERTIES,
  SEO_PRIORITY_TAGS,
} from './constants';
import { HelmetInternalState, flattenArray, prioritizer } from './utils';
import { HelmetDatum, HelmetServerState } from './HelmetData';

const SELF_CLOSING_TAGS: (keyof React.JSX.IntrinsicElements)[] = [
  TAG_NAMES.NOSCRIPT,
  TAG_NAMES.SCRIPT,
  TAG_NAMES.STYLE,
];

const encodeSpecialCharacters = (str: string, encode = true): string => {
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

const generateElementAttributesAsString = (attributes: Record<string, unknown>): string =>
  Object.keys(attributes).reduce((str, key) => {
    const attr = typeof attributes[key] !== 'undefined' ? `${key}="${attributes[key]}"` : `${key}`;
    return str ? `${str} ${attr}` : attr;
  }, '');

const generateTitleAsString = (
  type: typeof TAG_NAMES.TITLE,
  title: HelmetInternalState['title'],
  attributes: HelmetInternalState['titleAttributes'],
  encode: boolean | undefined
) => {
  const attributeString = generateElementAttributesAsString(attributes);
  const flattenedTitle = flattenArray(title) || '';
  return attributeString
    ? `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}>${encodeSpecialCharacters(
        flattenedTitle,
        encode
      )}</${type}>`
    : `<${type} ${HELMET_ATTRIBUTE}="true">${encodeSpecialCharacters(
        flattenedTitle,
        encode
      )}</${type}>`;
};

const generateTagsAsString = (
  type: keyof React.JSX.IntrinsicElements,
  tags: HelmetInternalState[
    | 'baseTag'
    | 'linkTags'
    | 'metaTags'
    | 'noscriptTags'
    | 'scriptTags'
    | 'styleTags'],
  encode: boolean | undefined
): string =>
  tags.reduce((str, tag) => {
    const attributeHtml = (Object.keys(tag) as (keyof typeof tag)[])
      .filter(
        attribute =>
          !(attribute === TAG_PROPERTIES.INNER_HTML || attribute === TAG_PROPERTIES.CSS_TEXT)
      )
      .reduce((string, attribute) => {
        const attr =
          typeof tag[attribute] === 'undefined'
            ? attribute
            : `${attribute}="${encodeSpecialCharacters(tag[attribute], encode)}"`;
        return string ? `${string} ${attr}` : attr;
      }, '');

    const tagContent = tag.innerHTML || tag.cssText || '';

    const isNotSelfClosing = !SELF_CLOSING_TAGS.includes(type);

    return `${str}<${type} ${HELMET_ATTRIBUTE}="true" ${attributeHtml}${
      isNotSelfClosing ? `/>` : `>${tagContent}</${type}>`
    }`;
  }, '');

const convertElementAttributesToReactProps = <T extends keyof React.JSX.IntrinsicElements>(
  attributes: HelmetInternalState['bodyAttributes' | 'htmlAttributes' | 'titleAttributes'],
  initProps?: React.JSX.IntrinsicElements[T]
): React.JSX.IntrinsicElements[T] =>
  (Object.keys(attributes) as (keyof typeof attributes)[]).reduce<React.JSX.IntrinsicElements[T]>(
    (obj, key) => {
      obj[REACT_TAG_MAP[key] || key] = attributes[key];
      return obj;
    },
    initProps ?? {}
  );

const generateTitleAsReactComponent = (
  title: string | undefined,
  attributes: HelmetInternalState['titleAttributes']
): ReactElement[] => {
  // assigning into an array to define toString function on it
  const initProps = {
    key: title,
    [HELMET_ATTRIBUTE]: true,
  };
  const props = convertElementAttributesToReactProps<'title'>(attributes, initProps);

  return [React.createElement(TAG_NAMES.TITLE, props, title)];
};

const generateTagsAsReactComponent = (
  type: keyof React.JSX.IntrinsicElements,
  tags: HelmetInternalState[
    | 'baseTag'
    | 'linkTags'
    | 'metaTags'
    | 'noscriptTags'
    | 'scriptTags'
    | 'styleTags']
): ReactElement[] => {
  return tags.map((tag, i) => {
    const mappedTag: Attributes & {
      [HELMET_ATTRIBUTE]: boolean;
    } & HTMLAttributes<HTMLElement> = {
      key: i,
      [HELMET_ATTRIBUTE]: true,
    };

    (Object.keys(tag) as (keyof typeof tag)[]).forEach(attribute => {
      const mappedAttribute = REACT_TAG_MAP[attribute] || attribute;

      if (
        mappedAttribute === TAG_PROPERTIES.INNER_HTML ||
        mappedAttribute === TAG_PROPERTIES.CSS_TEXT
      ) {
        const content = tag.innerHTML || tag.cssText;
        mappedTag.dangerouslySetInnerHTML = { __html: content };
      } else {
        mappedTag[mappedAttribute] = tag[attribute];
      }
    });

    return React.createElement(type, mappedTag);
  });
};

const getMethodsForTag = (
  type: keyof React.JSX.IntrinsicElements,
  tags: HelmetInternalState[
    | 'baseTag'
    | 'linkTags'
    | 'metaTags'
    | 'noscriptTags'
    | 'scriptTags'
    | 'styleTags'],
  encode: boolean | undefined
): HelmetDatum => {
  return {
    toComponent: () => generateTagsAsReactComponent(type, tags),
    toString: () => generateTagsAsString(type, tags, encode),
  };
};

const getMethodsForTitleTag = (
  tags: Pick<HelmetInternalState, 'title' | 'titleAttributes'>,
  encode: boolean | undefined
): HelmetDatum => {
  return {
    toComponent: () => generateTitleAsReactComponent(tags.title, tags.titleAttributes, encode),
    toString: () =>
      generateTitleAsString(TAG_NAMES.TITLE, tags.title, tags.titleAttributes, encode),
  };
};

const getMethodsForAttributeTag = <T extends keyof React.JSX.IntrinsicElements>(
  tags: HelmetInternalState['bodyAttributes' | 'htmlAttributes']
) => {
  return {
    toComponent: () => convertElementAttributesToReactProps<T>(tags),
    toString: () => generateElementAttributesAsString(tags),
  };
};

const getPriorityMethods = ({
  metaTags,
  linkTags,
  scriptTags,
  encode,
}: HelmetInternalState): Pick<HelmetInternalState, 'metaTags' | 'linkTags' | 'scriptTags'> & {
  priorityMethods: HelmetDatum;
} => {
  const meta = prioritizer(metaTags, SEO_PRIORITY_TAGS.meta);
  const link = prioritizer(linkTags, SEO_PRIORITY_TAGS.link);
  const script = prioritizer(scriptTags, SEO_PRIORITY_TAGS.script);

  // need to have toComponent() and toString()
  const priorityMethods = {
    toComponent: () => [
      ...generateTagsAsReactComponent(TAG_NAMES.META, meta.priority),
      ...generateTagsAsReactComponent(TAG_NAMES.LINK, link.priority),
      ...generateTagsAsReactComponent(TAG_NAMES.SCRIPT, script.priority),
    ],
    toString: () =>
      // generate all the tags as strings and concatenate them
      `${getMethodsForTag(TAG_NAMES.META, meta.priority, encode)} ${getMethodsForTag(
        TAG_NAMES.LINK,
        link.priority,
        encode
      )} ${getMethodsForTag(TAG_NAMES.SCRIPT, script.priority, encode)}`,
  };

  return {
    priorityMethods,
    metaTags: meta.default,
    linkTags: link.default,
    scriptTags: script.default,
  };
};

const mapStateOnServer = (newState: HelmetInternalState): HelmetServerState => {
  const {
    baseTag,
    bodyAttributes,
    encode,
    htmlAttributes,
    noscriptTags,
    styleTags,
    title,
    titleAttributes,
    prioritizeSeoTags,
  } = newState;
  let { linkTags, metaTags, scriptTags } = newState;

  let priorityMethods: HelmetDatum = {
    toComponent: () => [],
    toString: () => {
      return '';
    },
  };

  if (prioritizeSeoTags) {
    ({ priorityMethods, linkTags, metaTags, scriptTags } = getPriorityMethods(newState));
  }

  return {
    priority: priorityMethods,
    base: getMethodsForTag(TAG_NAMES.BASE, baseTag, encode),
    bodyAttributes: getMethodsForAttributeTag<'body'>(bodyAttributes),
    htmlAttributes: getMethodsForAttributeTag<'html'>(htmlAttributes),
    link: getMethodsForTag(TAG_NAMES.LINK, linkTags, encode),
    meta: getMethodsForTag(TAG_NAMES.META, metaTags, encode),
    noscript: getMethodsForTag(TAG_NAMES.NOSCRIPT, noscriptTags, encode),
    script: getMethodsForTag(TAG_NAMES.SCRIPT, scriptTags, encode),
    style: getMethodsForTag(TAG_NAMES.STYLE, styleTags, encode),
    title: getMethodsForTitleTag({ title, titleAttributes }, encode),
    titleAttributes: {} as any,
  };
};

export default mapStateOnServer;
