import React, { Component, ReactElement, ReactNode, isValidElement } from 'react';
import { isFragment } from 'react-is';
import PropTypes from 'prop-types';
import fastCompare from 'react-fast-compare';
import invariant from 'tiny-invariant';
import { Context } from './Provider';
import HelmetData from './HelmetData';
import Dispatcher from './Dispatcher';
import { without } from './utils';
import { TAG_NAMES, VALID_TAG_NAMES } from './constants';

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

export interface HelmetProps {
  children?: ReactNode;
  async?: boolean;
  base?: JSX.IntrinsicElements['base'];
  bodyAttributes?: BodyProps;
  defaultTitle?: string;
  defer?: boolean;
  encodeSpecialCharacters?: boolean;
  helmetData?: HelmetData;
  htmlAttributes?: HtmlProps;
  onChangeClientState?: (newState: any, addedTags: HelmetTags, removedTags: HelmetTags) => void;
  link?: LinkProps[];
  meta?: MetaProps[];
  noscript?: Array<{ innerHTML: string }>;
  script?: Array<JSX.IntrinsicElements['script']>;
  style?: Array<{ cssText: string }>;
  title?: string;
  titleAttributes?: { itemprop?: string };
  titleTemplate?: string;
  prioritizeSeoTags?: boolean;
}

export type HelmetComponentProps = Pick<
  HelmetProps,
  | 'children'
  | 'async'
  | 'defaultTitle'
  | 'defer'
  | 'encodeSpecialCharacters'
  | 'helmetData'
  | 'onChangeClientState'
  | 'titleTemplate'
  | 'prioritizeSeoTags'
>;

/* eslint-disable class-methods-use-this */
export class Helmet extends Component<HelmetComponentProps> {
  /**
   * @param {Object} base: {"target": "_blank", "href": "http://mysite.com/"}
   * @param {Object} bodyAttributes: {"className": "root"}
   * @param {String} defaultTitle: "Default Title"
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
   * @param {String} titleTemplate: "MySite.com - %s"
   * @param {Boolean} prioritizeSeoTags: false
   */
  /* eslint-disable react/forbid-prop-types, react/require-default-props */
  // static propTypes = {
  //   base: PropTypes.object,
  //   bodyAttributes: PropTypes.object,
  //   children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  //   defaultTitle: PropTypes.string,
  //   defer: PropTypes.bool,
  //   encodeSpecialCharacters: PropTypes.bool,
  //   htmlAttributes: PropTypes.object,
  //   link: PropTypes.arrayOf(PropTypes.object),
  //   meta: PropTypes.arrayOf(PropTypes.object),
  //   noscript: PropTypes.arrayOf(PropTypes.object),
  //   onChangeClientState: PropTypes.func,
  //   script: PropTypes.arrayOf(PropTypes.object),
  //   style: PropTypes.arrayOf(PropTypes.object),
  //   title: PropTypes.string,
  //   titleAttributes: PropTypes.object,
  //   titleTemplate: PropTypes.string,
  //   prioritizeSeoTags: PropTypes.bool,
  //   helmetData: PropTypes.object,
  // };
  /* eslint-enable react/prop-types, react/forbid-prop-types, react/require-default-props */

  static defaultProps = {
    defer: true,
    encodeSpecialCharacters: true,
    prioritizeSeoTags: false,
  };

  static displayName = 'Helmet';

  override shouldComponentUpdate(nextProps: HelmetProps) {
    return !fastCompare(without(this.props, 'helmetData'), without(nextProps, 'helmetData'));
  }

  mapNestedChildrenToProps(child: ReactElement, nestedChildren: ReactNode) {
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

  flattenArrayTypeChildren({
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
          ...this.mapNestedChildrenToProps(child, nestedChildren),
        },
      ],
    };
  }

  mapObjectTypeChildren({
    child,
    newProps,
    newChildProps,
    nestedChildren,
  }: {
    child: ReactElement;
    newProps: any;
    newChildProps: Record<string, unknown>;
    nestedChildren: ReactNode;
  }) {
    switch (child.type) {
      case TAG_NAMES.TITLE:
        return {
          ...newProps,
          [child.type]: nestedChildren,
          titleAttributes: { ...newChildProps },
        };

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

  mapArrayTypeChildrenToProps(arrayTypeChildren: Record<string, any[]>, newProps: HelmetProps) {
    let newFlattenedProps = { ...newProps };

    Object.entries(arrayTypeChildren).forEach(([arrayChildName, arrayChild]) => {
      newFlattenedProps = {
        ...newFlattenedProps,
        [arrayChildName]: arrayChild,
      };
    });

    return newFlattenedProps;
  }

  warnOnInvalidChildren(
    child: ReactElement,
    nestedChildren: any
  ): child is ReactElement<any, typeof VALID_TAG_NAMES[number]> {
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

  mapChildrenToProps(children: ReactNode, newProps: HelmetProps): HelmetProps {
    let arrayTypeChildren = {};

    React.Children.forEach(children, child => {
      if (!child || !isValidElement(child) || !child.props) {
        return;
      }

      const { children: nestedChildren, ...childProps } = child.props;
      // convert React props to HTML attributes
      const newChildProps = Object.entries(childProps).reduce<Record<string, unknown>>(
        (obj, [key, value]) => {
          obj[key] = value;
          return obj;
        },
        {}
      );

      if (isFragment(child)) {
        newProps = this.mapChildrenToProps(nestedChildren, newProps);
      } else {
        this.warnOnInvalidChildren(child, nestedChildren);

        switch ((child as ReactElement).type) {
          case TAG_NAMES.LINK:
          case TAG_NAMES.META:
          case TAG_NAMES.NOSCRIPT:
          case TAG_NAMES.SCRIPT:
          case TAG_NAMES.STYLE:
            arrayTypeChildren = this.flattenArrayTypeChildren({
              child,
              arrayTypeChildren,
              newChildProps,
              nestedChildren,
            });
            break;

          default:
            newProps = this.mapObjectTypeChildren({
              child,
              newProps,
              newChildProps,
              nestedChildren,
            });
            break;
        }
      }
    });

    return this.mapArrayTypeChildrenToProps(arrayTypeChildren, newProps);
  }

  override render() {
    const { children, ...props } = this.props;
    let newProps = { ...props };
    let { helmetData } = props;

    if (children) {
      newProps = this.mapChildrenToProps(children, newProps);
    }

    if (helmetData && !(helmetData instanceof HelmetData)) {
      // @ts-expect-error
      helmetData = new HelmetData(helmetData.context, helmetData.instances);
    }

    return helmetData ? (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Dispatcher {...newProps} context={helmetData.value} helmetData={undefined} />
    ) : (
      <Context.Consumer>
        {(
          context // eslint-disable-next-line react/jsx-props-no-spreading
        ) => <Dispatcher {...newProps} context={context} />}
      </Context.Consumer>
    );
  }
}
