/**
 * Other names people search a cuisine's country by, keyed by cuisine slug. They are added to the search text on top
 * of the cuisine's own name and country in both languages (data/cuisines.seed.ts, data/cuisines.ja.ts), so only
 * names those don't already contain belong here: "Korea" is inside "South Korea", but "Nepalese" isn't in "Nepal".
 */
const ALIASES: Record<string, string[]> = {
  japanese: ["Nihon", "Nippon", "日本料理"],
  korean: ["朝鮮"],
  nepali: ["Nepalese", "Himalaya", "ヒマラヤ"],
  "middle-eastern": [
    "Middle East",
    "Lebanon",
    "Lebanese",
    "Syria",
    "Syrian",
    "Palestine",
    "Palestinian",
    "Israel",
    "Israeli",
    "Jordan",
    "Jordanian",
    "Levantine",
    "レバノン",
    "シリア",
    "パレスチナ",
    "イスラエル",
    "ヨルダン",
    "中東",
  ],
  chinese: ["中華"],
};

type CuisinePlace = { slug: string; name: string; country: string; ja: { name: string; country: string } };

/** Everything a cuisine can be found by: its name, its country and their aliases, in English and Japanese. */
export function placeWords(cuisine: CuisinePlace | undefined) {
  if (!cuisine) return [];
  return [cuisine.name, cuisine.country, cuisine.ja.name, cuisine.ja.country, ...(ALIASES[cuisine.slug] ?? [])];
}
