import { nextTick } from 'node:process';
import { promisify } from 'node:util';
import { Helmet } from '../src/Helmet';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { getInjectedElementsByTagName, renderClient } from './utils';

const nextTickPromise = promisify(nextTick);

describe('client', () => {
  beforeEach(() => {});

  it('does not write the DOM if the client and server are identical', () => {
    const cache = new HelmetClientCache({ sync: true });

    const initialHead = `<script ${HELMET_ATTRIBUTE}="true" src="http://localhost/test.js" type="text/javascript"></script>`;

    document.head.innerHTML = initialHead;

    renderClient(
      <Helmet>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>,
      cache
    );

    expect(document.head.innerHTML).toBe(initialHead);
  });

  it('should batch updates to the DOM', async () => {
    jest.useFakeTimers();

    const mutations = jest.fn();

    const observer = new MutationObserver(mutations);
    observer.observe(document.head, { childList: true });

    const cache = new HelmetClientCache();

    renderClient(
      <Helmet>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>,
      cache
    );

    expect(getInjectedElementsByTagName('script')).toHaveLength(0);
    expect(mutations).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2);
    await nextTickPromise();

    expect(getInjectedElementsByTagName('script')).toHaveLength(0);
    expect(mutations).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    await nextTickPromise();

    expect(getInjectedElementsByTagName('script')).toHaveLength(1);
    expect(mutations).toHaveBeenCalledTimes(1);
  });
});
