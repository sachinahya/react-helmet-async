import { AllHTMLAttributes } from 'react';
import { HelmetProps } from './Helmet';

const tags = {
  link: {
    primaryKeys: ['rel', 'href'],
  },
} satisfies {
  [K in keyof React.JSX.IntrinsicElements]?: {
    primaryKeys: (keyof React.JSX.IntrinsicElements[K])[];
  };
};

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
  // FRAGMENT: 'Symbol(react.fragment)',
} as const;

export type Tag = (typeof TAG_NAMES)[keyof typeof TAG_NAMES];

export type TagConfig = {
  [K in Tag]: {
    props: React.JSX.IntrinsicElements[K];
    html: HTMLElementTagNameMap[K];
  };
};

export const ATTRIBUTE_NAMES = {
  BODY: 'bodyAttributes',
  HTML: 'htmlAttributes',
  TITLE: 'titleAttributes',
} as const;

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
} as const;

export const VALID_TAG_NAMES = Object.values(TAG_NAMES);

const HTML_TAG_MAP = {
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
  return (HTML_TAG_MAP as Record<string, string>)[propName] || propName;
};

export const TAG_PROPERTIES = {
  CHARSET: 'charSet',
  CSS_TEXT: 'cssText',
  HREF: 'href',
  HTTPEQUIV: 'httpEquiv',
  INNER_HTML: 'innerHTML',
  ITEM_PROP: 'itemProp',
  NAME: 'name',
  PROPERTY: 'property',
  REL: 'rel',
  SRC: 'src',
} as const; // satisfies Record<string, 'innerHTML' | 'cssText' | keyof AllHTMLAttributes<HTMLElement>>;

export const HELMET_ATTRIBUTE = 'data-rh';
