import { parseEmbedOptions, markdownImage } from '../src/embed-options';

describe('parseEmbedOptions', () => {
  it('reads width and alt text in any order', () => {
    expect(parseEmbedOptions('200|alt text')).toEqual({ alt: 'alt text', width: '200' });
    expect(parseEmbedOptions('alt text|200')).toEqual({ alt: 'alt text', width: '200' });
  });

  it('takes the width of a WxH size and ignores the height', () => {
    expect(parseEmbedOptions('100x145|alt')).toEqual({ alt: 'alt', width: '100' });
  });

  it('handles width only, alt only and nothing', () => {
    expect(parseEmbedOptions('150')).toEqual({ alt: '', width: '150' });
    expect(parseEmbedOptions('just a label')).toEqual({ alt: 'just a label', width: '' });
    expect(parseEmbedOptions('')).toEqual({ alt: '', width: '' });
  });

  it('keeps a second number as alt text', () => {
    expect(parseEmbedOptions('200|300')).toEqual({ alt: '', width: '200' });
  });
});

describe('markdownImage', () => {
  it('builds the engine syntax', () => {
    expect(markdownImage('alt', '200', '/a b.png')).toBe('![alt|200](</a b.png>)');
    expect(markdownImage('', '', 'x.png')).toBe('![](<x.png>)');
    expect(markdownImage('alt', '', 'x.png')).toBe('![alt](<x.png>)');
  });
});
