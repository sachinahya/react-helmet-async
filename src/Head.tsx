import {
  Children,
  Component,
  ContextType,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  isValidElement,
} from 'react';
import { isFragment } from 'react-is';
import fastCompare from 'react-fast-compare';
import invariant from 'tiny-invariant';
import { HeadContext } from './HeadContext';
import { NON_SELF_CLOSING_TAGS, TAG_NAMES, VALID_TAG_NAMES } from './constants';
import { HeadProps } from './state';

export interface HeadComponentProps {
  children?: ReactNode;
}

function flattenArrayTypeChildren(
  arrayTypeChildren: Record<string, unknown[]>,
  child: ReactElement<PropsWithChildren>
): void {
  if (typeof child.type !== 'string') {
    return;
  }

  const newChildProps = { ...child.props };

  if (newChildProps.children) {
    const isSelfClosing = !NON_SELF_CLOSING_TAGS.includes(child.type);

    if (isSelfClosing) {
      throw new Error(
        `<${child.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`
      );
    }
  }

  (arrayTypeChildren[child.type] ??= []).push(newChildProps);
}

function mapObjectTypeChildren(
  mappedProps: HeadProps,
  child: ReactElement<PropsWithChildren>
): HeadProps {
  const { children: nestedChildren, ...newChildProps } = child.props;

  switch (child.type) {
    case TAG_NAMES.TITLE: {
      // eslint-disable-next-line no-nested-ternary
      mappedProps.title = Array.isArray(nestedChildren)
        ? nestedChildren
        : nestedChildren
        ? String(nestedChildren)
        : undefined;

      mappedProps.titleAttributes = newChildProps;

      break;
    }

    case TAG_NAMES.BODY:
      mappedProps.bodyAttributes = newChildProps;
      break;

    case TAG_NAMES.HTML:
      mappedProps.htmlAttributes = newChildProps;
      break;

    default: {
      // eslint-disable-next-line no-lone-blocks
      if (typeof child.type === 'string') {
        (mappedProps as Record<string, unknown>)[child.type] = newChildProps;
      }

      break;
    }
  }

  return mappedProps;
}

function mapChildrenToProps(componentProps: Readonly<HeadComponentProps>): HeadProps {
  const arrayTypeChildren: Record<string, unknown[]> = {};

  const { children, ...mappedProps } = componentProps;

  Children.forEach(children as ReactElement<PropsWithChildren>[], child => {
    if (!isValidElement(child)) {
      return;
    }

    // isFragment incorrectly narrows to ReactElement.
    // A child can still be a ReactElement if it's not a fragment.
    if (isFragment(child) as boolean) {
      Object.assign(
        mappedProps,
        mapChildrenToProps({
          ...mappedProps,
          children: child.props.children,
        })
      );
    } else {
      invariant(
        VALID_TAG_NAMES.some(name => child.type === name),
        typeof child.type === 'function'
          ? `You may be attempting to nest <Head> components within each other, which is not allowed. Refer to our API for more information.`
          : `Only elements types ${VALID_TAG_NAMES.join(
              ', '
            )} are allowed. Head does not support rendering <${
              child.type
            }> elements. Refer to our API for more information.`
      );

      invariant(
        !child.props.children ||
          typeof child.props.children === 'string' ||
          (Array.isArray(child.props.children) &&
            !child.props.children.some(nestedChild => typeof nestedChild !== 'string')),
        `Head expects a string as a child of <${child.type}>. Did you forget to wrap your children in braces? ( <${child.type}>{\`\`}</${child.type}> ) Refer to our API for more information.`
      );

      switch (child.type) {
        case TAG_NAMES.BASE:
        case TAG_NAMES.LINK:
        case TAG_NAMES.META:
        case TAG_NAMES.NOSCRIPT:
        case TAG_NAMES.SCRIPT:
        case TAG_NAMES.STYLE:
          flattenArrayTypeChildren(arrayTypeChildren, child);
          break;

        default:
          mapObjectTypeChildren(mappedProps, child);
          break;
      }
    }
  });

  for (const [arrayChildName, arrayChild] of Object.entries(arrayTypeChildren)) {
    (mappedProps as Record<string, unknown[]>)[arrayChildName] = arrayChild;
  }

  return mappedProps;
}

const assertContext = (context: ContextType<typeof HeadContext>) => {
  invariant(context, 'Missing HeadProvider');
  return context;
};

export class Head extends Component<HeadComponentProps> {
  static override contextType = HeadContext;

  // @ts-expect-error
  override context!: ContextType<typeof HeadContext>;

  rendered: boolean = false;

  override shouldComponentUpdate(nextProps: HeadComponentProps) {
    return !fastCompare(this.props, nextProps);
  }

  override componentDidUpdate() {
    const mappedProps = mapChildrenToProps(this.props);
    assertContext(this.context).update(this, mappedProps);
  }

  override componentWillUnmount() {
    assertContext(this.context).remove(this);
  }

  override render() {
    if (!this.rendered) {
      this.rendered = true;

      const mappedProps = mapChildrenToProps(this.props);
      assertContext(this.context).update(this, mappedProps);
    }

    return null;
  }
}
