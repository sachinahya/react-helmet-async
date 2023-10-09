import { SeoPriority } from './constants';
import { HelmetState } from './state';

export type SeoPriorityOptions = 'meta' | 'link' | 'script';

const checkIfPropsMatch = (
  props: HelmetState[SeoPriorityOptions][number],
  toMatch: SeoPriority
) => {
  for (const [key, value] of Object.entries(props)) {
    // e.g. if rel exists in the list of allowed props [amphtml, alternate, etc]
    if (toMatch[key]?.includes(value)) {
      return true;
    }
  }

  return false;
};

export const prioritizer = <T extends HelmetState[SeoPriorityOptions][number]>(
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
