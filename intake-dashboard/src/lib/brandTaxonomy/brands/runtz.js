/**
 * Runtz Brand Taxonomy & Product Rules
 * Defines:
 * - Canonical Brand: "Runtz"
 * - Aliases: "The R Brand", "R Brand", "R-", "Runtz", "RUNTZ", "Runtz Worldwide", "Runtz Official"
 */

export const runtzTaxonomy = {
  brand: "Runtz",
  aliases: ["The R Brand", "R Brand", "Runtz", "RUNTZ", "Runtz Worldwide", "Runtz Official"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR RUNTZ**:",
    "  - **Canonical Brand**: 'Runtz' (NEVER 'The R Brand' or 'R Brand'). Manifest line items with prefix 'R-' or 'The R Brand' MUST have brand set to 'Runtz'.",
    "  - Multi-pack prerolls (e.g. 2pk 1.5g) format as 'Prerolls 2pk x 0.75g' with total weight '1.5g'."
  ].join('\n'),

  productLines: [
    {
      id: "runtz_prerolls_2pk",
      name: "Runtz 2pk Prerolls",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return (s.includes("2pk") || s.includes("2-pack") || s.includes("2 pack")) && (s.includes("preroll") || s.includes("pre-roll") || s.includes("joint"));
      },
      category_input: "Prerolls 2pk x 0.75g",
      category: "Flower > Prerolls",
      weight: "1.5g"
    },
    {
      id: "runtz_preroll_single",
      name: "Runtz 1g Preroll",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return (s.includes("preroll") || s.includes("pre-roll")) && !s.includes("pk") && !s.includes("pack");
      },
      category_input: "Preroll",
      category: "Flower > Prerolls",
      weight: "1g"
    },
    {
      id: "runtz_flower_3_5g",
      name: "Runtz 3.5g Flower",
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
