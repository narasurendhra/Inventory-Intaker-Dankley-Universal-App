/**
 * Dank By Definition Brand Taxonomy & Product Rules
 * Defines:
 * - Canonical Brand: "Dank By Definition"
 * - Aliases: ['Dank', 'DANK', 'Dank.', 'Dank by Definition', 'Dank By Definition', 'Dank By Definition Cannabis']
 * In Alleaves POS, 32 active items exist under brand 'Dank By Definition' (and 0 items under 'Dank').
 * Slugs in Alleaves POS typically start with 'Dank | ...' or 'Dank By Definition | ...'.
 */

export const dankByDefinitionTaxonomy = {
  brand: "Dank By Definition",
  aliases: ["Dank", "DANK", "Dank.", "Dank by Definition", "Dank By Definition Cannabis"],
  relatedBrands: ["Dank By Definition", "Dank"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR DANK BY DEFINITION**:",
    "  - **Canonical Brand**: 'Dank By Definition'.",
    "  - Note: Metrc manifest prints 'Brand: Dank', but Alleaves POS registered brand is strictly 'Dank By Definition'.",
    "  - Whole flower products format as 'Flower' under category 'Flower > Bud' (e.g. '3.5g').",
    "  - Preroll products format as 'Preroll' under category 'Flower > Prerolls' (e.g. '1g').",
    "  - Infused prerolls format as 'Infused Preroll' under category 'Flower > Infused Prerolls'."
  ].join('\n'),

  productLines: [
    {
      id: "dank_infused_preroll",
      name: "Dank By Definition Infused Preroll",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return (s.includes("preroll") || s.includes("pre-roll") || s.includes("joint")) && (s.includes("infused") || s.includes("diamond") || s.includes("hash") || s.includes("resin") || s.includes("rosin"));
      },
      category_input: "Infused Preroll",
      category: "Flower > Infused Prerolls"
    },
    {
      id: "dank_preroll",
      name: "Dank By Definition Preroll",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("preroll") || s.includes("pre-roll") || s.includes("joint");
      },
      category_input: "Preroll",
      category: "Flower > Prerolls"
    },
    {
      id: "dank_flower",
      name: "Dank By Definition Flower",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("flower") || s.includes("bud") || s.includes("sungrown") || s.includes("indoor");
      },
      category_input: "Flower",
      category: "Flower > Bud"
    }
  ]
};
