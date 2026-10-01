/**
 * Dopio Brand Taxonomy & Product Rules
 * Consumer cold brew, latte, espresso & coffee edible beverage brand in Alleaves POS.
 */

export function resolveCoffeeStyle(text = "") {
  const s = text.toLowerCase();
  if (s.includes("espresso")) return "Espresso Coffee Shot";
  if (s.includes("latte")) return "Latte Coffee Shot";
  if (s.includes("mocha")) return "Mocha Coffee Shot";
  if (s.includes("cappuccino")) return "Cappuccino Coffee Shot";
  if (s.includes("americano")) return "Americano Coffee Shot";
  if (s.includes("macchiato")) return "Macchiato Coffee Shot";
  if (s.includes("cold brew")) return "Cold Brew Coffee Shot";
  return "Coffee Shot";
}

export const dopioTaxonomy = {
  brand: "Dopio",
  aliases: [
    "Dopio", 
    "Dopio Cold Brew", 
    "Dopio Coffee", 
    "WildSide Dopio", 
    "Wildside", 
    "Dopio Latte", 
    "Dopio Espresso",
    "Dopio Mocha",
    "Dopio Cappuccino",
    "Dopio Americano",
    "Dopio Macchiato"
  ],
  relatedBrands: ["Dopio", "Green Revolution"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR DOPIO**:",
    "  - **Canonical Brand**: 'Dopio'.",
    "  - Product Lines: Fast Acting Coffee Shots (Cold Brew, Latte, Espresso, Mocha, Cappuccino, Americano, Macchiato).",
    "  - Packaging Ground Truth: Physical bottle indicates specific coffee style (Cold Brew, Latte, Espresso, Mocha, Cappuccino, Americano, Macchiato), flavor/strain, and cannabinoid formulation/ratio if present (e.g. 1:1 CBG/THC, 1:1 CBD/THC, 2:1 CBG/THC, 1:1:1 THC/CBD/CBN).",
    "  - AI Decision Sovereignty for Formulation Appending: The Judge AI is the SOLE authority for detecting cannabinoid formulations and appending them to the product format (e.g. 'Cold Brew Coffee Shot 1:1 CBG/THC', 'Latte Coffee Shot 1:1 CBD/THC', 'Mocha Coffee Shot 2:1 CBG/THC').",
    "  - Pure THC Formats: Pure THC products (e.g. Double Espresso 100mg THC, Mocha 100mg, Caramel 100mg) resolve to clean '[Style] Coffee Shot' with NO ratio string (e.g. 'Espresso Coffee Shot', 'Mocha Coffee Shot', 'Coffee Shot').",
    "  - Category: 'Edibles > Coffee' (or 'Edibles > Beverages').",
    "  - Delivery Route: 'Edible > Liquid Form'.",
    "  - Weight: typically '100mg'.",
    "  - Canonical slug format: 'Dopio | [Flavor/Strain] | [Style] Coffee Shot [Ratio] | 100mg' (e.g. 'Dopio | Vanilla | Cold Brew Coffee Shot 1:1 CBG/THC | 100mg', 'Dopio | Caramel | Latte Coffee Shot 1:1 CBD/THC | 100mg', 'Dopio | Dark Roast | Espresso Coffee Shot | 100mg')."
  ].join('\n'),

  resolveSubBrand: (combinedText = "") => {
    return {
      brand: "Dopio",
      category_input: resolveCoffeeStyle(combinedText),
      category: "Edibles > Coffee"
    };
  },

  productLines: [
    {
      id: "dopio_coffee_shot",
      name: "Dopio Coffee Shot",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("dopio") || s.includes("coffee") || s.includes("cold brew") || s.includes("latte") || s.includes("espresso") || s.includes("mocha") || s.includes("cappuccino") || s.includes("americano") || s.includes("macchiato") || s.includes("shot");
      },
      category_input: (text = "") => resolveCoffeeStyle(text),
      category: "Edibles > Coffee",
      weight: "100mg"
    }
  ]
};

