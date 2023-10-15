import { AllHTMLAttributes, JSX } from 'react';
import { AttributeState } from './state';

export const TAG_NAMES = {
  BASE: 'base',
  BODY: 'body',
  HEAD: 'head',
  HTML: 'html',
  LINK: 'link',
  META: 'meta',
  NOSCRIPT: 'noscript',
  SCRIPT: 'script',
  STYLE: 'style',
  TITLE: 'title',
} as const satisfies Record<string, keyof JSX.IntrinsicElements>;

export const NON_SELF_CLOSING_TAGS: string[] = [
  TAG_NAMES.NOSCRIPT,
  TAG_NAMES.SCRIPT,
  TAG_NAMES.STYLE,
] satisfies readonly (keyof JSX.IntrinsicElements)[];

export const ATTRIBUTE_NAMES = {
  BODY: 'bodyAttributes',
  HTML: 'htmlAttributes',
  TITLE: 'titleAttributes',
} as const satisfies Record<string, keyof AttributeState>;

export type SeoPriority = Record<string, string | readonly string[]>;

export const SEO_PRIORITY_TAGS = {
  link: { rel: ['amphtml', 'canonical', 'alternate'] },
  script: { type: ['application/ld+json'] },
  meta: {
    charset: '',
    name: ['generator', 'robots', 'description'],
    property: [
      'og:type',
      'og:title',
      'og:url',
      'og:image',
      'og:image:alt',
      'og:description',
      'twitter:url',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'twitter:image:alt',
      'twitter:card',
      'twitter:site',
    ],
  },
} as const satisfies Record<string, SeoPriority>;

export const VALID_TAG_NAMES = Object.values(TAG_NAMES);

const HTML_TAG_MAP: Record<string, string> = {
  accessKey: 'accesskey',
  charSet: 'charset',
  className: 'class',
  contentEditable: 'contenteditable',
  contextMenu: 'contextmenu',
  httpEquiv: 'http-equiv',
  itemProp: 'itemprop',
  tabIndex: 'tabindex',
};

export const getHtmlAttributeName = (propName: string): string => {
  return HTML_TAG_MAP[propName] || propName;
};

export const TAG_PROPERTIES = {
  CHARSET: 'charSet',
  CHILDREN: 'children',
  HREF: 'href',
  HTTPEQUIV: 'httpEquiv',
  ITEM_PROP: 'itemProp',
  NAME: 'name',
  PROPERTY: 'property',
  REL: 'rel',
  SRC: 'src',
} as const satisfies Record<string, keyof AllHTMLAttributes<HTMLElement>>;

export const TRACKING_ATTRIBUTE = 'data-ht';
