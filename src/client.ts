import { HELMET_ATTRIBUTE, TAG_NAMES, TAG_PROPERTIES } from './constants';
import { ReducedState, flattenArray } from './utils';

const updateTags = <
  T extends Omit<typeof TAG_NAMES, 'FRAGMENT'>[keyof Omit<typeof TAG_NAMES, 'FRAGMENT'>],
>(
  type: T,
  tags: ReducedState[
    | 'baseTag'
    | 'linkTags'
    | 'metaTags'
    | 'noscriptTags'
    | 'scriptTags'
    | 'styleTags']
) => {
  type Tag = (typeof tags)[number];

  const headElement = document.head || document.querySelector(TAG_NAMES.HEAD);
  const tagNodes = headElement.querySelectorAll<HTMLElementTagNameMap[T]>(
    `${type}[${HELMET_ATTRIBUTE}]`
  );
  const oldTags: HTMLElementTagNameMap[T][] = [].slice.call(tagNodes);
  const newTags: HTMLElementTagNameMap[T][] = [];
  let indexToDelete: number;

  if (tags && tags.length) {
    tags.forEach((tag: Tag) => {
      const newElement = document.createElement<T>(type);

      // eslint-disable-next-line
      for (const attribute in tag) {
        if (Object.prototype.hasOwnProperty.call(tag, attribute)) {
          if (attribute === TAG_PROPERTIES.INNER_HTML) {
            newElement.innerHTML = tag.innerHTML;
          } else if (attribute === TAG_PROPERTIES.CSS_TEXT) {
            if (newElement.styleSheet) {
              newElement.styleSheet.cssText = tag.cssText;
            } else {
              newElement.appendChild(document.createTextNode(tag.cssText));
            }
          } else {
            const value = typeof tag[attribute] === 'undefined' ? '' : tag[attribute];
            newElement.setAttribute(attribute, value);
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

  oldTags.forEach(tag => tag.parentNode.removeChild(tag));
  newTags.forEach(tag => headElement.appendChild(tag));

  return {
    oldTags,
    newTags,
  };
};

const updateAttributes = <T extends keyof ReducedState>(
  tagName: (typeof TAG_NAMES)[keyof typeof TAG_NAMES],
  attributes: ReducedState[T]
): void => {
  const elementTag = document.getElementsByTagName(tagName)[0];

  if (!elementTag) {
    return;
  }

  const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
  const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(',') : [];
  const attributesToRemove = [].concat(helmetAttributes);
  const attributeKeys = Object.keys(attributes);

  for (let i = 0; i < attributeKeys.length; i += 1) {
    const attribute = attributeKeys[i];
    const value = attributes[attribute] || '';

    if (elementTag.getAttribute(attribute) !== value) {
      elementTag.setAttribute(attribute, value);
    }

    if (helmetAttributes.indexOf(attribute) === -1) {
      helmetAttributes.push(attribute);
    }

    const indexToSave = attributesToRemove.indexOf(attribute);
    if (indexToSave !== -1) {
      attributesToRemove.splice(indexToSave, 1);
    }
  }

  for (let i = attributesToRemove.length - 1; i >= 0; i -= 1) {
    elementTag.removeAttribute(attributesToRemove[i]);
  }

  if (helmetAttributes.length === attributesToRemove.length) {
    elementTag.removeAttribute(HELMET_ATTRIBUTE);
  } else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeys.join(',')) {
    elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeys.join(','));
  }
};

const updateTitle = (title: string, attributes: ReducedState['titleAttributes']) => {
  if (typeof title !== 'undefined' && document.title !== title) {
    document.title = flattenArray(title);
  }

  updateAttributes(TAG_NAMES.TITLE, attributes);
};

const commitTagChanges = (newState: ReducedState, cb?: () => void) => {
  const {
    baseTag,
    bodyAttributes,
    htmlAttributes,
    linkTags,
    metaTags,
    noscriptTags,
    onChangeClientState,
    scriptTags,
    styleTags,
    title,
    titleAttributes,
  } = newState;
  updateAttributes(TAG_NAMES.BODY, bodyAttributes);
  updateAttributes(TAG_NAMES.HTML, htmlAttributes);

  updateTitle(title, titleAttributes);

  const tagUpdates = {
    baseTag: updateTags(TAG_NAMES.BASE, baseTag),
    linkTags: updateTags(TAG_NAMES.LINK, linkTags),
    metaTags: updateTags(TAG_NAMES.META, metaTags),
    noscriptTags: updateTags(TAG_NAMES.NOSCRIPT, noscriptTags),
    scriptTags: updateTags(TAG_NAMES.SCRIPT, scriptTags),
    styleTags: updateTags(TAG_NAMES.STYLE, styleTags),
  };

  const addedTags = {};
  const removedTags = {};

  Object.keys(tagUpdates).forEach(tagType => {
    const { newTags, oldTags } = tagUpdates[tagType];

    if (newTags.length) {
      addedTags[tagType] = newTags;
    }
    if (oldTags.length) {
      removedTags[tagType] = tagUpdates[tagType].oldTags;
    }
  });

  if (cb) {
    cb();
  }

  onChangeClientState(newState, addedTags, removedTags);
};

// eslint-disable-next-line
let _helmetCallback = null;

const handleStateChangeOnClient = (newState: ReducedState) => {
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

export default handleStateChangeOnClient;
