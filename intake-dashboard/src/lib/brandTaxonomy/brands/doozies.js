/**
 * Doozies Brand Taxonomy & Product Rules
 * Consumer brand in Alleaves POS.
 */

export const dooziesTaxonomy = {
  brand: "Doozies",
  aliases: ["Doozies", "Doozie", "Doozies Gummies"],
  relatedBrands: ["Doozies", "Green Revolution"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR DOOZIES**:",
    "  - **Canonical Brand**: 'Doozies'.",
    "  - **Multi-Category AI Sovereignty**:",
    "    * Doozies is primarily known for fruit gummies, but may release products in any category (e.g. Vapes, Beverages, Prerolls, Concentrates).",
    "    * You (Stage 3 Master Judge AI) must evaluate physical packaging and select the authentic category from live Alleaves POS categories:",
    "      - Gummies -> category: 'Edibles > Gummies', product_format: 'Gummies 10pk'.",
    "      - Vapes -> category: 'Vapes > All-in-One Vapes > Distillate' (or Live Resin), product_format: 'Distillate AIO'.",
    "      - Beverages -> category: 'Edibles > Beverages', product_format: 'Beverage'.",
    "      - Prerolls -> category: 'Prerolls > Infused Pre-Rolls', product_format: 'Infused Prerolls'.",
    "  - **Full Chemical Formulation Standard (Packaging Only - No Naked Numbers)**:",
    "    * When physical packaging prints multi-cannabinoid formulas (e.g. Midnight Grape with CBD & CBN, Blueberry Lemon with CBD & CBG), synthesize the full formula with letters:",
    "      - Midnight Grape: packaging prints 10mg THC, 10mg CBD, 10mg CBN -> 'Doozies | Midnight Grape 1:1:1 THC/CBD/CBN | 10pk | 100mg'.",
    "      - Blueberry Lemon: packaging prints 10mg THC, 5mg CBD, 5mg CBG -> 'Doozies | Blueberry Lemon with Lion\\'s Mane | Gummies 10:5:5 THC/CBD/CBG | 10pk | 100mg'.",
    "      - Blackberry Punch: packaging prints 3:1 CBN/THC -> 'Doozies | Blackberry Punch 3:1 CBN/THC | 10pk | 100mg'.",
    "    * NEVER derive ratios from laboratory COA test results. If packaging has no ratio, use clean format with NO ratio string.",
    "  - **Weight**: typically '100mg' for gummies."
  ].join('\n'),

  productLines: [
    {
      id: "doozies_gummies",
      name: "Doozies Gummies",
      matches: (text = "") => text.toLowerCase().includes("gumm"),
      category_input: "Gummies",
      category: "Edibles > Gummies",
      weight: "100mg"
    }
  ]
};
