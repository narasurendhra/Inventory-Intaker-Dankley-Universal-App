/**
 * Ripped Brand Taxonomy & Product Rules
 * Defines product lines:
 * 1. Ripped Infused Ground Flower (7g, 3.5g, 14g)
 * 2. Ripped Ground Flower
 */

export const rippedTaxonomy = {
  brand: "Ripped",
  aliases: ["Ripped", "RIPPED", "Ripped Cannabis", "Ripped Flower"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR RIPPED**:",
    "  - **Canonical Brand**: 'Ripped'.",
    "  - Physical packaging contains full ground truth for strain, THC%, weight, and infusion type.",
    "  - If packaging indicates infused (e.g. infused ground flower, diamond infused, etc.), format segment is strictly: 'Infused Ground Flower'.",
    "  - If packaging indicates non-infused ground flower, format segment is: 'Ground Flower'.",
    "  - Canonical slug format: 'Ripped | [Strain] | Infused Ground Flower | [Weight]' (e.g. 'Ripped | Granddaddy Purp | Infused Ground Flower | 7g').",
    "  - Category: 'Flower > Infused Grounded Flower' (or 'Flower > Infused Ground Flower') for infused; 'Flower > Grounded' (or 'Flower > Ground Flower') for non-infused."
  ].join('\n'),

  productLines: [
    {
      id: "ripped_infused_ground_flower",
      name: "Ripped Infused Ground Flower",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("ground") && (s.includes("infused") || s.includes("diamond") || s.includes("extract") || s.includes("resin") || s.includes("rosin"));
      },
      category_input: "Infused Ground Flower",
      category: "Flower > Infused Grounded Flower"
    },
    {
      id: "ripped_ground_flower",
      name: "Ripped Ground Flower",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("ground") || s.includes("shake") || s.includes("trim");
      },
      category_input: "Ground Flower",
      category: "Flower > Grounded"
    }
  ]
};
