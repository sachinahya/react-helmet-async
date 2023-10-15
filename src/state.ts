import { LinkHTMLAttributes } from 'react';
import { TAG_NAMES, TAG_PROPERTIES, ATTRIBUTE_NAMES, HELMET_PROPS } from './constants';

export interface TagState {
  base: React.JSX.IntrinsicElements['base'][];
  link: React.JSX.IntrinsicElements['link'][];
  meta: React.JSX.IntrinsicElements['meta'][];
  noscript: React.JSX.IntrinsicElements['noscript'][];
  script: React.JSX.IntrinsicElements['script'][];
  style: React.JSX.IntrinsicElements['style'][];
}

export interface AttributeState {
  bodyAttributes: React.JSX.IntrinsicElements['body'];
  htmlAttributes: React.JSX.IntrinsicElements['html'];
  titleAttributes: React.JSX.IntrinsicElements['title'];
}

export interface TitleState {
  title: string | string[];
}

export interface OptionsState {
  defer: boolean;
  onChangeClientState: (newState: any, addedTags: any, removedTags: any) => void;
  prioritizeSeoTags: boolean;
}

export interface HelmetState extends TagState, AttributeState, TitleState, OptionsState {}

export interface TagProps extends Partial<TagState> {}

export interface AttributeProps extends Partial<AttributeState> {}

export interface TitleProps extends Partial<TitleState> {}

export interface OptionsProps extends Partial<OptionsState> {}

export interface HelmetProps extends Partial<HelmetState> {}

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

const getAttributesFromPropsList = <T extends keyof AttributeProps>(
  propsList: AttributeProps[],
  tagType: T
): AttributeState[T] => {
  const mergedAttributes: AttributeState[T] = {};

  for (const props of propsList) {
    if (props[tagType] != null) {
      Object.assign(mergedAttributes, props[tagType]);
    }
  }

  return mergedAttributes;
};

const getTagsFromPropsList = <T extends keyof TagProps>(
  propsList: TagProps[],
  tagName: T,
  primaryAttributes: string[]
): TagState[T] => {
  // Calculate list of tags, giving priority innermost component (end of the propslist)
  const approvedSeenTags: Record<string, Record<string, boolean>> = {};

  const approvedTags: TagState[T] = [];

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
          (attributeKey === TAG_PROPERTIES.CHILDREN || attributeKey === TAG_PROPERTIES.ITEM_PROP)
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

const getBaseTagFromPropsList = (propsList: TagProps[]): TagState['base'] => {
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

export const reducePropsToState = (propsList: HelmetProps[]): HelmetState => {
  return {
    base: getBaseTagFromPropsList(propsList),
    bodyAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.BODY),
    defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER)!,
    htmlAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.HTML),
    link: getTagsFromPropsList(propsList, TAG_NAMES.LINK, [
      TAG_PROPERTIES.REL,
      TAG_PROPERTIES.HREF,
    ]),
    meta: getTagsFromPropsList(propsList, TAG_NAMES.META, [
      TAG_PROPERTIES.NAME,
      TAG_PROPERTIES.CHARSET,
      TAG_PROPERTIES.HTTPEQUIV,
      TAG_PROPERTIES.PROPERTY,
      TAG_PROPERTIES.ITEM_PROP,
    ]),
    noscript: getTagsFromPropsList(propsList, TAG_NAMES.NOSCRIPT, [TAG_PROPERTIES.CHILDREN]),
    onChangeClientState: getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE)!,
    script: getTagsFromPropsList(propsList, TAG_NAMES.SCRIPT, [
      TAG_PROPERTIES.SRC,
      TAG_PROPERTIES.CHILDREN,
    ]),
    style: getTagsFromPropsList(propsList, TAG_NAMES.STYLE, [TAG_PROPERTIES.CHILDREN]),
    title: getInnermostProperty(propsList, TAG_NAMES.TITLE)!,
    titleAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.TITLE),
    prioritizeSeoTags: getAnyTruthyFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS),
  };
};
