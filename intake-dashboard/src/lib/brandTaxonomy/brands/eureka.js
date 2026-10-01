/**
 * Eureka Product Taxonomy & Brand Rules
 * Defines product lines:
 * 1. Fusion AIO Reload / Live Resin Reload
 * 2. Starter Kit
 * 3. Fusion AIO / Live Resin AIO
 * 4. Classic Cartridge
 * 5. Live Resin Infused Prerolls
 */

export const eurekaTaxonomy = {
  brand: "Eureka",
  aliases: ["Eureka Vapor", "Eureka Fusion"],

  promptGuide: [
    "- **BRAND PRODUCT LINE GUIDE FOR EUREKA**:",
    "  - **Hardware Lines (Strict Isolation - Never Confuse Reload vs Starter Kit)**:",
    "    * Fusion Reload / Reload -> Pod refill only. product_format: \"Fusion AIO Reload\" or \"Live Resin Reload\", category: \"Vapes > Pods > Distillate\" (or \"Vapes > Pods > Live Resin\").",
    "    * Starter Kit -> Battery + Pod hardware kit. product_format: \"Starter Kit\" (or \"Live Resin Starter Kit\"), category: \"Vapes > Starter Kits > Distillate\" (or \"Vapes > Starter Kits > Live Resin\").",
    "    * All-In-One / AIO -> Integrated disposable pen. product_format: \"Fusion AIO\" or \"Live Resin AIO\", category: \"Vapes > All-in-One Vapes > Distillate\" (or \"Vapes > All-in-One Vapes > Live Resin\").",
    "    * Infused Joint / Infused Preroll -> product_format: \"Live Resin Infused Preroll\", category: \"Prerolls > Infused Pre-Rolls\".",
    "  - **Extract Tiers**:",
    "    * \"Premium\" on packaging or ~0.7g / 700mg THC indicates Live Resin extract.",
    "    * Packaging with minor cannabinoid ratios (e.g. 2:1 THC/CBN, 3:1 THC/THCV) indicates Fusion.",
    "    * ~0.9g / 900mg THC or \"Classic\" indicates Distillate.",
    "  - **Canonical Slugs**:",
    "    * 'Eureka | Super Skunk | Live Resin Reload | 1g'",
    "    * 'Eureka | Mango Haze | Fusion AIO Reload | 1g'",
    "    * 'Eureka | Wedding Cake | Live Resin Starter Kit | 1g'",
    "    * 'Eureka | Columbian Gold x Donny Burger | Live Resin Infused Preroll | 1g'"
  ].join('\n'),

  productLines: [
    {
      id: "eureka_reload",
      name: "Fusion AIO Reload",
      matches: (text = "") => text.toLowerCase().includes("reload"),
      category_input: "Fusion AIO Reload",
      category: "Vapes > Pods > Distillate",
      weight: "1g"
    },
    {
      id: "eureka_starter_kit",
      name: "Starter Kit",
      matches: (text = "") => text.toLowerCase().includes("starter kit") || text.toLowerCase().includes("starterkit"),
      category_input: "Starter Kit",
      category: "Vapes > Starter Kits > Distillate",
      weight: "1g"
    },
    {
      id: "eureka_aio",
      name: "Fusion AIO",
      matches: (text = "") => text.toLowerCase().includes("aio") || text.toLowerCase().includes("all-in-one"),
      category_input: "Fusion AIO",
      category: "Vapes > All-in-One Vapes > Distillate",
      weight: "1g"
    }
  ]
};
