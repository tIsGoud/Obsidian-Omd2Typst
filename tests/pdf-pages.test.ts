import { collectPdfEmbeds, countPdfPages, formatPdfPages, hasPdfEmbeds } from '../src/pdf-pages';
import { typstSupportsPdfImages } from '../src/typst-version';
import { loadPdfJs } from 'obsidian';

describe('collectPdfEmbeds / hasPdfEmbeds', () => {
  it('finds PDFs embedded without a page selection', () => {
    const md = '![](</A/one.pdf>)\n\n![x|300](</B/two.pdf#height=400>)\n\n![](</A/one.pdf>)\n';
    expect(collectPdfEmbeds(md)).toEqual(['/A/one.pdf', '/B/two.pdf']);
  });

  it('needs a count unless the pages are a closed range or a list', () => {
    const md = '![](</A/a.pdf#page=3>)\n![](</A/b.pdf#page=2-4>)\n![](</A/c.pdf#page=3-3>)\n![](</A/d.pdf#page=3,5, 7>)\n![](</A/e.pdf#page=2-3,7>)\n![](</A/f.pdf#height=400>)\n';
    expect(collectPdfEmbeds(md)).toEqual(['/A/a.pdf', '/A/f.pdf']);
  });

  it('skips PDFs with #page=, images, code, and non-absolute references', () => {
    const md = '![](</A/p.pdf#page=2-2>)\n![](</A/p.pdf#height=1&page=2-3>)\n![](</A/pic.png>)\n`![](</A/c.pdf>)`\n\n```\n![](</A/f.pdf>)\n```\n\n![](<rel.pdf>)\n';
    expect(collectPdfEmbeds(md)).toEqual([]);
    expect(hasPdfEmbeds(md)).toBe(true); // the #page= ones still count as PDF embeds
    expect(hasPdfEmbeds('![](</A/pic.png>)\n')).toBe(false);
  });
});

describe('countPdfPages', () => {
  const app = (read: jest.Mock) => ({ vault: { adapter: { readBinary: read } } } as any);

  afterEach(() => { (loadPdfJs as jest.Mock).mockReset().mockResolvedValue(undefined); });

  it('counts the pages with Obsidian’s pdf.js and skips unreadable files', async () => {
    const destroy = jest.fn();
    (loadPdfJs as jest.Mock).mockResolvedValue({
      getDocument: ({ data }: { data: Uint8Array }) => ({
        promise: data.length === 1 ? Promise.reject(new Error('bad pdf')) : Promise.resolve({ numPages: data.length, destroy }),
      }),
    });
    const read = jest.fn(async (p: string) => (p === 'A/bad.pdf' ? new Uint8Array(1).buffer : new Uint8Array(p === 'A/one.pdf' ? 12 : 3).buffer));
    const counts = await countPdfPages(app(read), ['/A/one.pdf', '/A/bad.pdf', '/B/two.pdf']);
    expect(counts).toEqual({ '/A/one.pdf': 12, '/B/two.pdf': 3 });
    expect(read).toHaveBeenCalledWith('A/one.pdf');
    expect(destroy).toHaveBeenCalledTimes(2);
  });

  it('returns nothing when there is no PDF or pdf.js cannot be loaded', async () => {
    expect(await countPdfPages(app(jest.fn()), [])).toEqual({});
    (loadPdfJs as jest.Mock).mockRejectedValue(new Error('no pdf.js'));
    expect(await countPdfPages(app(jest.fn()), ['/A/one.pdf'])).toEqual({});
  });
});

describe('formatPdfPages', () => {
  it('writes one tab-separated line per PDF', () => {
    expect(formatPdfPages({ '/A/one.pdf': 12, '/B/two words.pdf': 3 })).toBe('12\t/A/one.pdf\n3\t/B/two words.pdf');
    expect(formatPdfPages({})).toBe('');
  });
});

describe('typstSupportsPdfImages', () => {
  it('is true from Typst 0.14', () => {
    expect(typstSupportsPdfImages('0.15.1')).toBe(true);
    expect(typstSupportsPdfImages('0.14.0')).toBe(true);
    expect(typstSupportsPdfImages('0.13.1')).toBe(false);
    expect(typstSupportsPdfImages('1.0.0')).toBe(true);
    expect(typstSupportsPdfImages('')).toBe(false);
  });
});
