import { nextTick } from 'node:process';
import { promisify } from 'node:util';
import { Head } from '../src/Head';
import { HeadClientCache } from '../src/client/client-cache';
import { TRACKING_ATTRIBUTE } from '../src/constants';
import { getInjectedElementsByTagName, renderClient } from './utils';

const nextTickPromise = promisify(nextTick);

describe('client', () => {
  beforeEach(() => {});

  it('does not write the DOM if the client and server are identical', () => {
    const cache = new HeadClientCache({ sync: true });

    const initialHead = `<script ${TRACKING_ATTRIBUTE}="true" src="http://localhost/test.js" type="text/javascript"></script>`;

    document.head.innerHTML = initialHead;

    renderClient(
      <Head>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Head>,
      cache
    );

    expect(document.head.innerHTML).toBe(initialHead);
  });

  it('should batch updates to the DOM', async () => {
    jest.useFakeTimers();

    const mutations = jest.fn();

    const observer = new MutationObserver(mutations);
    observer.observe(document.head, { childList: true });

    const cache = new HeadClientCache();

    renderClient(
      <Head>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Head>,
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
