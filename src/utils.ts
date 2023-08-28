import { BaseHTMLAttributes } from 'react';
import { HelmetProps } from '.';
import { TAG_NAMES, TAG_PROPERTIES, ATTRIBUTE_NAMES } from './constants';

const HELMET_PROPS = {
  DEFAULT_TITLE: 'defaultTitle',
  DEFER: 'defer',
  ENCODE_SPECIAL_CHARACTERS: 'encodeSpecialCharacters',
  ON_CHANGE_CLIENT_STATE: 'onChangeClientState',
  TITLE_TEMPLATE: 'titleTemplate',
  PRIORITIZE_SEO_TAGS: 'prioritizeSeoTags',
} as const satisfies Record<string, keyof HelmetProps>;

const getInnermostProperty = <T extends keyof HelmetProps>(
  propsList: HelmetProps[],
  property: T
): HelmetProps[T] | null => {
  for (let i = propsList.length - 1; i >= 0; i -= 1) {
    const props = propsList[i];

    if (Object.prototype.hasOwnProperty.call(props, property)) {
      return props[property];
    }
  }

  return null;
};

const getTitleFromPropsList = (propsList: HelmetProps[]): string | undefined => {
  let innermostTitle = getInnermostProperty(propsList, TAG_NAMES.TITLE);
  const innermostTemplate = getInnermostProperty(propsList, HELMET_PROPS.TITLE_TEMPLATE);
  if (Array.isArray(innermostTitle)) {
    innermostTitle = innermostTitle.join('');
  }
  if (innermostTemplate && innermostTitle) {
    // use function arg to avoid need to escape $ characters
    return innermostTemplate.replace(/%s/g, () => innermostTitle);
  }

  const innermostDefaultTitle = getInnermostProperty(propsList, HELMET_PROPS.DEFAULT_TITLE);

  return innermostTitle || innermostDefaultTitle || undefined;
};

const getOnChangeClientState = (propsList: HelmetProps[]) =>
  getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE) || (() => {});

const getAttributesFromPropsList = <
  T extends (typeof ATTRIBUTE_NAMES)[keyof typeof ATTRIBUTE_NAMES],
>(
  tagType: T,
  propsList: HelmetProps[]
): HelmetProps[T] =>
  propsList
    .filter(props => typeof props[tagType] !== 'undefined')
    .map(props => props[tagType])
    .reduce<HelmetProps[T]>((tagAttrs, current) => ({ ...tagAttrs, ...current }), {});

const getBaseTagFromPropsList = (
  primaryAttributes: string[],
  propsList: HelmetProps[]
): BaseHTMLAttributes<HTMLBaseElement>[] =>
  propsList
    .filter(props => typeof props[TAG_NAMES.BASE] !== 'undefined')
    .map(props => props[TAG_NAMES.BASE])
    .reverse()
    .reduce<BaseHTMLAttributes<HTMLBaseElement>[]>((innermostBaseTag, tag) => {
      if (innermostBaseTag.length === 0) {
        const keys = Object.keys(tag);

        for (let i = 0; i < keys.length; i += 1) {
          const attributeKey = keys[i];
          const lowerCaseAttributeKey = attributeKey.toLowerCase();

          if (primaryAttributes.includes(lowerCaseAttributeKey) && tag[lowerCaseAttributeKey]) {
            // Only include a base tag if it has truthy values for all of the primaryAttributes.
            return innermostBaseTag.concat(tag);
          }
        }
      }

      return innermostBaseTag;
    }, []);

// eslint-disable-next-line no-console
const warn = msg => console && typeof console.warn === 'function' && console.warn(msg);

const getTagsFromPropsList = <
  T extends
    | typeof TAG_NAMES.LINK
    | typeof TAG_NAMES.META
    | typeof TAG_NAMES.NOSCRIPT
    | typeof TAG_NAMES.SCRIPT
    | typeof TAG_NAMES.STYLE,
>(
  tagName: T,
  primaryAttributes: string[],
  propsList: HelmetProps[]
): HelmetProps[T] => {
  // Calculate list of tags, giving priority innermost component (end of the propslist)
  const approvedSeenTags = {};

  return propsList
    .filter(props => {
      if (Array.isArray(props[tagName])) {
        return true;
      }
      if (typeof props[tagName] !== 'undefined') {
        warn(
          `Helmet: ${tagName} should be of type "Array". Instead found type "${typeof props[
            tagName
          ]}"`
        );
      }
      return false;
    })
    .map(props => props[tagName])
    .reverse()
    .reduce<HelmetProps[T][]>((approvedTags, instanceTags) => {
      const instanceSeenTags = {};

      instanceTags
        .filter((tag: (typeof instanceTags)[number]) => {
          let primaryAttributeKey: string;
          const keys = Object.keys(tag);
          for (let i = 0; i < keys.length; i += 1) {
            const attributeKey = keys[i];
            const lowerCaseAttributeKey = attributeKey.toLowerCase();

            // Special rule with link tags, since rel and href are both primary tags, rel takes priority
            if (
              primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 &&
              !(
                primaryAttributeKey === TAG_PROPERTIES.REL &&
                tag[primaryAttributeKey].toLowerCase() === 'canonical'
              ) &&
              !(
                lowerCaseAttributeKey === TAG_PROPERTIES.REL &&
                tag[lowerCaseAttributeKey].toLowerCase() === 'stylesheet'
              )
            ) {
              primaryAttributeKey = lowerCaseAttributeKey;
            }
            // Special case for innerHTML which doesn't work lowercased
            if (
              primaryAttributes.indexOf(attributeKey) !== -1 &&
              (attributeKey === TAG_PROPERTIES.INNER_HTML ||
                attributeKey === TAG_PROPERTIES.CSS_TEXT ||
                attributeKey === TAG_PROPERTIES.ITEM_PROP)
            ) {
              primaryAttributeKey = attributeKey;
            }
          }

          if (!primaryAttributeKey || !tag[primaryAttributeKey]) {
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
        .forEach((tag: HelmetProps[T]) => approvedTags.push(tag));

      // Update seen tags with tags from this instance
      const keys = Object.keys(instanceSeenTags);
      for (let i = 0; i < keys.length; i += 1) {
        const attributeKey = keys[i];
        const tagUnion = {
          ...approvedSeenTags[attributeKey],
          ...instanceSeenTags[attributeKey],
        };

        approvedSeenTags[attributeKey] = tagUnion;
      }

      return approvedTags;
    }, [])
    .reverse();
};

const getAnyTrueFromPropsList = (propsList: HelmetProps[], checkedTag) => {
  if (Array.isArray(propsList) && propsList.length) {
    for (let index = 0; index < propsList.length; index += 1) {
      const prop = propsList[index];
      if (prop[checkedTag]) {
        return true;
      }
    }
  }
  return false;
};

export interface ReducedState {
  baseTag: BaseHTMLAttributes<HTMLBaseElement>[];
  bodyAttributes: HelmetProps['bodyAttributes'];
  defer: HelmetProps['defer'];
  encode: HelmetProps['encodeSpecialCharacters'];
  htmlAttributes: HelmetProps['htmlAttributes'];
  linkTags: HelmetProps['link'];
  metaTags: HelmetProps['meta'];
  noscriptTags: HelmetProps['noscript'];
  onChangeClientState: HelmetProps['onChangeClientState'];
  scriptTags: HelmetProps['script'];
  styleTags: HelmetProps['style'];
  title: string | undefined;
  titleAttributes: HelmetProps['titleAttributes'];
  prioritizeSeoTags: HelmetProps['prioritizeSeoTags'];
}

export const reducePropsToState = (propsList: HelmetProps[]): ReducedState => ({
  baseTag: getBaseTagFromPropsList([TAG_PROPERTIES.HREF], propsList),
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
  onChangeClientState: getOnChangeClientState(propsList),
  scriptTags: getTagsFromPropsList(
    TAG_NAMES.SCRIPT,
    [TAG_PROPERTIES.SRC, TAG_PROPERTIES.INNER_HTML],
    propsList
  ),
  styleTags: getTagsFromPropsList(TAG_NAMES.STYLE, [TAG_PROPERTIES.CSS_TEXT], propsList),
  title: getTitleFromPropsList(propsList),
  titleAttributes: getAttributesFromPropsList(ATTRIBUTE_NAMES.TITLE, propsList),
  prioritizeSeoTags: getAnyTrueFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS),
});

export const flattenArray = (possibleArray: string | string[]): string =>
  Array.isArray(possibleArray) ? possibleArray.join('') : possibleArray;

const checkIfPropsMatch = (props, toMatch) => {
  const keys = Object.keys(props);
  for (let i = 0; i < keys.length; i += 1) {
    // e.g. if rel exists in the list of allowed props [amphtml, alternate, etc]
    if (toMatch[keys[i]] && toMatch[keys[i]].includes(props[keys[i]])) {
      return true;
    }
  }
  return false;
};

export const prioritizer = <
  T extends ReducedState['metaTags'] | ReducedState['linkTags'] | ReducedState['scriptTags'],
>(
  elementsList: T,
  propsToMatch: any
): {
  priority?: T;
  default: T;
} => {
  if (Array.isArray(elementsList)) {
    return elementsList.reduce(
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
  }
  return { default: elementsList };
};

export const without = (obj, key) => {
  return {
    ...obj,
    [key]: undefined,
  };
};
