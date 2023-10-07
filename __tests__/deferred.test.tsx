import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from '../src';
import Provider from '../src/Provider';

/* eslint-disable no-underscore-dangle */

describe.skip('deferred tags', () => {
  let headElement;

  const container = document.createElement('div');

  beforeEach(() => {
    headElement = headElement || document.head || document.querySelector('head');

    // resets DOM after each run
    headElement.innerHTML = '';
    window.__spy__ = jest.fn();
  });

  afterEach(() => {
    delete window.__spy__;
    ReactDOM.unmountComponentAtNode(container);
  });

  describe.skip('API', () => {
    beforeEach(() => {
      window.__spy__ = jest.fn();
    });

    afterEach(() => {
      delete window.__spy__;
    });

    it('executes synchronously when defer={true} and async otherwise', () => {
      ReactDOM.render(
        <Provider>
          <Helmet
            defer={false}
            script={[
              {
                innerHTML: `window.__spy__(1)`,
              },
            ]}
          />
          <Helmet
            script={[
              {
                innerHTML: `window.__spy__(2)`,
              },
            ]}
          />
        </Provider>,
        container
      );

      expect(window.__spy__.callCount).toBe(1);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          expect(window.__spy__.callCount).toBe(2);
          expect(window.__spy__.args).toDeepEqual([[1], [2]]);

          resolve();
        });
      });
    });
  });

  describe('Declarative API', () => {
    it('executes synchronously when defer={true} and async otherwise', () => {
      ReactDOM.render(
        <Provider>
          <Helmet defer={false}>
            <script>window.__spy__(1)</script>
          </Helmet>
          <Helmet>
            <script>window.__spy__(2)</script>
          </Helmet>
        </Provider>,
        container
      );

      expect(window.__spy__.callCount).toBe(1);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          expect(window.__spy__.callCount).toBe(2);
          expect(window.__spy__.args).toDeepEqual([[1], [2]]);

          resolve();
        });
      });
    });
  });
});
