import type { SeedCuisine } from "./types";

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

/** Order here is the display order of the "Explore by cuisine" grid. */
export const cuisinesSeed: SeedCuisine[] = [
  {
    slug: "japanese",
    name: "Japanese",
    country: "Japan",
    emoji: "🍣",
    intro:
      "Japanese cooking prizes seasonality and restraint: a few pristine ingredients, carefully cut, and a backbone of dashi, soy and rice. From Tokyo noodle counters to home bento boxes, balance matters more than abundance.",
    image: u("1579871494447-9811cf80d66c"),
    imageAlt: "Salmon and avocado sushi rolls lined up on a dark tray",
  },
  {
    slug: "korean",
    name: "Korean",
    country: "South Korea",
    emoji: "🍲",
    intro:
      "Korean food is built on fermentation — gochujang, doenjang and kimchi — and on sharing, with rice at the centre and banchan side dishes all around. Expect heat, tang and deep savoury flavour.",
    image: u("1553163147-622ab57be1c7"),
    imageAlt: "Bibimbap bowl with fried eggs, carrots and greens over rice",
  },
  {
    slug: "nepali",
    name: "Nepali",
    country: "Nepal",
    emoji: "🥟",
    intro:
      "Nepali kitchens sit between India and Tibet, and the food shows it: lentils and rice twice a day, Himalayan spices like timur and jimbu, and dumplings steamed in stacked baskets.",
    image: u("1626776876729-bab4369a5a5a"),
    imageAlt: "Steamed dumplings in a bamboo basket with a small bowl of dipping sauce",
  },
  {
    slug: "italian",
    name: "Italian",
    country: "Italy",
    emoji: "🍝",
    intro:
      "Italian cooking is regional to the core — Roman pasta, Neapolitan pizza, Bolognese ragù — and stubbornly simple. Great olive oil, ripe tomatoes and aged cheese do most of the work.",
    image: u("1574071318508-1cdbab80d002"),
    imageAlt: "Neapolitan pizza with blistered crust, melted mozzarella and basil",
  },
  {
    slug: "indian",
    name: "Indian",
    country: "India",
    emoji: "🍛",
    intro:
      "Indian food is many cuisines in one, layered with whole and ground spices bloomed in hot ghee or oil. Punjabi tandoor classics, southern dosas and Bengali fish curries all share that love of fragrance.",
    image: u("1588166524941-3bf61a9c41db"),
    imageAlt: "Orange curry with chunks of chicken served beside white rice",
  },
  {
    slug: "mexican",
    name: "Mexican",
    country: "Mexico",
    emoji: "🌮",
    intro:
      "Mexican cuisine rests on corn, chilies and beans, refined over thousands of years and recognised by UNESCO as intangible cultural heritage. Dried chilies, fresh salsas and hand-pressed tortillas define it.",
    image: u("1565299585323-38d6b0865b47"),
    imageAlt: "Soft tacos topped with fresh vegetables and herbs on a wooden board",
  },
  {
    slug: "thai",
    name: "Thai",
    country: "Thailand",
    emoji: "🍤",
    intro:
      "Thai cooking chases balance between sweet, sour, salty, spicy and bitter in every bite. Fish sauce, lime, palm sugar and fresh herbs are tossed together fast over a roaring wok.",
    image: u("1559314809-0d155014e29e"),
    imageAlt: "Pad thai noodles with shrimp on a white plate",
  },
  {
    slug: "french",
    name: "French",
    country: "France",
    emoji: "🥐",
    intro:
      "French cuisine codified technique for the Western world — mother sauces, laminated dough, the brigade kitchen. At its heart is butter, patience and bread from the corner boulangerie.",
    image: u("1530610476181-d83430b64dcd"),
    imageAlt: "Golden croissants piled up in a bakery display",
  },
  {
    slug: "chinese",
    name: "Chinese",
    country: "China",
    emoji: "🥡",
    intro:
      "China's eight great regional cuisines range from numbing Sichuan heat to delicate Cantonese dim sum. The wok, the steamer and a pantry of soy, Shaoxing wine and ginger tie them together.",
    image: u("1563245372-f21724e3856d"),
    imageAlt: "Soup dumplings in bamboo steamer baskets",
  },
  {
    slug: "middle-eastern",
    name: "Middle Eastern",
    country: "The Levant",
    emoji: "🧆",
    intro:
      "Across the Levant and beyond, meals are generous spreads of mezze: chickpeas, tahini, sumac, flatbread and smoky grilled meats. Lemon and fresh herbs keep everything bright.",
    image: u("1547058881-aa0edd92aab3"),
    imageAlt: "Falafel balls in a bowl with tomatoes and fresh greens",
  },
];
