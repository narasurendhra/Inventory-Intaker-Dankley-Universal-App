/**
 * Green Revolution Brand Taxonomy & Product Rules
 * Defines product lines across Alleaves POS brand namespaces:
 * 1. Doozies (Fruit Gummies) -> Brand: 'Doozies', Category: 'Edibles > Gummies'
 * 2. Dopio (Coffee Shots) -> Brand: 'Dopio', Category: 'Edibles > Coffee'
 * 3. Nano Shot (Beverages) -> Brand: 'Green Revolution', Category: 'Edibles > Beverages'
 * 4. Deep Sleep (Tinctures) -> Brand: 'Deep Sleep' / 'Green Revolution', Category: 'Edibles > Tinctures'
 */

export const greenRevolutionTaxonomy = {
  brand: "Green Revolution",
  aliases: [
    "Green Revolution",
    "GreenRevolution",
    "GREV",
    "Green Revolution - Doozies",
    "Green Revolution - Dopio",
    "Deep Sleep"
  ],
  relatedBrands: ["Green Revolution", "Doozies", "Dopio", "Deep Sleep"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR GREEN REVOLUTION**:",
    "  - **Brand Namespaces (Alleaves POS Partitioning)**:",
    "    * Doozies (fruit gummies) -> canonical brand: 'Doozies', category: 'Edibles > Gummies'.",
    "    * Dopio (coffee edible shots) -> canonical brand: 'Dopio', category: 'Edibles > Coffee'.",
    "    * Nano Shot (liquid beverage shots) -> canonical brand: 'Green Revolution', category: 'Edibles > Beverages'.",
    "    * Deep Sleep (sublingual water-soluble tinctures) -> canonical brand: 'Deep Sleep' (or 'Green Revolution'), category: 'Edibles > Tinctures'.",
    "    * Topicals & Lotions -> canonical brand: 'Green Revolution', category: 'Topicals > Lotions'.",
    "  - **Full Chemical Formulation Standard (Packaging Only - No Naked Numbers)**:",
    "    * Physical packaging prints intentional multi-cannabinoid ratios. Always synthesize full cannabinoid letters:",
    "      - Nano Shot Sour Green Apple: packaging prints 10:10 THC/CBG -> product_format: 'Beverages 10:10 THC/CBG', weight: '100mg'.",
    "      - Nano Shot Agave-Lime: packaging prints 10:5:5 THC/CBG/CBC -> product_format: 'Beverages 10:5:5 THC/CBG/CBC', weight: '100mg'.",
    "      - Deep Sleep Tincture: packaging prints 5:1 THC/CBN -> product_format: '5:1 THC/CBN | Water-Soluble Tincture 1000mg', weight: '1000mg'.",
    "      - Dopio Cold Brew Vanilla: packaging prints 1:1 CBG/THC -> product_format: 'Cold Brew Coffee Shot 1:1 CBG/THC', weight: '100mg'.",
    "    * NEVER derive ratios from laboratory COA test results.",
    "  - **Canonical Slug Examples**:",
    "    * 'Doozies | Midnight Grape 1:1:1 THC/CBD/CBN | 10pk | 100mg'",
    "    * 'Green Revolution | Sour Green Apple | Beverages 10:10 THC/CBG | 100mg'",
    "    * 'Green Revolution | Agave-Lime | Beverages 10:5:5 THC/CBG/CBC | 100mg'",
    "    * 'Deep Sleep | 5:1 THC/CBN | Water-Soluble Tincture 1000mg'",
    "    * 'Dopio | Vanilla | Cold Brew Coffee Shot 1:1 CBG/THC | 100mg'"
  ].join('\n'),

  resolveSubBrand: (combinedText = "") => {
    const s = combinedText.toLowerCase();
    if (s.includes("tincture") || s.includes("sublingual") || s.includes("deep sleep")) {
      return {
        brand: s.includes("deep sleep") ? "Deep Sleep" : "Green Revolution",
        category_input: "Tinctures",
        category: "Edibles > Tinctures"
      };
    }
    if (s.includes("nano shot") || s.includes("nanoshot")) {
      return {
        brand: "Nano Shot",
        category_input: "Beverages",
        category: "Edibles > Beverages"
      };
    }
    if (s.includes("doozie") || s.includes("doozy") || s.includes("gumm")) {
      return {
        brand: "Doozies",
        category_input: "Gummies",
        category: "Edibles > Gummies"
      };
    }
    if (s.includes("dopio") || s.includes("cold brew") || s.includes("coffee") || s.includes("latte") || s.includes("espresso") || s.includes("mocha") || s.includes("cappuccino") || s.includes("americano") || s.includes("macchiato") || (s.includes("shot") && !s.includes("nano"))) {
      let style = "Coffee Shot";
      if (s.includes("espresso")) style = "Espresso Coffee Shot";
      else if (s.includes("latte")) style = "Latte Coffee Shot";
      else if (s.includes("mocha")) style = "Mocha Coffee Shot";
      else if (s.includes("cappuccino")) style = "Cappuccino Coffee Shot";
      else if (s.includes("americano")) style = "Americano Coffee Shot";
      else if (s.includes("macchiato")) style = "Macchiato Coffee Shot";
      else if (s.includes("cold brew")) style = "Cold Brew Coffee Shot";

      return {
        brand: "Dopio",
        category_input: style,
        category: "Edibles > Coffee"
      };
    }
    return {
      brand: "Green Revolution",
      category_input: ""
    };
  }
};
