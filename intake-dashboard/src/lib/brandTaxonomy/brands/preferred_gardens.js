/**
 * Preferred Gardens Brand Taxonomy & Product Rules
 * Defines:
 * - Canonical Brand: "Preferred Gardens"
 * - Aliases: "Preferred", "PREFERRED", "Preferred Gardens", "PG"
 */

export const preferredGardensTaxonomy = {
  brand: "Preferred Gardens",
  aliases: ["Preferred", "PREFERRED", "Preferred Gardens", "PG", "Preferred Flower"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR PREFERRED GARDENS**:",
    "  - **Canonical Brand**: 'Preferred Gardens' (or 'Preferred').",
    "  - Whole flower products format as 'Flower' under category 'Flower > Bud' with weight '3.5g'."
  ].join('\n'),

  productLines: [
    {
      id: "pg_flower_3_5g",
      name: "Preferred Gardens 3.5g Flower",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("flower") || s.includes("bud");
      },
      category_input: "Flower",
      category: "Flower > Bud",
      weight: "3.5g"
    }
  ]
};
