/**
 * To The Moon Brand Taxonomy & Product Rules
 * Governs To The Moon (TTM) flower (3.5g, 14g), moonrocks, and infused products.
 */

export const toTheMoonTaxonomy = {
  brand: 'To The Moon',
  aliases: ['To The Moon', 'TTM', 'TOTHEMOON', 'TO THE MOON'],
  relatedBrands: ['To The Moon'],

  promptGuide: [
    '- **BRAND PRODUCT LINE GUIDE FOR TO THE MOON (TTM)**:',
    '  - **Canonical Brand**: "To The Moon".',
    '  - **Categories**: "Flower > Bud" (ID: 1052) for packaged flower; "Flower > Infused Prerolls" (ID: 1054) for infused prerolls / moonrocks.',
    '  - **Product Lines & Slugs**:',
    '    1. **Essentials / Packaged Flower**:',
    '       - Metrc Manifest: "TTM - Flower - Packaged - [Weight] - Essentials - [Type] - [Strain]".',
    '       - Batch Code Prefix: TTM-ES-[Weight]-[Code]-YYMMDD or TTM-F-[Weight]-[Code]-YYMMDD.',
    '       - Category Input: "Flower". Category: "Flower > Bud".',
    '       - Canonical Slug: "To The Moon | [Clean Strain] | Flower | [Weight]".',
    '       - Commercial Shells: 2383 (Blue Dream 3.5g), 2384 (Gorilla Glue 3.5g), 2385 (Maui Wowie 3.5g), 2387 (Unicorn Milk 14g), 2388 (Unicorn Milk 3.5g).',
    '    2. **Moonrocks / Infused Flower**:',
    '       - Metrc Manifest: "TTM - Moonrock - [Weight] - ...".',
    '       - Category Input: "Moonrocks". Category: "Flower > Infused Prerolls".',
    '       - Canonical Slug: "To The Moon | [Clean Strain] | Moonrocks | [Weight]".'
  ].join('\n'),

  productLines: [
    {
      id: 'ttm_flower',
      name: 'To The Moon Packaged Flower',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return (
          s.includes('ttm') ||
          s.includes('to the moon') ||
          s.includes('essentials')
        ) && (s.includes('flower') || s.includes('3.5g') || s.includes('14g') || s.includes('7g') || s.includes('28g'));
      },
      category_input: 'Flower',
      category: 'Flower > Bud',
      weight: '3.5g'
    },
    {
      id: 'ttm_moonrocks',
      name: 'To The Moon Moonrocks',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return s.includes('moonrock') || s.includes('moon rock') || s.includes('moon-rock');
      },
      category_input: 'Moonrocks',
      category: 'Flower > Infused Prerolls',
      weight: '1g'
    }
  ]
};
