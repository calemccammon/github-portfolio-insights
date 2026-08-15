/**
 * Language colours, following GitHub Linguist so the charts match what GitHub
 * itself shows on each repo.
 *
 * This lives in one place because it was previously duplicated across
 * LanguageChart and TechTimeline, and the two copies had already drifted --
 * SQL, C# and Swift existed in one and not the other, so the same language
 * could be drawn in two different colours depending on the chart.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Kotlin: "#A97BFF",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Dart: "#00B4AB",
  Lua: "#000080",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  SQL: "#e38c00",
  "C#": "#178600",
  Swift: "#F05138",
  Dockerfile: "#384d54",
};

/**
 * Deterministic fallback for a language with no assigned colour.
 *
 * Returns hex rather than `hsl()` so callers can append an alpha suffix --
 * TechTimeline does exactly that, and an `hsl(...)cc` string is not a valid
 * colour.
 */
function fallbackColor(language: string): string {
  let hash = 0;
  for (let i = 0; i < language.length; i += 1) {
    hash = (hash * 31 + language.charCodeAt(i)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 0.55;
  const lightness = 0.55;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = lightness - chroma / 2;

  const [r, g, b] = (
    hue < 60
      ? [chroma, secondary, 0]
      : hue < 120
        ? [secondary, chroma, 0]
        : hue < 180
          ? [0, chroma, secondary]
          : hue < 240
            ? [0, secondary, chroma]
            : hue < 300
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary]
  ).map((channel) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0")
  );

  return `#${r}${g}${b}`;
}

export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? fallbackColor(language);
}

export function hasKnownColor(language: string): boolean {
  return language in LANGUAGE_COLORS;
}
