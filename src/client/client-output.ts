import { HelmetTags } from '../Helmet';
import { HELMET_ATTRIBUTE, TAG_NAMES, TAG_PROPERTIES, getHtmlAttributeName } from '../constants';
import { flattenArray } from '../utils';
import { HelmetState } from '../state';

const updateTagsByType = <T extends keyof HTMLElementTagNameMap>(type: T, tags: any[]) => {
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

      for (const attribute of Object.keys(tag)) {
        if (attribute === TAG_PROPERTIES.CHILDREN) {
          if (type === TAG_NAMES.SCRIPT || type === TAG_NAMES.NOSCRIPT) {
            newElement.innerHTML = tag.children;
          } else if (type === TAG_NAMES.STYLE) {
            (newElement as HTMLStyleElement).appendChild(document.createTextNode(tag.children));
          }
        } else {
          const value = typeof tag[attribute] === 'undefined' ? '' : tag[attribute];
          newElement.setAttribute(getHtmlAttributeName(attribute), value);
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
  attributes: NonNullable<HelmetState['bodyAttributes' | 'htmlAttributes' | 'titleAttributes']>
) => {
  const elementTag = document.getElementsByTagName(tagName)[0];

  if (!elementTag) {
    return;
  }

  const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
  const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(',') : [];

  const attributesToRemove = [...helmetAttributes].map(getHtmlAttributeName);

  for (const [key, value = ''] of Object.entries(attributes)) {
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

  const attributeKeyHash = Object.keys(attributes).map(getHtmlAttributeName).join(',');
  if (helmetAttributes.length === attributesToRemove.length) {
    elementTag.removeAttribute(HELMET_ATTRIBUTE);
  } else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeyHash) {
    elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeyHash);
  }
};

const updateTitle = (title: HelmetState['title'], attributes: any) => {
  if (typeof title !== 'undefined' && document.title !== title) {
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
    onChangeClientState,
    script,
    style,
    title,
    titleAttributes,
  } = newState;
  updateAttributes(TAG_NAMES.BODY, bodyAttributes);
  updateAttributes(TAG_NAMES.HTML, htmlAttributes);

  updateTitle(title, titleAttributes);

  const tagUpdates = {
    baseTag: updateTagsByType(TAG_NAMES.BASE, base),
    linkTags: updateTagsByType(TAG_NAMES.LINK, link),
    metaTags: updateTagsByType(TAG_NAMES.META, meta),
    noscriptTags: updateTagsByType(TAG_NAMES.NOSCRIPT, noscript),
    scriptTags: updateTagsByType(TAG_NAMES.SCRIPT, script),
    styleTags: updateTagsByType(TAG_NAMES.STYLE, style),
  };

  const addedTags = {} as Record<keyof HelmetTags, HTMLElement[]>;
  const removedTags = {} as Record<keyof HelmetTags, HTMLElement[]>;

  (Object.keys(tagUpdates) as (keyof typeof tagUpdates)[]).forEach(tagType => {
    const { newTags, oldTags } = tagUpdates[tagType];

    if (newTags.length) {
      addedTags[tagType] = newTags;
    }
    if (oldTags.length) {
      removedTags[tagType] = oldTags;
    }
  });

  if (cb) {
    cb();
  }

  onChangeClientState?.(newState, addedTags as HelmetTags, removedTags as HelmetTags);
};

// eslint-disable-next-line
let _helmetCallback: number | null = null;

export const handleStateChangeOnClient = (newState: HelmetState): void => {
  if (_helmetCallback) {
    cancelAnimationFrame(_helmetCallback);
  }

  if (newState.defer) {
    _helmetCallback = requestAnimationFrame(() => {
      commitTagChanges(newState, () => {
        _helmetCallback = null;
      });
    });
  } else {
    commitTagChanges(newState);
    _helmetCallback = null;
  }
};
