/**
 * Smartbud Brand Taxonomy & Product Rules
 * Defines:
 * - Canonical Brand: "Smartbud"
 * - Aliases: "Smartbud", "Smart Bud", "SMARTBUD", "SMART BUD"
 */

export const smartbudTaxonomy = {
  brand: "Smartbud",
  aliases: ["Smartbud", "Smart Bud", "SMARTBUD", "SMART BUD"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR SMARTBUD**:",
    "  - **Canonical Brand**: 'Smartbud' (or 'Smart Bud').",
    "  - Preroll products format as 'Preroll' under category 'Flower > Prerolls' with weight '1g'."
  ].join('\n'),

  productLines: [
    {
      id: "smartbud_preroll_1g",
      name: "Smartbud 1g Preroll",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("preroll") || s.includes("pre-roll");
      },
      category_input: "Preroll",
      category: "Flower > Prerolls",
      weight: "1g"
    }
  ]
};
