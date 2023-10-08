import { Except } from 'type-fest';

export function flattenArray(possibleArray: string): string;
export function flattenArray(possibleArray: string | undefined): string | undefined;
export function flattenArray(possibleArray: string[]): string;
export function flattenArray(possibleArray: string[] | undefined): string | undefined;
export function flattenArray(possibleArray: string | string[] | undefined): string | undefined;
export function flattenArray(possibleArray: string | string[] | undefined): string | undefined {
  return Array.isArray(possibleArray) ? possibleArray.join('') : possibleArray;
}

export const without = <T, K extends keyof T>(obj: T, key: K): Except<T, K> => {
  return {
    ...obj,
    [key]: undefined,
  };
};
