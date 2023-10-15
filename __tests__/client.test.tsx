import { Helmet } from '../src';
import { HelmetClientCache } from '../src/client/client-cache';
import { HELMET_ATTRIBUTE } from '../src/constants';
import { renderClient } from './utils';

describe('client', () => {
  let clientCache: HelmetClientCache;

  beforeEach(() => {
    clientCache = new HelmetClientCache({ sync: true });
  });

  it('does not write the DOM if the client and server are identical', () => {
    const initialHead = `<script ${HELMET_ATTRIBUTE}="true" src="http://localhost/test.js" type="text/javascript"></script>`;

    document.head.innerHTML = initialHead;

    renderClient(
      <Helmet>
        <script src="http://localhost/test.js" type="text/javascript" />
      </Helmet>,
      clientCache
    );

    expect(document.head.innerHTML).toBe(initialHead);
  });
});
