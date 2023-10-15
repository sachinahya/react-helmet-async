import { ReactNode, StrictMode, ReactElement, cloneElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from 'react-dom';
import { HelmetProvider } from '../src/Provider';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { HelmetClientCache } from '../src/client/client-cache';
import { HelmetServerCache } from '../src/server/server-cache';

export const renderClient = (node: ReactNode, cache: HelmetClientCache) => {
  const mount = document.getElementById('mount');

  render(
    <StrictMode>
      <HelmetProvider state={cache}>{node}</HelmetProvider>
    </StrictMode>,
    mount
  );
};

export const renderServer = (node: ReactNode, cache: HelmetServerCache): void => {
  renderToStaticMarkup(
    <StrictMode>
      <HelmetProvider state={cache}>{node}</HelmetProvider>
    </StrictMode>
  );
};

export const renderResult = (elements: ReactElement | ReactElement[]): string => {
  return renderToStaticMarkup(
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {Array.isArray(elements)
        ? elements.map((element, i) =>
            cloneElement(element, {
              // eslint-disable-next-line react/no-array-index-key
              key: i,
            })
          )
        : elements}
    </>
  );
};

export function getInjectedElementsByTagName<T extends keyof HTMLElementTagNameMap>(
  tag: T
): NodeListOf<HTMLElementTagNameMap[T]>;
export function getInjectedElementsByTagName(tag: string): NodeListOf<Element>;
export function getInjectedElementsByTagName<T extends keyof HTMLElementTagNameMap>(
  tag: T
): NodeListOf<HTMLElementTagNameMap[T]> {
  return document.head.querySelectorAll<HTMLElementTagNameMap[T]>(`${tag}[${HELMET_ATTRIBUTE}]`);
}
