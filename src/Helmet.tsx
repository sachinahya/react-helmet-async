import React, { Component, ReactElement, ReactNode, isValidElement } from 'react';
import { isFragment } from 'react-is';
import fastCompare from 'react-fast-compare';
import invariant from 'tiny-invariant';
import { Context } from './Provider';
import { TAG_NAMES, VALID_TAG_NAMES } from './constants';

export interface HelmetTags {
  baseTag: Array<any>;
  linkTags: Array<HTMLLinkElement>;
  metaTags: Array<HTMLMetaElement>;
  noscriptTags: Array<any>;
  scriptTags: Array<HTMLScriptElement>;
  styleTags: Array<HTMLStyleElement>;
}

export interface HelmetPropsTags {
  base?: React.JSX.IntrinsicElements['base'][];
  link?: React.JSX.IntrinsicElements['link'][];
  meta?: React.JSX.IntrinsicElements['meta'][];
  noscript?: { innerHTML: string }[];
  script?: React.JSX.IntrinsicElements['script'][];
  style?: { cssText: string }[];
}

export interface HelmetPropsAttributes {
  bodyAttributes?: React.JSX.IntrinsicElements['body'];
  htmlAttributes?: React.JSX.IntrinsicElements['html'];
  titleAttributes?: React.JSX.IntrinsicElements['title'];
}

export interface HelmetPropsTitle {
  title?: string | string[];
}

export interface HelmetOptions {
  defer?: boolean;
  encodeSpecialCharacters?: boolean;
  onChangeClientState?: (newState: any, addedTags: HelmetTags, removedTags: HelmetTags) => void;
  prioritizeSeoTags?: boolean;
}

export interface HelmetComponentProps extends HelmetOptions {
  children?: ReactNode;
}

export interface HelmetProps
  extends HelmetPropsTags,
    HelmetPropsAttributes,
    HelmetPropsTitle,
    HelmetComponentProps {}

function mapNestedChildrenToProps(child: ReactElement, nestedChildren: ReactNode) {
  if (!nestedChildren) {
    return null;
  }

  switch (child.type) {
    case TAG_NAMES.SCRIPT:
    case TAG_NAMES.NOSCRIPT:
      return {
        innerHTML: nestedChildren,
      };

    case TAG_NAMES.STYLE:
      return {
        cssText: nestedChildren,
      };
    default:
      throw new Error(
        `<${child.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`
      );
  }
}

function flattenArrayTypeChildren({
  child,
  arrayTypeChildren,
  newChildProps,
  nestedChildren,
}: {
  child: ReactElement;
  arrayTypeChildren: Record<string, any[]>;
  newChildProps: Record<string, unknown>;
  nestedChildren: ReactNode;
}): Record<string, any[]> {
  if (typeof child.type !== 'string') {
    return arrayTypeChildren;
  }

  return {
    ...arrayTypeChildren,
    [child.type]: [
      ...(arrayTypeChildren[child.type] || []),
      {
        ...newChildProps,
        ...mapNestedChildrenToProps(child, nestedChildren),
      },
    ],
  };
}

function mapObjectTypeChildren({
  child,
  newProps,
  newChildProps,
  nestedChildren,
}: {
  child: ReactElement;
  newProps: HelmetProps;
  newChildProps: object;
  nestedChildren: ReactNode;
}): HelmetProps {
  switch (child.type) {
    case TAG_NAMES.TITLE: {
      return {
        ...newProps,
        // eslint-disable-next-line no-nested-ternary
        [child.type]: Array.isArray(nestedChildren)
          ? nestedChildren
          : nestedChildren
          ? String(nestedChildren)
          : undefined,
        titleAttributes: { ...newChildProps },
      };
    }

    case TAG_NAMES.BODY:
      return {
        ...newProps,
        bodyAttributes: { ...newChildProps },
      };

    case TAG_NAMES.HTML:
      return {
        ...newProps,
        htmlAttributes: { ...newChildProps },
      };
    default:
      return typeof child.type === 'string'
        ? {
            ...newProps,
            [child.type]: { ...newChildProps },
          }
        : newProps;
  }
}

function mapArrayTypeChildrenToProps(
  arrayTypeChildren: Record<string, any[]>,
  newProps: HelmetProps
) {
  let newFlattenedProps = { ...newProps };

  Object.entries(arrayTypeChildren).forEach(([arrayChildName, arrayChild]) => {
    newFlattenedProps = {
      ...newFlattenedProps,
      [arrayChildName]: arrayChild,
    };
  });

  return newFlattenedProps;
}

function warnOnInvalidChildren(
  child: ReactElement,
  nestedChildren: any
): child is ReactElement<any, (typeof VALID_TAG_NAMES)[number]> {
  invariant(
    VALID_TAG_NAMES.some(name => child.type === name),
    typeof child.type === 'function'
      ? `You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.`
      : `Only elements types ${VALID_TAG_NAMES.join(
          ', '
        )} are allowed. Helmet does not support rendering <${
          child.type
        }> elements. Refer to our API for more information.`
  );

  invariant(
    !nestedChildren ||
      typeof nestedChildren === 'string' ||
      (Array.isArray(nestedChildren) &&
        !nestedChildren.some(nestedChild => typeof nestedChild !== 'string')),
    `Helmet expects a string as a child of <${child.type}>. Did you forget to wrap your children in braces? ( <${child.type}>{\`\`}</${child.type}> ) Refer to our API for more information.`
  );

  return true;
}

function mapChildrenToProps(componentProps: HelmetComponentProps): HelmetProps {
  let arrayTypeChildren = {};

  // eslint-disable-next-line prefer-const
  let { children, ...newProps } = componentProps;

  React.Children.forEach(children, child => {
    if (!child || !isValidElement(child) || !child.props) {
      return;
    }

    const { children: nestedChildren, ...childProps } = child.props;
    // convert React props to HTML attributes
    const newChildProps = childProps;

    if (isFragment(child)) {
      newProps = mapChildrenToProps({ children: nestedChildren, ...newProps });
    } else {
      warnOnInvalidChildren(child, nestedChildren);

      switch ((child as ReactElement).type) {
        case TAG_NAMES.BASE:
        case TAG_NAMES.LINK:
        case TAG_NAMES.META:
        case TAG_NAMES.NOSCRIPT:
        case TAG_NAMES.SCRIPT:
        case TAG_NAMES.STYLE:
          arrayTypeChildren = flattenArrayTypeChildren({
            child,
            arrayTypeChildren,
            newChildProps,
            nestedChildren,
          });
          break;

        default:
          newProps = mapObjectTypeChildren({
            child,
            newProps,
            newChildProps,
            nestedChildren,
          });
          break;
      }
    }
  });

  return mapArrayTypeChildrenToProps(arrayTypeChildren, newProps);
}

export class Helmet extends Component<HelmetComponentProps> {
  static defaultProps: Partial<HelmetComponentProps> = {
    defer: true,
    encodeSpecialCharacters: true,
    prioritizeSeoTags: false,
  };

  static override contextType = Context;

  // @ts-expect-error
  override context!: React.ContextType<typeof Context>;

  rendered = false;

  override shouldComponentUpdate(nextProps: HelmetComponentProps) {
    return !fastCompare(this.props, nextProps);
  }

  override componentDidUpdate() {
    const mappedProps = mapChildrenToProps(this.props);
    this.context.update(this, mappedProps);
  }

  override componentWillUnmount() {
    this.context.remove(this);
  }

  override render() {
    if (!this.rendered) {
      this.rendered = true;

      const mappedProps = mapChildrenToProps(this.props);
      this.context.update(this, mappedProps);
    }

    return null;
  }
}
