import { AllHTMLAttributes } from 'react';
import { HelmetProps, HelmetPropsAttributes } from './Helmet';

export const HELMET_PROPS = {
  DEFER: 'defer',
  ENCODE_SPECIAL_CHARACTERS: 'encodeSpecialCharacters',
  ON_CHANGE_CLIENT_STATE: 'onChangeClientState',
  PRIORITIZE_SEO_TAGS: 'prioritizeSeoTags',
} as const satisfies Record<string, keyof HelmetProps>;

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
} as const satisfies Record<string, keyof React.JSX.IntrinsicElements>;

export const ATTRIBUTE_NAMES = {
  BODY: 'bodyAttributes',
  HTML: 'htmlAttributes',
  TITLE: 'titleAttributes',
} as const satisfies Record<string, keyof HelmetPropsAttributes>;

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
  CSS_TEXT: 'cssText',
  HREF: 'href',
  HTTPEQUIV: 'httpEquiv',
  INNER_HTML: 'innerHTML',
  ITEM_PROP: 'itemProp',
  NAME: 'name',
  PROPERTY: 'property',
  REL: 'rel',
  SRC: 'src',
} as const satisfies Record<string, 'innerHTML' | 'cssText' | keyof AllHTMLAttributes<HTMLElement>>;

export const HELMET_ATTRIBUTE = 'data-rh';
