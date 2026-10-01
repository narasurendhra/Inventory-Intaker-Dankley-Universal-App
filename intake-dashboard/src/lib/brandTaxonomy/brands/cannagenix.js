/**
 * Cannagenix Brand Taxonomy & Product Rules
 * Governs Cannagenix (CANAGENIX) products:
 * 1. Hand Rolled Glass Tip Preroll (when glass tip is explicitly specified)
 * 2. Hand Rolled Preroll (when hand rolled is specified without glass tip)
 * 3. Multi-pack Prerolls (5pk x 0.5g)
 * 4. Standard Prerolls
 * 5. Packaged Flower (3.5g)
 */

export const cannagenixTaxonomy = {
  brand: 'CANAGENIX',
  aliases: ['CANAGENIX', 'Cannagenix', 'CannaGenix', 'Canna Genix'],
  relatedBrands: ['CANAGENIX'],

  promptGuide: [
    '- **BRAND PRODUCT LINE GUIDE FOR CANAGENIX (CANAGENIX)**:',
    '  - **Canonical Brand**: "CANAGENIX".',
    '  - **Categories**: "Flower > Prerolls" (ID: 1004) for standard prerolls; "Flower > Infused Prerolls" (ID: 1013/1054) for infused prerolls; "Flower > Bud" (ID: 1052) for flower.',
    '  - **Product Lines & Slugs**:',
    '    1. **Hand Rolled Glass Tip Preroll** (ONLY when glass tip is explicitly specified on packaging/manifest):',
    '       - Format segment: "Hand Rolled Glass Tip Preroll".',
    '       - Canonical Slug: "CANAGENIX | [Clean Strain] | Hand Rolled Glass Tip Preroll | [Weight]".',
    '       - Commercial Shells in POS: Shell #3068 (Zimosa 1g), Shell #3069 (Zkittlez 1g).',
    '    2. **Hand Rolled Preroll** (when packaging/manifest specifies Hand Rolled without glass tip):',
    '       - Format segment: "Hand Rolled Preroll".',
    '       - Canonical Slug: "CANAGENIX | [Clean Strain] | Hand Rolled Preroll | [Weight]".',
    '    3. **Preroll 5pk x 0.5g** (Multi-Pack Prerolls):',
    '       - Format segment: "Preroll 5pk x 0.5g".',
    '       - Canonical Slug: "CANAGENIX | [Clean Strain] | Preroll 5pk x 0.5g | [Weight]".',
    '       - Commercial Shells in POS: Shell #3070 (Gelonade 2.5g), Shell #3071 (Zookies 2.5g).',
    '    4. **Packaged Flower**:',
    '       - Format segment: "Flower". Category: "Flower > Bud".',
    '       - Canonical Slug: "CANAGENIX | [Clean Strain] | Flower | [Weight]".',
    '       - Commercial Shells in POS: Shell #2368 (Moonbow 3.5g), Shell #2370 (Zimosa 3.5g), Shell #2369 (Zookies #18 3.5g).',
    '  - **Dynamic Usable Weight**: Usable weight must be dynamically preserved as printed on packaging/manifest (e.g. 1g, 1.5g, 2g, 2.5g).'
  ].join('\n'),

  productLines: [
    {
      id: 'cannagenix_hand_rolled_glass_tip_preroll',
      name: 'Cannagenix Hand Rolled Glass Tip Preroll',
      matches: (text = '') => {
        const s = text.toLowerCase();
        const hasHandRoll = s.includes('hand roll') || s.includes('hand-roll') || s.includes('handroll');
        const hasGlassTip = s.includes('glass tip') || s.includes('glasstip') || s.includes('glass-tip');
        const isPreroll = s.includes('preroll') || s.includes('pre-roll') || s.includes('joint');
        return (hasHandRoll && hasGlassTip) || (hasGlassTip && isPreroll);
      },
      category_input: 'Hand Rolled Glass Tip Preroll',
      category: (text = '') => {
        const s = (text || '').toLowerCase();
        return (s.includes('infused') || s.includes('diamond') || s.includes('resin') || s.includes('rosin') || s.includes('hash'))
          ? 'Flower > Infused Prerolls'
          : 'Flower > Prerolls';
      },
      forceFormat: true
    },
    {
      id: 'cannagenix_hand_rolled_preroll',
      name: 'Cannagenix Hand Rolled Preroll',
      matches: (text = '') => {
        const s = text.toLowerCase();
        const hasHandRoll = s.includes('hand roll') || s.includes('hand-roll') || s.includes('handroll');
        const hasGlassTip = s.includes('glass tip') || s.includes('glasstip') || s.includes('glass-tip');
        return hasHandRoll && !hasGlassTip;
      },
      category_input: 'Hand Rolled Preroll',
      category: (text = '') => {
        const s = (text || '').toLowerCase();
        return (s.includes('infused') || s.includes('diamond') || s.includes('resin') || s.includes('rosin') || s.includes('hash'))
          ? 'Flower > Infused Prerolls'
          : 'Flower > Prerolls';
      },
      forceFormat: true
    },
    {
      id: 'cannagenix_preroll_5pk',
      name: 'Cannagenix Preroll 5pk',
      matches: (text = '') => {
        const s = text.toLowerCase();
        const isPreroll = s.includes('preroll') || s.includes('pre-roll') || s.includes('joint');
        const is5pk = s.includes('5pk') || s.includes('5-pk') || s.includes('5 pack') || s.includes('2.5g') || s.includes('2.25g');
        return isPreroll && is5pk;
      },
      category_input: 'Preroll 5pk x 0.5g',
      category: 'Flower > Prerolls'
    },
    {
      id: 'cannagenix_preroll',
      name: 'Cannagenix Preroll',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return s.includes('preroll') || s.includes('pre-roll') || s.includes('joint');
      },
      category_input: 'Preroll',
      category: 'Flower > Prerolls'
    },
    {
      id: 'cannagenix_flower',
      name: 'Cannagenix Packaged Flower',
      matches: (text = '') => {
        const s = text.toLowerCase();
        return s.includes('flower') || s.includes('bud') || s.includes('3.5g');
      },
      category_input: 'Flower',
      category: 'Flower > Bud'
    }
  ]
};
