/**
 * Timeless Vapes Product Taxonomy & Brand Rules
 * Defines product lines:
 * 1. Noir Live Resin Liquid Diamonds (AIO & Cart)
 * 2. Noir Live Resin Terpenes (AIO & Cart)
 * 3. Noir Liquid Diamonds (AIO & Cart)
 * 4. Classic Timeless Distillate (AIO & Cart)
 */

export const timelessTaxonomy = {
  brand: "Timeless",
  aliases: ["Timeless Vapes", "Timeless Noir", "Timeless AIO", "Timeless Disposable", "Noir", "NOIR", "Noir AIO", "Noir Cart", "Noir Live Resin", "Noir Liquid Diamonds"],
  
  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR TIMELESS**:",
    "  - **Noir Live Resin Liquid Diamonds**: If packaging has 'NOIR' + 'LIQUID DIAMONDS' + 'LIVE RESIN TERPENES' -> product_format: \"Noir Live Resin Liquid Diamonds\", category: \"Vapes > All-in-One Vapes > Live Resin\" (for AIO) or \"Vapes > Carts > Live Resin\" (for Cart).",
    "  - **Noir Live Resin**: If packaging has 'NOIR' + 'LIVE RESIN TERPENES' (without Liquid Diamonds) -> product_format: \"Noir Live Resin\", category: \"Vapes > All-in-One Vapes > Live Resin\" (for AIO) or \"Vapes > Carts > Live Resin\" (for Cart).",
    "  - **Noir Liquid Diamonds**: If packaging has 'NOIR' + 'LIQUID DIAMONDS' (without Live Resin) -> product_format: \"Noir Liquid Diamonds\", category: \"Vapes > All-in-One Vapes > Liquid Diamonds\" (for AIO) or \"Vapes > Carts > Liquid Diamonds\" (for Cart).",
    "  - **Classic Timeless (Distillate)**: If packaging has NO 'NOIR' -> product_format: \"AIO\" (or \"Cart\"), category: \"Vapes > All-in-One Vapes > Distillate\" (or \"Vapes > Carts > Distillate\")."
  ].join('\n'),

  productLines: [
    {
      id: "noir_lr_liquid_diamonds",
      name: "Noir Live Resin Liquid Diamonds",
      matches: (text = "") => {
        const s = text.toLowerCase();
        const hasNoir = s.includes("noir");
        const hasLD = s.includes("liquid diamond") || s.includes("liquid diamonds");
        const hasLR = s.includes("live resin");
        return (hasNoir && hasLD && hasLR) || (hasLD && hasLR);
      },
      formatSlug: (hardware) => 'Noir Live Resin Liquid Diamonds ' + hardware,
      categoryMap: {
        AIO: "Vapes > All-in-One Vapes > Live Resin",
        Cart: "Vapes > Carts > Live Resin"
      }
    },
    {
      id: "noir_live_resin",
      name: "Noir Live Resin",
      matches: (text = "") => {
        const s = text.toLowerCase();
        const hasNoir = s.includes("noir");
        const hasLR = s.includes("live resin");
        const hasLD = s.includes("liquid diamond") || s.includes("liquid diamonds");
        return (hasNoir && hasLR && !hasLD) || (hasLR && !hasLD && !s.includes("distillate"));
      },
      formatSlug: (hardware) => 'Noir Live Resin ' + hardware,
      categoryMap: {
        AIO: "Vapes > All-in-One Vapes > Live Resin",
        Cart: "Vapes > Carts > Live Resin"
      }
    },
    {
      id: "noir_liquid_diamonds",
      name: "Noir Liquid Diamonds",
      matches: (text = "") => {
        const s = text.toLowerCase();
        const hasNoir = s.includes("noir");
        const hasLD = s.includes("liquid diamond") || s.includes("liquid diamonds");
        const hasLR = s.includes("live resin");
        return (hasNoir && hasLD && !hasLR) || (hasLD && !hasLR);
      },
      formatSlug: (hardware) => 'Noir Liquid Diamonds ' + hardware,
      categoryMap: {
        AIO: "Vapes > All-in-One Vapes > Liquid Diamonds",
        Cart: "Vapes > Carts > Liquid Diamonds"
      }
    },
    {
      id: "classic_distillate",
      name: "Classic Distillate",
      matches: () => true,
      formatSlug: (hardware) => hardware,
      categoryMap: {
        AIO: "Vapes > All-in-One Vapes > Distillate",
        Cart: "Vapes > Carts > Distillate"
      }
    }
  ],

  detectHardware: (text = "") => {
    const s = text.toLowerCase();
    if (s.includes("aio") || s.includes("all-in-one") || s.includes("all in one") || s.includes("t1") || s.includes("t2") || s.includes("disposable") || s.includes("rechargeable vaporizer")) {
      return "AIO";
    }
    return "Cart";
  }
};
