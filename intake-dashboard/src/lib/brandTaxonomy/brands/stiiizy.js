/**
 * STIIIZY Product Taxonomy & Brand Rules
 * Defines product lines:
 * 1. Live Resin Liquid Diamonds Pod
 * 2. Distillate Pod
 * 3. All-In-One (AIO)
 * 4. 40s Infused Prerolls
 */

export const stiiizyTaxonomy = {
  brand: "STIIIZY",
  aliases: ["Stiiizy", "STIIIZY Pods"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR STIIIZY**:",
    "  - Live Resin Liquid Diamonds -> product_format: \"Live Resin Liquid Diamonds Pod\", category: \"Vapes > Pods > Live Resin\"",
    "  - Liquid Diamonds (only) -> product_format: \"Liquid Diamonds Pod\", category: \"Vapes > Pods > Liquid Diamonds\"",
    "  - Live Resin (only) -> product_format: \"Live Resin Pod\", category: \"Vapes > Pods > Live Resin\"",
    "  - Distillate Pod -> product_format: \"Distillate Pod\", category: \"Vapes > Pods > Distillate\"",
    "  - AIO -> product_format: \"AIO\", category: \"Vapes > All-in-One Vapes > Distillate\"",
    "  - 40s Infused Prerolls -> category_input: \"40s Infused Prerolls 5pk x 0.5g\", category: \"Flower > Infused Prerolls\""
  ].join('\n'),

  productLines: [
    {
      id: "stiiizy_lr_liquid_diamonds",
      name: "Live Resin Liquid Diamonds Pod",
      matches: (text = "") => {
        const s = text.toLowerCase();
        const hasLR = s.includes("live resin") || s.includes("live_resin");
        const hasLD = s.includes("liquid diamond") || s.includes("liquid diamonds") || s.includes("diamond");
        return hasLR && hasLD;
      },
      category_input: "Live Resin Liquid Diamonds Pod",
      category: "Vapes > Pods > Live Resin",
      weight: "1g"
    },
    {
      id: "stiiizy_live_resin_pod",
      name: "Live Resin Pod",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return (s.includes("live resin") || s.includes("live_resin")) && !s.includes("diamond");
      },
      category_input: "Live Resin Pod",
      category: "Vapes > Pods > Live Resin",
      weight: "1g"
    },
    {
      id: "stiiizy_liquid_diamonds_pod",
      name: "Liquid Diamonds Pod",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return (s.includes("liquid diamond") || s.includes("liquid diamonds")) && !s.includes("live resin");
      },
      category_input: "Liquid Diamonds Pod",
      category: "Vapes > Pods > Liquid Diamonds",
      weight: "1g"
    },
    {
      id: "stiiizy_distillate_pod",
      name: "Distillate Pod",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("pod") && !s.includes("aio") && !s.includes("all-in-one");
      },
      category_input: "Distillate Pod",
      category: "Vapes > Pods > Distillate",
      weight: "1g"
    },
    {
      id: "stiiizy_aio",
      name: "AIO",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("aio") || s.includes("all-in-one") || s.includes("all in one") || s.includes("disposable");
      },
      category_input: "AIO",
      category: "Vapes > All-in-One Vapes > Distillate",
      weight: "1g"
    },
    {
      id: "stiiizy_infused_prerolls",
      name: "Infused Prerolls",
      matches: (text = "") => {
        const s = text.toLowerCase();
        return s.includes("preroll") || s.includes("pre-roll") || s.includes("40s");
      },
      category_input: "Infused Prerolls 5pk",
      category: "Flower > Infused Prerolls",
      weight: "2.5g"
    }
  ]
};
