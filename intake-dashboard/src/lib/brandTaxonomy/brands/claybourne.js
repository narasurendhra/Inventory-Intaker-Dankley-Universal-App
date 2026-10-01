/**
 * Claybourne Co. Product Taxonomy & Brand Rules
 * Defines product lines:
 * 1. Frosted Flyers Diamond Infused Prerolls (5pk x 0.5g)
 * 2. Flyers Diamond Infused Blunt (1.5g)
 * 3. Flyers Diamond Infused Prerolls (5pk x 0.5g)
 * 4. Blends Prerolls (7pk x 0.5g)
 * 5. Gassers Liquid Diamonds AIO (1g)
 * 6. Classic Cuts Flower (3.5g)
 * 7. Gold Cuts Flower (3.5g)
 */

export const claybourneTaxonomy = {
  brand: "Claybourne Co.",
  aliases: ["Claybourne", "Claybourne Co"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR CLAYBOURNE CO.**:",
    "  - Frosted Flyers -> category_input: \"Frosted Flyers Diamond Infused Prerolls 5pk x 0.5g\", category: \"Flower > Infused Prerolls\", weight: \"2.5g\"",
    "  - Blunt -> category_input: \"Flyers Diamond Infused Blunt\", category: \"Flower > Infused Prerolls\", weight: \"1.5g\"",
    "  - Flyers / Infused Prerolls -> category_input: \"Flyers Diamond Infused Prerolls 5pk x 0.5g\", category: \"Flower > Infused Prerolls\", weight: \"2.5g\"",
    "  - Blends -> category_input: \"Blends Prerolls 7pk x 0.5g\", category: \"Flower > Prerolls\", weight: \"3.5g\"",
    "  - Gassers / AIO -> category_input: \"Gassers Liquid Diamonds AIO\", category: \"Vapes > All-in-One Vapes > Liquid Diamonds\", weight: \"1g\"",
    "  - Classic Cuts -> category_input: \"Classic Cuts Flower\", category: \"Flower > Bud\", weight: \"3.5g\"",
    "  - Gold Cuts -> category_input: \"Gold Cuts Flower\", category: \"Flower > Bud\", weight: \"3.5g\""
  ].join('\n'),

  productLines: [
    {
      id: "frosted_flyers",
      name: "Frosted Flyers",
      matches: (text = "") => text.toLowerCase().includes("frosted"),
      category_input: "Frosted Flyers Diamond Infused Prerolls 5pk x 0.5g",
      category: "Flower > Infused Prerolls",
      weight: "2.5g"
    },
    {
      id: "flyers_blunt",
      name: "Flyers Blunt",
      matches: (text = "") => text.toLowerCase().includes("blunt"),
      category_input: "Flyers Diamond Infused Blunt",
      category: "Flower > Infused Prerolls",
      weight: "1.5g"
    },
    {
      id: "flyers_prerolls",
      name: "Flyers Prerolls",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("flyer") && (s.includes("diamond") || s.includes("infused") || s.includes("preroll") || s.includes("pre-roll"));
      },
      category_input: "Flyers Diamond Infused Prerolls 5pk x 0.5g",
      category: "Flower > Infused Prerolls",
      weight: "2.5g"
    },
    {
      id: "blends_prerolls",
      name: "Blends Prerolls",
      matches: (text = "") => text.toLowerCase().includes("blend"),
      category_input: "Blends Prerolls 7pk x 0.5g",
      category: "Flower > Prerolls",
      weight: "3.5g"
    },
    {
      id: "gassers_aio",
      name: "Gassers Liquid Diamonds AIO",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("gasser") || s.includes("aio") || s.includes("all-in-one") || s.includes("vape");
      },
      category_input: "Gassers Liquid Diamonds AIO",
      category: "Vapes > All-in-One Vapes > Liquid Diamonds",
      weight: "1g"
    },
    {
      id: "classic_cuts",
      name: "Classic Cuts Flower",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("classic cut") || s.includes("large bud");
      },
      category_input: "Classic Cuts Flower",
      category: "Flower > Bud",
      weight: "3.5g"
    },
    {
      id: "gold_cuts",
      name: "Gold Cuts Flower",
      matches: (text = "") => text.toLowerCase().includes("gold cut"),
      category_input: "Gold Cuts Flower",
      category: "Flower > Bud",
      weight: "3.5g"
    }
  ]
};
