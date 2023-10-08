import { LinkHTMLAttributes } from 'react';
import {
  BodyProps,
  HelmetProps,
  HelmetPropsAttributes,
  HelmetPropsTags,
  HtmlProps,
} from './Helmet';
import { TAG_NAMES, TAG_PROPERTIES, ATTRIBUTE_NAMES, HELMET_PROPS } from './constants';

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

const getAttributesFromPropsList = <T extends keyof HelmetPropsAttributes>(
  propsList: HelmetProps[],
  tagType: T
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

const getTagsFromPropsList = <T extends keyof HelmetPropsTags>(
  propsList: HelmetPropsTags[],
  tagName: T,
  primaryAttributes: string[]
): NonNullable<HelmetPropsTags[T]> => {
  // // Calculate list of tags, giving priority innermost component (end of the propslist)
  const approvedSeenTags: Record<string, Record<string, boolean>> = {};

  const approvedTags: NonNullable<HelmetPropsTags[T]> = [];

  for (const props of [...propsList].reverse()) {
    const instanceTags = props[tagName];

    if (instanceTags == null) {
      continue;
    }

    const instanceSeenTags: Record<string, Record<string, boolean>> = {};

    const filteredTags = instanceTags.filter(tag => {
      let primaryAttributeKey: string | undefined;

      for (const attributeKey of Object.keys(tag)) {
        if (primaryAttributes.includes(attributeKey)) {
          // Special rule with link tags, since rel and href are both primary tags, rel takes priority
          const linkTag =
            tagName === TAG_NAMES.LINK && (tag as LinkHTMLAttributes<HTMLLinkElement>);

          const isRelCanonical =
            linkTag &&
            primaryAttributeKey === TAG_PROPERTIES.REL &&
            linkTag[primaryAttributeKey]?.toLowerCase() === 'canonical';

          const isRelStylesheet =
            linkTag &&
            attributeKey === TAG_PROPERTIES.REL &&
            linkTag[attributeKey]?.toLowerCase() === 'stylesheet';

          if (!isRelCanonical && !isRelStylesheet) {
            primaryAttributeKey = attributeKey;
          }
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

      if (!primaryAttributeKey || !(tag as Record<string, string>)[primaryAttributeKey]) {
        // If we don't have a primary attribute for this tag, or that tag doesn't have a
        // value for the primary attribute then it's an invalid tag and we don't use it.
        return false;
      }

      const value = (tag as Record<string, string>)[primaryAttributeKey]?.toLowerCase() || '';

      if (!(approvedSeenTags[primaryAttributeKey] ??= {})[value]) {
        (instanceSeenTags[primaryAttributeKey] ??= {})[value] = true;
        return true;
      }

      return false;
    });

    for (const tag of filteredTags.reverse()) {
      // @ts-expect-error
      approvedTags.unshift(tag);
    }

    // Update seen tags with tags from this instance
    for (const attributeKey of Object.keys(instanceSeenTags)) {
      Object.assign(approvedSeenTags[attributeKey]!, instanceSeenTags[attributeKey]);
    }
  }

  return approvedTags;
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
  title: string | string[] | undefined;
  titleAttributes: { itemprop?: string | undefined };
  prioritizeSeoTags?: boolean;
}

export const reducePropsToState = (propsList: HelmetProps[]): HelmetInternalState => {
  return {
    baseTag: getBaseTagFromPropsList(propsList),
    bodyAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.BODY),
    defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER),
    encode: getInnermostProperty(propsList, HELMET_PROPS.ENCODE_SPECIAL_CHARACTERS),
    htmlAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.HTML),
    linkTags: getTagsFromPropsList(propsList, TAG_NAMES.LINK, [
      TAG_PROPERTIES.REL,
      TAG_PROPERTIES.HREF,
    ]),
    metaTags: getTagsFromPropsList(propsList, TAG_NAMES.META, [
      TAG_PROPERTIES.NAME,
      TAG_PROPERTIES.CHARSET,
      TAG_PROPERTIES.HTTPEQUIV,
      TAG_PROPERTIES.PROPERTY,
      TAG_PROPERTIES.ITEM_PROP,
    ]),
    noscriptTags: getTagsFromPropsList(propsList, TAG_NAMES.NOSCRIPT, [TAG_PROPERTIES.INNER_HTML]),
    onChangeClientState: getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE),
    scriptTags: getTagsFromPropsList(propsList, TAG_NAMES.SCRIPT, [
      TAG_PROPERTIES.SRC,
      TAG_PROPERTIES.INNER_HTML,
    ]),
    styleTags: getTagsFromPropsList(propsList, TAG_NAMES.STYLE, [TAG_PROPERTIES.CSS_TEXT]),
    title: getInnermostProperty(propsList, TAG_NAMES.TITLE),
    titleAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.TITLE),
    prioritizeSeoTags: getAnyTruthyFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS),
  };
};
