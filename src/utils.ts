import { Except, UnionToIntersection } from 'type-fest';
import { BodyProps, HelmetProps, HtmlProps } from './Helmet';
import { TAG_NAMES, TAG_PROPERTIES, ATTRIBUTE_NAMES, SEO_PRIORITY_TAGS } from './constants';

const HELMET_PROPS = {
  DEFER: 'defer',
  ENCODE_SPECIAL_CHARACTERS: 'encodeSpecialCharacters',
  ON_CHANGE_CLIENT_STATE: 'onChangeClientState',
  PRIORITIZE_SEO_TAGS: 'prioritizeSeoTags',
} as const;

const getInnermostProperty = <T extends keyof HelmetProps>(
  propsList: HelmetProps[],
  property: T
): HelmetProps[T] | undefined => {
  for (const props of [...propsList].reverse()) {
    if (props[property] != null) {
      return props[property];
    }
  }

  return undefined;
};

const getAttributesFromPropsList = <
  T extends 'bodyAttributes' | 'htmlAttributes' | 'titleAttributes',
>(
  tagType: T,
  propsList: HelmetProps[]
): NonNullable<HelmetProps[T]> => {
  const mergedAttributes: NonNullable<HelmetProps[T]> = {};

  for (const props of propsList) {
    if (props[tagType] != null) {
      Object.assign(mergedAttributes, props[tagType]);
    }
  }

  return mergedAttributes;
};

const getBaseTagFromPropsList = (
  propsList: HelmetProps[]
): React.JSX.IntrinsicElements['base'][] => {
  for (const props of [...propsList].reverse()) {
    if (props.base) {
      for (const baseTag of [...props.base].reverse()) {
        if (baseTag?.href) {
          return [baseTag];
        }
      }
    }
  }

  return [];
};

// eslint-disable-next-line no-console
const warn = (msg: string) => console && typeof console.warn === 'function' && console.warn(msg);

const getTags = <T extends object>(propsList) => {};

const getTagsFromPropsList = <T extends 'link' | 'meta' | 'noscript' | 'script' | 'style'>(
  tagName: T,
  primaryAttributes: string[],
  propsList: HelmetProps[]
): NonNullable<HelmetProps[T]> => {
  // Calculate list of tags, giving priority innermost component (end of the propslist)
  const approvedSeenTags = {};

  return propsList
    .map(props => props[tagName])
    .filter((item): item is NonNullable<HelmetProps[T]> => {
      if (Array.isArray(item)) {
        return true;
      }
      if (typeof item !== 'undefined') {
        warn(
          `Helmet: ${tagName} should be of type "Array". Instead found type "${typeof item[
            tagName
          ]}"`
        );
      }
      return false;
    })
    .reverse()
    .reduce<HelmetProps[T][]>((approvedTags, instanceTags) => {
      const instanceSeenTags: Record<string, Record<string, boolean>> = {};

      instanceTags
        .filter((tag: UnionToIntersection<typeof instanceTags>[number]) => {
          type TagAttributeKey = keyof typeof tag extends string ? keyof typeof tag : never;

          let primaryAttributeKey: TagAttributeKey | undefined;

          for (const attributeKey of Object.keys(tag) as TagAttributeKey[]) {
            const linkTag = tag as React.JSX.IntrinsicElements['link'];
            // const lowerCaseAttributeKey = attributeKey as keyof HelmetProps[T]; // .toLowerCase() as TagAttributeKey;

            // Special rule with link tags, since rel and href are both primary tags, rel takes priority

            if (
              primaryAttributes.includes(attributeKey) &&
              !(
                primaryAttributeKey === TAG_PROPERTIES.REL &&
                tag[primaryAttributeKey]?.toLowerCase() === 'canonical'
              ) &&
              !(
                attributeKey === TAG_PROPERTIES.REL &&
                tag[attributeKey]?.toLowerCase() === 'stylesheet'
              )
            ) {
              primaryAttributeKey = attributeKey;
            }

            // Special case for innerHTML which doesn't work lowercased
            if (
              primaryAttributes.includes(attributeKey) &&
              (attributeKey === TAG_PROPERTIES.INNER_HTML ||
                attributeKey === TAG_PROPERTIES.CSS_TEXT ||
                attributeKey === TAG_PROPERTIES.ITEM_PROP)
            ) {
              primaryAttributeKey = attributeKey;
            }
          }

          if (!primaryAttributeKey || !tag[primaryAttributeKey]) {
            // If we don't have a primary attribute for this tag, or that tag doesn't have a
            // value for the primary attribute then it's an invalid tag and we don't use it.
            return false;
          }

          const value = tag[primaryAttributeKey].toLowerCase();

          if (!approvedSeenTags[primaryAttributeKey]) {
            approvedSeenTags[primaryAttributeKey] = {};
          }

          if (!instanceSeenTags[primaryAttributeKey]) {
            instanceSeenTags[primaryAttributeKey] = {};
          }

          if (!approvedSeenTags[primaryAttributeKey][value]) {
            instanceSeenTags[primaryAttributeKey][value] = true;
            return true;
          }

          return false;
        })
        .reverse()
        .forEach(tag => approvedTags.push(tag));

      // Update seen tags with tags from this instance
      for (const attributeKey of Object.keys(instanceSeenTags)) {
        approvedSeenTags[attributeKey] = {
          ...approvedSeenTags[attributeKey],
          ...instanceSeenTags[attributeKey],
        };
      }

      return approvedTags;
    }, [])
    .reverse();
};

const getAnyTruthyFromPropsList = (
  propsList: HelmetProps[],
  checkedTag: keyof HelmetProps
): boolean => {
  return propsList.some(props => props[checkedTag]);
};

export interface HelmetInternalState {
  baseTag: React.JSX.IntrinsicElements['base'][];
  bodyAttributes: NonNullable<BodyProps>;
  defer?: boolean;
  encode?: boolean;
  htmlAttributes: NonNullable<HtmlProps>;
  linkTags: React.JSX.IntrinsicElements['link'][];
  metaTags: React.JSX.IntrinsicElements['meta'][];
  noscriptTags: { innerHTML: string }[];
  onChangeClientState?: NonNullable<HelmetProps['onChangeClientState']>;
  scriptTags: React.JSX.IntrinsicElements['script'][];
  styleTags: { cssText: string }[];
  title: string | undefined;
  titleAttributes: { itemprop?: string | undefined };
  prioritizeSeoTags?: boolean;
}

export const reducePropsToState = (propsList: HelmetProps[]): HelmetInternalState => {
  return {
    baseTag: getBaseTagFromPropsList(propsList),
    bodyAttributes: getAttributesFromPropsList(ATTRIBUTE_NAMES.BODY, propsList),
    defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER),
    encode: getInnermostProperty(propsList, HELMET_PROPS.ENCODE_SPECIAL_CHARACTERS),
    htmlAttributes: getAttributesFromPropsList(ATTRIBUTE_NAMES.HTML, propsList),
    linkTags: getTagsFromPropsList(
      TAG_NAMES.LINK,
      [TAG_PROPERTIES.REL, TAG_PROPERTIES.HREF],
      propsList
    ),
    metaTags: getTagsFromPropsList(
      TAG_NAMES.META,
      [
        TAG_PROPERTIES.NAME,
        TAG_PROPERTIES.CHARSET,
        TAG_PROPERTIES.HTTPEQUIV,
        TAG_PROPERTIES.PROPERTY,
        TAG_PROPERTIES.ITEM_PROP,
      ],
      propsList
    ),
    noscriptTags: getTagsFromPropsList(TAG_NAMES.NOSCRIPT, [TAG_PROPERTIES.INNER_HTML], propsList),
    onChangeClientState: getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE),
    scriptTags: getTagsFromPropsList(
      TAG_NAMES.SCRIPT,
      [TAG_PROPERTIES.SRC, TAG_PROPERTIES.INNER_HTML],
      propsList
    ),
    styleTags: getTagsFromPropsList(TAG_NAMES.STYLE, [TAG_PROPERTIES.CSS_TEXT], propsList),
    title: getInnermostProperty(propsList, TAG_NAMES.TITLE),
    titleAttributes: getAttributesFromPropsList(ATTRIBUTE_NAMES.TITLE, propsList),
    prioritizeSeoTags: getAnyTruthyFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS),
  };
};

export function flattenArray(possibleArray: string): string;
export function flattenArray(possibleArray: string | undefined): string | undefined;
export function flattenArray(possibleArray: string[]): string;
export function flattenArray(possibleArray: string | string[] | undefined): string | undefined {
  return Array.isArray(possibleArray) ? possibleArray.join('') : possibleArray;
}

type SeoPriorityOptions = 'metaTags' | 'linkTags' | 'scriptTags';

const checkIfPropsMatch = (
  props: HelmetInternalState[SeoPriorityOptions][number],
  toMatch: (typeof SEO_PRIORITY_TAGS)[keyof typeof SEO_PRIORITY_TAGS]
) => {
  for (const [key, value] of Object.entries(props)) {
    // e.g. if rel exists in the list of allowed props [amphtml, alternate, etc]
    if (toMatch[key]?.includes(value)) {
      return true;
    }
  }

  return false;
};

export const prioritizer = <T extends HelmetInternalState[SeoPriorityOptions][number]>(
  elementsList: T[],
  propsToMatch: (typeof SEO_PRIORITY_TAGS)[keyof typeof SEO_PRIORITY_TAGS]
) => {
  return elementsList.reduce<{ priority: T[]; default: T[] }>(
    (acc, elementAttrs) => {
      if (checkIfPropsMatch(elementAttrs, propsToMatch)) {
        acc.priority.push(elementAttrs);
      } else {
        acc.default.push(elementAttrs);
      }
      return acc;
    },
    { priority: [], default: [] }
  );
};

export const without = <T, K extends keyof T>(obj: T, key: K): Except<T, K> => {
  return {
    ...obj,
    [key]: undefined,
  };
};
