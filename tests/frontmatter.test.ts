import {
  parseFrontmatter,
  mergeFrontmatter,
  buildFrontmatterBlock,
} from '../src/frontmatter';

describe('parseFrontmatter', () => {
  it('returns null when no frontmatter present', () => {
    expect(parseFrontmatter('# Hello\nNo frontmatter here.')).toBeNull();
  });

  it('parses keys from a frontmatter block', () => {
    const note = '---\ntitle: My Doc\nauthor: Alice\n---\n# Body';
    const result = parseFrontmatter(note);
    expect(result?.keys).toEqual(['title', 'author']);
  });

  it('handles frontmatter with empty values', () => {
    const note = '---\ntitle:\nauthor:\n---\n';
    const result = parseFrontmatter(note);
    expect(result?.keys).toEqual(['title', 'author']);
  });
});

describe('mergeFrontmatter', () => {
  it('prepends missing keys above existing frontmatter', () => {
    const note = '---\nauthor: Alice\n---\n# Body';
    const result = mergeFrontmatter(note, ['title', 'author', 'date']);
    expect(result).toBe('---\ntitle:\ndate:\nauthor: Alice\n---\n# Body');
  });

  it('does not duplicate keys already present', () => {
    const note = '---\ntitle: My Doc\n---\n# Body';
    const result = mergeFrontmatter(note, ['title', 'author']);
    const matches = result.match(/title/g)!;
    expect(matches).toHaveLength(1);
    expect(result).toContain('author:');
  });

  it('inserts full block when note has no frontmatter', () => {
    const note = '# Just a heading';
    const result = mergeFrontmatter(note, ['title', 'author']);
    expect(result).toBe('---\ntitle:\nauthor:\n---\n# Just a heading');
  });

  it('returns note unchanged when all template keys are already present', () => {
    const note = '---\ntitle: My Doc\nauthor: Alice\n---\n# Body';
    const result = mergeFrontmatter(note, ['title', 'author']);
    expect(result).toBe(note);
  });
});

describe('buildFrontmatterBlock', () => {
  it('converts YAML lines string to key array', () => {
    const yaml = 'title:\nauthor:\ndate:';
    expect(buildFrontmatterBlock(yaml)).toEqual(['title', 'author', 'date']);
  });

  it('ignores blank lines and comments', () => {
    const yaml = 'title:\n\n# a comment\nauthor:';
    expect(buildFrontmatterBlock(yaml)).toEqual(['title', 'author']);
  });
});
