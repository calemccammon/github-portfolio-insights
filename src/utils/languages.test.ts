import { describe, it, expect } from 'vitest';
import { languageColor, hasKnownColor } from '../utils/languages';

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
      'JavaScript', 'Kotlin', 'Python', 'Rust', 'Swift', 'TypeScript',
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
