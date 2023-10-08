import React, { Component, ContextType, ReactElement, ReactNode, isValidElement } from 'react';
import { isFragment } from 'react-is';
import fastCompare from 'react-fast-compare';
import invariant from 'tiny-invariant';
import Provider, { Context } from './Provider';
import HelmetData from './HelmetData';
import { without } from './utils';
import { TAG_NAMES, VALID_TAG_NAMES } from './constants';
import { reducePropsToState } from './state';
import { handleStateChangeOnClient } from './client';
import mapStateOnServer from './server';

export interface OtherElementAttributes {
  [key: string]: string | number | boolean | null | undefined;
}

export type BodyProps = JSX.IntrinsicElements['body'] & OtherElementAttributes;

export type HtmlProps = JSX.IntrinsicElements['html'] & OtherElementAttributes;

export type LinkProps = JSX.IntrinsicElements['link'];

export type MetaProps = JSX.IntrinsicElements['meta'];

export interface HelmetTags {
  baseTag: Array<any>;
  linkTags: Array<HTMLLinkElement>;
  metaTags: Array<HTMLMetaElement>;
  noscriptTags: Array<any>;
  scriptTags: Array<HTMLScriptElement>;
  styleTags: Array<HTMLStyleElement>;
}

export interface HelmetPropsTags {
  base?: JSX.IntrinsicElements['base'][];
  link?: LinkProps[];
  meta?: MetaProps[];
  noscript?: Array<{ innerHTML: string }>;
  script?: Array<JSX.IntrinsicElements['script']>;
  style?: Array<{ cssText: string }>;
}

export interface HelmetPropsAttributes {
  bodyAttributes?: BodyProps;
  htmlAttributes?: HtmlProps;
  titleAttributes?: { itemprop?: string };
}

export interface HelmetPropsTitle {
  title?: string | string[];
}

export interface HelmetProps extends HelmetPropsTags, HelmetPropsAttributes, HelmetPropsTitle {
  children?: ReactNode;
  defer?: boolean;
  encodeSpecialCharacters?: boolean;
  onChangeClientState?: (newState: any, addedTags: HelmetTags, removedTags: HelmetTags) => void;
  prioritizeSeoTags?: boolean;
}

export type HelmetComponentProps = Pick<
  HelmetProps,
  'children' | 'defer' | 'encodeSpecialCharacters' | 'onChangeClientState' | 'prioritizeSeoTags'
>;

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

function mapChildrenToProps(children: ReactNode, newProps: HelmetProps): HelmetProps {
  let arrayTypeChildren = {};

  React.Children.forEach(children, child => {
    if (!child || !isValidElement(child) || !child.props) {
      return;
    }

    const { children: nestedChildren, ...childProps } = child.props;
    // convert React props to HTML attributes
    const newChildProps = childProps;

    if (isFragment(child)) {
      newProps = mapChildrenToProps(nestedChildren, newProps);
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
  /**
   * @param {Object} base: {"target": "_blank", "href": "http://mysite.com/"}
   * @param {Object} bodyAttributes: {"className": "root"}
   * @param {Boolean} defer: true
   * @param {Boolean} encodeSpecialCharacters: true
   * @param {Object} htmlAttributes: {"lang": "en", "amp": undefined}
   * @param {Array} link: [{"rel": "canonical", "href": "http://mysite.com/example"}]
   * @param {Array} meta: [{"name": "description", "content": "Test description"}]
   * @param {Array} noscript: [{"innerHTML": "<img src='http://mysite.com/js/test.js'"}]
   * @param {Function} onChangeClientState: "(newState) => console.log(newState)"
   * @param {Array} script: [{"type": "text/javascript", "src": "http://mysite.com/js/test.js"}, "innerHTML": "console.log()"]
   * @param {Array} style: [{"type": "text/css", "cssText": "div { display: block; color: blue; }"}]
   * @param {String} title: "Title"
   * @param {Object} titleAttributes: {"itemprop": "name"}
   * @param {Boolean} prioritizeSeoTags: false
   */

  static defaultProps = {
    defer: true,
    encodeSpecialCharacters: true,
    prioritizeSeoTags: false,
  };

  static override contextType = Context;

  static displayName = 'Helmet';

  // @ts-expect-error
  override context!: React.ContextType<typeof Context>;

  rendered = false;

  override shouldComponentUpdate(nextProps: HelmetProps) {
    return !fastCompare(this.props, nextProps);
  }

  override componentDidUpdate() {
    const { children, ...props } = this.props;
    const mappedProps = mapChildrenToProps(children, { ...props });

    this.context.helmetInstances.update(this, mappedProps);

    this.emitChange();
  }

  override componentWillUnmount() {
    const { helmetInstances } = this.context;
    helmetInstances.remove(this);
    this.emitChange();
  }

  emitChange() {
    const { helmetInstances, setHelmet } = this.context;
    const propsList = helmetInstances.get().map(instance => {
      // const { ...props } = instance[1];
      return instance[1];
    });
    const state = reducePropsToState(propsList);
    if (Provider.canUseDOM) {
      handleStateChangeOnClient(state);
    } else if (mapStateOnServer) {
      const serverState = mapStateOnServer(state);
      setHelmet(serverState);
    }
  }

  override render() {
    if (this.rendered) {
      return null;
    }

    this.rendered = true;

    const { children, ...props } = this.props;
    const mappedProps = mapChildrenToProps(children, { ...props });

    const { helmetInstances } = this.context;
    helmetInstances.add(this, mappedProps);
    this.emitChange();

    return null;
  }
}
