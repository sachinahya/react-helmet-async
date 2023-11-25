import { JSX } from 'react';
import { TAG_NAMES, ATTRIBUTE_NAMES } from './constants';

export interface TagState {
  base: JSX.IntrinsicElements['base'][];
  link: JSX.IntrinsicElements['link'][];
  meta: JSX.IntrinsicElements['meta'][];
  noscript: JSX.IntrinsicElements['noscript'][];
  script: JSX.IntrinsicElements['script'][];
  style: JSX.IntrinsicElements['style'][];
}

export interface AttributeState {
  bodyAttributes: JSX.IntrinsicElements['body'];
  htmlAttributes: JSX.IntrinsicElements['html'];
  titleAttributes: JSX.IntrinsicElements['title'];
}

export interface TitleState {
  title: string | string[] | undefined;
}

export interface HeadState extends TagState, AttributeState, TitleState {}

export interface TagProps extends Partial<TagState> {}

export interface AttributeProps extends Partial<AttributeState> {}

export interface TitleProps extends Partial<TitleState> {}

export interface HeadProps extends Partial<HeadState> {}

const getInnermostProperty = <T extends keyof HeadProps>(
  propsList: HeadProps[],
  property: T
): HeadProps[T] | undefined => {
  for (let propsIndex = propsList.length - 1; propsIndex >= 0; propsIndex--) {
    const props = propsList[propsIndex];

    if (props?.[property] != null) {
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
  tagName: T
): TagState[T] => {
  const approvedTags: TagState[T] = [];

  for (let propsIndex = propsList.length - 1; propsIndex >= 0; propsIndex--) {
    const instanceTags = propsList[propsIndex]?.[tagName];

    if (instanceTags) {
      for (let tagIndex = instanceTags.length - 1; tagIndex >= 0; tagIndex--) {
        // @ts-expect-error
        approvedTags.unshift(instanceTags[tagIndex]);
      }
    }
  }

  return approvedTags;
};

const getBaseTagFromPropsList = (propsList: TagProps[]): TagState['base'] => {
  for (let propsIndex = propsList.length - 1; propsIndex >= 0; propsIndex--) {
    const props = propsList[propsIndex];

    if (props?.base) {
      for (let baseIndex = props.base.length - 1; baseIndex >= 0; baseIndex--) {
        const baseTag = props.base[baseIndex];

        if (baseTag?.href) {
          return [baseTag];
        }
      }
    }
  }

  return [];
};

export const instancePropsToState = (propsList: HeadProps[]): HeadState => {
  return {
    base: getBaseTagFromPropsList(propsList),
    bodyAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.BODY),
    htmlAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.HTML),
    link: getTagsFromPropsList(propsList, TAG_NAMES.LINK),
    meta: getTagsFromPropsList(propsList, TAG_NAMES.META),
    noscript: getTagsFromPropsList(propsList, TAG_NAMES.NOSCRIPT),
    script: getTagsFromPropsList(propsList, TAG_NAMES.SCRIPT),
    style: getTagsFromPropsList(propsList, TAG_NAMES.STYLE),
    title: getInnermostProperty(propsList, TAG_NAMES.TITLE),
    titleAttributes: getAttributesFromPropsList(propsList, ATTRIBUTE_NAMES.TITLE),
  };
};
