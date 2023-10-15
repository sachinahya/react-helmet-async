import { HELMET_ATTRIBUTE, TAG_NAMES, TAG_PROPERTIES, getHtmlAttributeName } from '../constants';
import { flattenArray } from '../utils';
import { HelmetState } from '../state';

const updateTagsByType = <T extends keyof HTMLElementTagNameMap>(type: T, tags: object[]) => {
  const headElement = document.head;
  const tagNodes = headElement.querySelectorAll<HTMLElementTagNameMap[T]>(
    `${type}[${HELMET_ATTRIBUTE}]`
  );
  const oldTags = [...tagNodes];
  const newTags: HTMLElement[] = [];
  let indexToDelete: number;

  if (tags && tags.length) {
    tags.forEach(tag => {
      const newElement = document.createElement(type);

      for (const [attribute, value] of Object.entries(tag)) {
        if (attribute === TAG_PROPERTIES.CHILDREN) {
          if (type === TAG_NAMES.SCRIPT || type === TAG_NAMES.NOSCRIPT) {
            newElement.innerHTML = tag.children;
          } else if (type === TAG_NAMES.STYLE) {
            (newElement as HTMLStyleElement).appendChild(document.createTextNode(tag.children));
          }
        } else {
          const htmlAttributeName = getHtmlAttributeName(attribute);

          if (value === undefined) {
            newElement.removeAttribute(htmlAttributeName);
          } else {
            newElement.setAttribute(htmlAttributeName, String(value));
          }
        }
      }

      newElement.setAttribute(HELMET_ATTRIBUTE, 'true');

      // Remove a duplicate tag from domTagstoRemove, so it isn't cleared.
      if (
        oldTags.some((existingTag, index) => {
          indexToDelete = index;
          return newElement.isEqualNode(existingTag);
        })
      ) {
        oldTags.splice(indexToDelete, 1);
      } else {
        newTags.push(newElement);
      }
    });
  }

  oldTags.forEach(tag => tag.parentNode?.removeChild(tag));
  newTags.forEach(tag => headElement.appendChild(tag));

  return {
    oldTags,
    newTags,
  };
};

const updateAttributes = (
  tagName: string,
  attributes: HelmetState['bodyAttributes' | 'htmlAttributes' | 'titleAttributes']
) => {
  const elementTag = document.getElementsByTagName(tagName)[0];

  if (!elementTag) {
    return;
  }

  const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
  const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(',') : [];

  const attributesToRemove = [...helmetAttributes].map(getHtmlAttributeName);

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) {
      continue;
    }

    const htmlAttribute = getHtmlAttributeName(key);

    if (elementTag.getAttribute(htmlAttribute) !== value) {
      elementTag.setAttribute(htmlAttribute, String(value));
    }

    if (helmetAttributes.indexOf(htmlAttribute) === -1) {
      helmetAttributes.push(htmlAttribute);
    }

    const indexToSave = attributesToRemove.indexOf(htmlAttribute);
    if (indexToSave !== -1) {
      attributesToRemove.splice(indexToSave, 1);
    }
  }

  for (const attribute of [...attributesToRemove.reverse()]) {
    elementTag.removeAttribute(attribute);
  }

  const attributeKeyHash = Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([attribute]) => getHtmlAttributeName(attribute))
    .join(',');

  if (helmetAttributes.length === attributesToRemove.length) {
    elementTag.removeAttribute(HELMET_ATTRIBUTE);
  } else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeyHash) {
    elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeyHash);
  }
};

const updateTitle = (title: HelmetState['title'], attributes: HelmetState['titleAttributes']) => {
  title ??= '';

  if (document.title !== title) {
    document.title = flattenArray(title);
  }

  updateAttributes(TAG_NAMES.TITLE, attributes);
};

const commitTagChanges = (newState: HelmetState, cb?: () => void) => {
  const {
    base,
    bodyAttributes,
    htmlAttributes,
    link,
    meta,
    noscript,
    script,
    style,
    title,
    titleAttributes,
  } = newState;
  updateAttributes(TAG_NAMES.BODY, bodyAttributes);
  updateAttributes(TAG_NAMES.HTML, htmlAttributes);

  updateTitle(title, titleAttributes);

  updateTagsByType(TAG_NAMES.BASE, base);
  updateTagsByType(TAG_NAMES.LINK, link);
  updateTagsByType(TAG_NAMES.META, meta);
  updateTagsByType(TAG_NAMES.NOSCRIPT, noscript);
  updateTagsByType(TAG_NAMES.SCRIPT, script);
  updateTagsByType(TAG_NAMES.STYLE, style);

  cb?.();
};

let handle: number;

export const handleStateChangeOnClient = (newState: HelmetState, sync: boolean): void => {
  if (handle) {
    cancelAnimationFrame(handle);
  }

  if (sync) {
    commitTagChanges(newState);
  } else {
    handle = requestAnimationFrame(() => {
      commitTagChanges(newState, () => {
        handle = 0;
      });
    });
  }
};
