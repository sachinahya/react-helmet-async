import { Helmet } from '../src/Helmet';
import { HelmetServerCache } from '../src/server/server-cache';
import { renderServer } from './utils';

describe('SEO prioritisation', () => {
  it('prioritizes SEO tags when asked to', () => {
    const cache = new HelmetServerCache({ prioritiseSeoTags: true });

    renderServer(
      <Helmet>
        <link rel="notImportant" href="https://www.chipotle.com" />
        <link rel="canonical" href="https://www.tacobell.com" />
        <meta property="og:title" content="A very important title" />
      </Helmet>,
      cache
    );

    const head = cache.getOutput();

    expect(head.priority.toString()).toContain('rel="canonical" href="https://www.tacobell.com"');
    expect(head.priority.toString()).toContain(
      'property="og:title" content="A very important title"'
    );

    expect(head.link.toString()).toBe(
      '<link data-rh="true" rel="notImportant" href="https://www.chipotle.com"/>'
    );
    expect(head.meta.toString()).toBe('');
  });

  it('does not prioritize SEO unless asked to', () => {
    const cache = new HelmetServerCache();

    renderServer(
      <Helmet>
        <link rel="notImportant" href="https://www.chipotle.com" />
        <link rel="canonical" href="https://www.tacobell.com" />
        <meta property="og:title" content="A very important title" />
      </Helmet>,
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
