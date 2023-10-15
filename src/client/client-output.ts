import { TRACKING_ATTRIBUTE, TAG_NAMES, TAG_PROPERTIES, getHtmlAttributeName } from '../constants';
import { HeadState } from '../state';

const updateTagsByType = <T extends keyof HTMLElementTagNameMap>(type: T, tags: object[]) => {
  const headElement = document.head;
  const tagNodes = headElement.querySelectorAll<HTMLElementTagNameMap[T]>(
    `${type}[${TRACKING_ATTRIBUTE}]`
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

      newElement.setAttribute(TRACKING_ATTRIBUTE, 'true');

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
  attributes: HeadState['bodyAttributes' | 'htmlAttributes' | 'titleAttributes']
) => {
  const elementTag = document.getElementsByTagName(tagName)[0];

  if (!elementTag) {
    return;
  }

  const headAttributeString = elementTag.getAttribute(TRACKING_ATTRIBUTE);
  const headAttributes = headAttributeString ? headAttributeString.split(',') : [];

  const attributesToRemove = [...headAttributes].map(getHtmlAttributeName);

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) {
      continue;
    }

    const htmlAttribute = getHtmlAttributeName(key);

    if (elementTag.getAttribute(htmlAttribute) !== value) {
      elementTag.setAttribute(htmlAttribute, String(value));
    }

    if (headAttributes.indexOf(htmlAttribute) === -1) {
      headAttributes.push(htmlAttribute);
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

  if (headAttributes.length === attributesToRemove.length) {
    elementTag.removeAttribute(TRACKING_ATTRIBUTE);
  } else if (elementTag.getAttribute(TRACKING_ATTRIBUTE) !== attributeKeyHash) {
    elementTag.setAttribute(TRACKING_ATTRIBUTE, attributeKeyHash);
  }
};

const updateTitle = (title: HeadState['title'], attributes: HeadState['titleAttributes']) => {
  title ??= '';
  title = Array.isArray(title) ? title.join('') : title;

  if (document.title !== title) {
    document.title = title;
  }

  updateAttributes(TAG_NAMES.TITLE, attributes);
};

const commitTagChanges = (newState: HeadState, cb?: () => void) => {
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

let handle: NodeJS.Timeout;

export const handleStateChange = (state: HeadState, sync: boolean): void => {
  if (handle) {
    clearTimeout(handle);
  }

  if (sync) {
    commitTagChanges(state);
  } else {
    // Batched updates
    // https://github.com/nuxt/vue-meta/issues/313
    handle = setTimeout(() => {
      commitTagChanges(state);
    }, 10);
  }
};
