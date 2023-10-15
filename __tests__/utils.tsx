import { ReactNode, StrictMode, ReactElement, cloneElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from 'react-dom';
import { HeadProvider } from '../src/HeadContext';
import { TRACKING_ATTRIBUTE } from '../src/constants';
import { HeadClientCache } from '../src/client/client-cache';
import { HeadServerCache } from '../src/server/server-cache';

export const renderClient = (node: ReactNode, cache: HeadClientCache) => {
  const mount = document.getElementById('mount');

  render(
    <StrictMode>
      <HeadProvider state={cache}>{node}</HeadProvider>
    </StrictMode>,
    mount
  );
};

export const renderServer = (node: ReactNode, cache: HeadServerCache): void => {
  renderToStaticMarkup(
    <StrictMode>
      <HeadProvider state={cache}>{node}</HeadProvider>
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
  return document.head.querySelectorAll<HTMLElementTagNameMap[T]>(`${tag}[${TRACKING_ATTRIBUTE}]`);
}
