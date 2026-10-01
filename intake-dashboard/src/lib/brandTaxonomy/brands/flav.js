/**
 * Flav Brand Taxonomy & Product Rules
 * Governs Flav 100mg edibles: Live Resin Belts (10pk), Mega Belts (1pk), and Gummy Rings.
 */

export const flavTaxonomy = {
  brand: 'Flav',
  aliases: ['Flav', 'FlavRx', 'Flav Inc', 'Flav Cannabis', 'FLAV'],
  relatedBrands: ['Flav'],

  promptGuide: [
    '- **BRAND PRODUCT LINE GUIDE FOR FLAV (100MG EDIBLES)**:',
    '  - **Canonical Brand**: "Flav".',
    '  - **Category**: strictly "Edibles > Gummies" (Alleaves POS ID: 1019).',
    '  - **Three Distinct Commercial Product Lines & Exact Slug Formatting**:',
    '    1. **Live Resin Sour Gummy Belts (10-Pack)**:',
    '       - Physical Packaging: Labeled "Sour Belts" or "Sour Gummy Belts", "10 Belts" / "10 Pack", "100mg THC", and prominent "Live Resin" badge.',
    '       - Metrc Manifest: "Flav - Candy - Belt - 100mg - Live Resin - [Flavor] - [Type]".',
    '       - Batch Code Prefix: FLAV-LR-[Code]100-YYMMDD (e.g. FLAV-LR-LB100, FLAV-LR-WB100, FLAV-LR-RB100).',
    '       - Product Format: strictly "Live Resin Sour Gummy Belts" (PLURAL Belts; MUST include "Gummy" to prevent beverage conflict on Pink Lemonade).',
    '       - Weight: strictly "10pk | 100mg" (nominal usable weight: 100 Milligrams).',
    '       - Flavor Normalization: When manifest says "Apple", normalize flavor to "Green Apple" (matches Shell 2029).',
    '       - Canonical Slug: "Flav | [Flavor] | Live Resin Sour Gummy Belts | 10pk | 100mg".',
    '       - Commercial Shells: 1198 (Pink Lemonade), 1199 (Watermelon), 1200 (Rainbow), 2029 (Green Apple).',
    '    2. **Sour Gummy Belt (1-Pack Mega Belt)**:',
    '       - Physical Packaging: Labeled "Mega Belt" or "Sour Gummy Belt - Mega Dosed", "1 Belt", "100mg THC Total", with high-dose consumption warning.',
    '       - Metrc Manifest: "Flav - Candy - Mega Belt - 100mg - Live Resin - [Flavor] - [Type]".',
    '       - Batch Code Prefix: FLAV-MD-LR-[Code]100-YYMMDD (e.g. FLAV-MD-LR-BB100, FLAV-MD-LR-SB100, FLAV-MD-LR-RB100).',
    '       - Product Format: strictly "Sour Gummy Belt" (SINGULAR Belt; drops "Live Resin" and drops "Mega").',
    '       - Weight: strictly "1pk | 100mg" (nominal usable weight: 100 Milligrams).',
    '       - Canonical Slug: "Flav | [Flavor] | Sour Gummy Belt | 1pk | 100mg".',
    '       - Commercial Shells: 1201 (Strawberry), 1202 (Rainbow), 1203 (Blueberry).',
    '    3. **Gummy Rings (Distillate Multi-Piece)**:',
    '       - Physical Packaging: Labeled "Gummy Rings" (or "Apple Rings", "Peach Rings") with "100mg THC".',
    '       - Metrc Manifest: "Flav - Candy - Ring - 100mg - Distillate - [Flavor]".',
    '       - Batch Code Prefix: FLAV-AR100-YYMMDD (Apple Rings), FLAV-PR100-YYMMDD (Peach Rings).',
    '       - Product Format: strictly "Gummy Rings" (PLURAL Rings; drops "Distillate").',
    '       - Weight: strictly "100mg" (DO NOT use "10pk | 100mg"; pack count is uncounted in slug to prevent pack mismatch against Shell 2382).',
    '       - Canonical Slug: "Flav | [Flavor] | Gummy Rings | 100mg".',
    '       - Commercial Shells: 2382 (Apple Gummy Rings).',
    '    4. **Mega Dosed Gummy Rings (2-Pack)**:',
    '       - Physical Packaging: Labeled "Mega Dosed Gummy Rings", "2 Pieces Per Package", "100 MG THC Total" (compliance sticker states 50mg/piece).',
    '       - Metrc Manifest: "Flav - Candy - Mega Ring - 100mg - Distillate - [Flavor]".',
    '       - Batch Code Prefix: FLAV-MD-[Code]100-YYMMDD (e.g. FLAV-MD-PR100 Peach, FLAV-MD-CR100 Cherry, FLAV-MD-WR100 Watermelon).',
    '       - Product Format: strictly "Mega Gummy Rings" (PLURAL Rings).',
    '       - Weight: strictly "2pk | 100mg" (nominal usable weight: 100 Milligrams).',
    '       - Canonical Slug: "Flav | [Flavor] | Mega Gummy Rings | 2pk | 100mg".',
    '    5. **Infused Prerolls / Preroll Duo (Smokables)**:',
    '       - Manifest / Packaging: Labeled "Preroll Duo", "Live Resin Infused", or "Infused Pre-Roll".',
    '       - Category: strictly "Flower > Infused Prerolls" (Alleaves POS ID: 1054).',
    '       - Product Format: "Preroll Duo".',
    '       - Canonical Slug: "Flav | [Strain] | Preroll Duo | [Weight]".'
  ].join('\n'),

  productLines: [
    {
      id: 'flav_mega_belt',
      name: 'Flav Mega Belt (1pk)',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return (
          (s.includes('belt') && (s.includes('mega') || s.includes('flav-md-') || s.includes('1pk') || s.includes('single') || s.includes('1 belt'))) ||
          s.includes('flav-md-lr-')
        );
      },
      category_input: 'Sour Gummy Belt',
      category: 'Edibles > Gummies',
      weight: '1pk | 100mg',
      forceWeight: true,
      forceFormat: true
    },
    {
      id: 'flav_live_resin_belts',
      name: 'Flav Live Resin Sour Gummy Belts (10pk)',
      matches: (text = '') => {
        const s = text.toLowerCase();
        if (s.includes('mega') || s.includes('flav-md-') || s.includes('1pk') || s.includes('1 belt')) {
          return false;
        }
        return (
          s.includes('flav-lr-') ||
          s.includes('10pk') ||
          s.includes('10 pack') ||
          s.includes('10 belts') ||
          s.includes('belts') ||
          (s.includes('belt') && s.includes('live resin'))
        );
      },
      category_input: 'Live Resin Sour Gummy Belts',
      category: 'Edibles > Gummies',
      weight: '10pk | 100mg',
      forceWeight: true,
      forceFormat: true
    },
    {
      id: 'flav_mega_rings',
      name: 'Flav Mega Dosed Gummy Rings (2pk)',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return (
          (s.includes('ring') || s.includes('rings')) &&
          (s.includes('mega') || s.includes('flav-md-') || s.includes('2pk') || s.includes('2 pieces') || s.includes('2 piece') || s.includes('2-pack'))
        );
      },
      category_input: 'Mega Gummy Rings',
      category: 'Edibles > Gummies',
      weight: '2pk | 100mg',
      forceWeight: true,
      forceFormat: true
    },
    {
      id: 'flav_gummy_rings',
      name: 'Flav Gummy Rings (100mg)',
      matches: (text = '') => {
        const s = text.toLowerCase();
        if (s.includes('mega') || s.includes('flav-md-') || s.includes('2pk') || s.includes('2 pieces')) return false;
        return s.includes('ring') || s.includes('rings') || s.includes('flav-ar') || s.includes('flav-pr');
      },
      category_input: 'Gummy Rings',
      category: 'Edibles > Gummies',
      weight: '100mg',
      forceWeight: true,
      forceFormat: true
    },
    {
      id: 'flav_infused_prerolls',
      name: 'Flav Infused Prerolls / Duo',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return (s.includes('preroll') || s.includes('pre-roll') || s.includes('joint') || s.includes('duo')) && s.includes('infused');
      },
      category_input: 'Preroll Duo',
      category: 'Flower > Infused Prerolls'
    }
  ]
};
