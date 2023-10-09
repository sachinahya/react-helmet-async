export function flattenArray(possibleArray: string): string;
export function flattenArray(possibleArray: string | undefined): string | undefined;
export function flattenArray(possibleArray: string[]): string;
export function flattenArray(possibleArray: string[] | undefined): string | undefined;
export function flattenArray(possibleArray: string | string[]): string;
export function flattenArray(possibleArray: string | string[] | undefined): string | undefined;
export function flattenArray(possibleArray: string | string[] | undefined): string | undefined {
  return Array.isArray(possibleArray) ? possibleArray.join('') : possibleArray;
}
