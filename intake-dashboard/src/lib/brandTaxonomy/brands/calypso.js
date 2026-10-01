/**
 * Calypso Brand Taxonomy & Product Rules
 * Defines product lines:
 * 1. Calypso AIO Vaporizers
 * 2. Calypso 510 Carts
 */

export const calypsoTaxonomy = {
  brand: "Calypso",
  aliases: ["Calypso", "KALYPSO", "Calypso Vapes", "Kalypso Vapes", "Growing Renaissance", "Growing Renaissance LLC"],
  
  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR CALYPSO**:",
    "  - **Canonical Brand**: 'Calypso' (or 'KALYPSO').",
    "  - Calypso products include AIO vaporizers and 510 carts with distillate or live resin formulations."
  ].join('\n'),

  productLines: [
    {
      id: "calypso_aio",
      name: "Calypso AIO",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("aio") || s.includes("all-in-one") || s.includes("disposable");
      },
      category_input: "Distillate AIO",
      category: "Vapes > All-in-One Vapes > Distillate"
    },
    {
      id: "calypso_cart",
      name: "Calypso Cart",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("cart") || s.includes("cartridge") || s.includes("510");
      },
      category_input: "Distillate Cart",
      category: "Vapes > Carts > Distillate"
    }
  ]
};
