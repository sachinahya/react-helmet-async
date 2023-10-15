import { Head } from '../src/Head';
import { HeadServerCache } from '../src/server/server-cache';
import { renderServer } from './utils';

describe('SEO prioritisation', () => {
  it('prioritizes SEO tags when asked to', () => {
    const cache = new HeadServerCache({ prioritiseSeoTags: true });

    renderServer(
      <Head>
        <link rel="notImportant" href="https://www.chipotle.com" />
        <link rel="canonical" href="https://www.tacobell.com" />
        <meta property="og:title" content="A very important title" />
      </Head>,
      cache
    );

    const head = cache.getOutput();

    expect(head.priority.toString()).toContain('rel="canonical" href="https://www.tacobell.com"');
    expect(head.priority.toString()).toContain(
      'property="og:title" content="A very important title"'
    );

    expect(head.link.toString()).toBe(
      '<link data-ht="true" rel="notImportant" href="https://www.chipotle.com"/>'
    );
    expect(head.meta.toString()).toBe('');
  });

  it('does not prioritize SEO unless asked to', () => {
    const cache = new HeadServerCache();

    renderServer(
      <Head>
        <link rel="notImportant" href="https://www.chipotle.com" />
        <link rel="canonical" href="https://www.tacobell.com" />
        <meta property="og:title" content="A very important title" />
      </Head>,
      cache
    );

    const head = cache.getOutput();

    expect(head.priority.toString()).not.toContain(
      'rel="canonical" href="https://www.tacobell.com"'
    );
    expect(head.link.toString()).toContain('rel="canonical" href="https://www.tacobell.com"');

    expect(head.priority.toString()).not.toContain(
      'property="og:title" content="A very important title"'
    );
    expect(head.meta.toString()).toContain('property="og:title" content="A very important title"');
  });
});
