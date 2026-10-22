import { describe, it, expect } from 'vitest';
import { languageColor, hasKnownColor, significantLanguages } from '../utils/languages';

describe('languageColor', () => {
  it('uses the GitHub Linguist colour for known languages', () => {
    expect(languageColor('TypeScript')).toBe('#3178c6');
    expect(languageColor('Kotlin')).toBe('#A97BFF');
    // Added when the portfolio gained a Flutter project; without it Dart fell
    // through to the generic fallback and rendered as an unrecognised colour.
    expect(languageColor('Dart')).toBe('#00B4AB');
  });

  it('assigns a colour to every language the portfolio actually reports', () => {
    // Taken from the aggregated GitHub language data, so a new project in a
    // new language fails here rather than silently drawing a random colour.
    for (const language of [
      'C#', 'CSS', 'Dart', 'Dockerfile', 'Go', 'HTML', 'Java',
      'JavaScript', 'Kotlin', 'Lua', 'Python', 'Rust', 'Swift', 'TypeScript',
    ]) {
      expect(hasKnownColor(language), `${language} has no assigned colour`).toBe(true);
    }
  });

  it('falls back to a deterministic hex for unknown languages', () => {
    const first = languageColor('Zig');
    expect(first).toMatch(/^#[0-9a-f]{6}$/);
    expect(languageColor('Zig')).toBe(first);
    expect(languageColor('Elixir')).not.toBe(first);
  });

  it('returns hex so callers can append an alpha suffix', () => {
    // TechTimeline builds `languageColor(lang) + "cc"`; an hsl() string there
    // would produce an invalid colour and silently drop the bubble fill.
    expect(languageColor('Zig') + 'cc').toMatch(/^#[0-9a-f]{8}$/);
    expect(languageColor('Dart') + 'cc').toMatch(/^#[0-9a-fA-F]{8}$/);
  });
});

describe('significantLanguages', () => {
  it('keeps languages with at least 10% of the bytes, largest first', () => {
    // k2l: a Kotlin compiler with a Lua runtime and a little shell.
    expect(significantLanguages({ Kotlin: 1980, Lua: 307, Shell: 5 }, 'Kotlin')).toEqual([
      { language: 'Kotlin', share: 1980 / 2292 },
      { language: 'Lua', share: 307 / 2292 },
    ]);
  });

  it('counts a language at exactly 10%', () => {
    expect(significantLanguages({ Go: 90, HTML: 10 }, 'Go').map((l) => l.language))
      .toEqual(['Go', 'HTML']);
  });

  it('falls back to the primary language without byte data', () => {
    expect(significantLanguages(undefined, 'Java')).toEqual([{ language: 'Java', share: 1 }]);
    expect(significantLanguages({}, null)).toEqual([]);
  });
});
