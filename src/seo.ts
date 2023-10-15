import { SEO_PRIORITY_TAGS, SeoPriority } from './constants';
import { HeadState, TagState } from './state';

export type SeoPriorityOptions = 'meta' | 'link' | 'script';

export type PriorityTags = Pick<TagState, 'meta' | 'link' | 'script'>;

export interface PrioritisedHeadState extends HeadState {
  priority?: PriorityTags;
}

const checkIfPropsMatch = (props: HeadState[SeoPriorityOptions][number], toMatch: SeoPriority) => {
  for (const [key, value] of Object.entries(props)) {
    // e.g. if rel exists in the list of allowed props [amphtml, alternate, etc]
    if (toMatch[key]?.includes(value)) {
      return true;
    }
  }

  return false;
};

const prioritise = <T extends HeadState[SeoPriorityOptions][number]>(
  elementsList: T[],
  propsToMatch: SeoPriority
): { priority: T[]; default: T[] } => {
  const priority: T[] = [];
  const nonPriority: T[] = [];

  for (const attributes of elementsList) {
    if (checkIfPropsMatch(attributes, propsToMatch)) {
      priority.push(attributes);
    } else {
      nonPriority.push(attributes);
    }
  }

  return {
    priority,
    default: nonPriority,
  };
};

export const prioritiseState = (state: HeadState): PrioritisedHeadState => {
  const metaP = prioritise(state.meta, SEO_PRIORITY_TAGS.meta);
  const linkP = prioritise(state.link, SEO_PRIORITY_TAGS.link);
  const scriptP = prioritise(state.script, SEO_PRIORITY_TAGS.script);

  return {
    ...state,
    meta: metaP.default,
    link: linkP.default,
    script: scriptP.default,
    priority: {
      meta: metaP.priority,
      link: linkP.priority,
      script: scriptP.priority,
    },
  };
};
