/**
 * Camino & Kiva Confections Brand Taxonomy & Product Rules
 * Consumer edible gummies, sours, chews, and live resin lines in Alleaves POS.
 */

export const caminoTaxonomy = {
  brand: 'Camino',
  aliases: ['Camino', 'Kiva Camino', 'Kiva', 'Camino Sours', 'Camino Chews', 'Lost Farm'],
  relatedBrands: ['Camino', 'Lost Farm', 'Kiva'],

  promptGuide: [
    '- **BRAND PRODUCT LINE GUIDE FOR CAMINO / KIVA / LOST FARM**:',
    '  - **Brand Partitioning (Alleaves POS Namespaces)**:',
    '    * Standard fruit gummies -> canonical brand: "Camino", category: "Edibles > Gummies".',
    '    * Sour gummies -> canonical brand: "Camino Sours", category: "Edibles > Gummies".',
    '    * Chews -> canonical brand: "Camino Chews", category: "Edibles > Chews".',
    '    * Pouch gummies made with 100% Live Resin / Rosin -> canonical brand: "Lost Farm", category: "Edibles > Gummies".',
    '  - **Full Chemical Formulation Standard (Physical Packaging Only - No Naked Numbers)**:',
    '    * Chemical formulations/ratios in the product format and slug MUST strictly come from intentional marketing claims printed on the physical packaging. NEVER derive ratios from laboratory COA test results.',
    '    * Naked numbers (e.g. "10/10/10" or "1:1") are strictly prohibited--they are medically ambiguous. Always synthesize full cannabinoid letters:',
    '      - Blackberry Dream (Camino Sours): packaging prints 10mg THC, 10mg CBD, 10mg CBN -> product_format: "Gummies 10/10/10 - CBD/CBN/THC" (or "Gummies 1:1:1 THC/CBD/CBN").',
    '      - Sparkling Pear (Camino): packaging prints 2mg THC, 6mg CBD per serving -> product_format: "Gummies 2:6 THC/CBD", weight: "40mg".',
    '      - Midnight Blueberry (Camino): packaging prints 5mg THC, 1mg CBN -> product_format: "Gummies 5:1 THC/CBN".',
    '      - Freshly Squeezed (Camino): packaging prints 5mg THC, 10mg CBG -> product_format: "Gummies 5:10 THC/CBG".',
    '      - Boysenberry (Camino Chews): packaging prints 10mg THC, 5mg CBN, 5mg CBG -> product_format: "10:5:5 THC/CBN/CBG".',
    '    * Standard products with no minor cannabinoid ratio printed on packaging resolve to clean format with NO ratio string (e.g. "Gummies 20pk", "Live Rosin Gummies 10pk").',
    '  - **Moods & Effects on the Menu (Dispensary Menu Enhancement)**:',
    '    * Physical packaging prints marketing mood words above flavors (CHILL, SLEEP, DEEP SLEEP, SOCIAL, RECOVER, BLISS, ENERGY, UPLIFTING, EXCITE).',
    '    * To display these moods on customer menus without breaking category hierarchy, synthesize the strain as [Flavor] ([Mood]):',
    '      - "CHILL Wild Berry" -> strain: "Wild Berry (Chill)"',
    '      - "SOCIAL Sparkling Pear" -> strain: "Sparkling Pear (Social)"',
    '      - "SLEEP Midnight Blueberry" -> strain: "Midnight Blueberry (Sleep)"',
    '      - "DEEP SLEEP Blackberry Dream" -> strain: "Blackberry Dream (Deep Sleep)"',
    '      - "RECOVER Freshly Squeezed" -> strain: "Freshly Squeezed (Recover)"',
    '      - "BLISS Raspberry Lemonade" -> strain: "Raspberry Lemonade (Bliss)"',
    '      - "UPLIFTING Watermelon Spritz" -> strain: "Watermelon Spritz (Uplifting)"',
    '  - **Compliance Usable Weight Invariant**:',
    '    * Standard gummies are 100mg THC.',
    '    * Sparkling Pear is strictly 40mg THC (20pk x 2mg THC). NEVER assign 100mg to Sparkling Pear.',
    '  - **Canonical Slug Examples**:',
    '    * \'Camino | Wild Berry (Chill) | Gummies | 20pk | 100mg\'',
    '    * \'Camino | Sparkling Pear (Social) | Gummies 2:6 THC/CBD | 20pk | 40mg\'',
    '    * \'Camino | Midnight Blueberry (Sleep) | Gummies 5:1 THC/CBN | 20pk | 100mg\'',
    '    * \'Camino Sours | Blackberry Dream (Deep Sleep) | Gummies 10/10/10 - CBD/CBN/THC | 10pk | 100mg\'',
    '    * \'Lost Farm | Very Cherry x Tropicana Cherries | Live Rosin Gummies 10pk | 100mg\''
  ].join('\n'),

  productLines: [
    {
      id: 'camino_sparkling_pear',
      name: 'Sparkling Pear',
      matches: (text = '') => text.toLowerCase().includes('sparkling pear'),
      category_input: 'Gummies 2:6 THC/CBD',
      category: 'Edibles > Gummies',
      weight: '40mg'
    },
    {
      id: 'camino_chews',
      name: 'Camino Chews',
      matches: (text = '') => text.toLowerCase().includes('chew'),
      category_input: 'Chews',
      category: 'Edibles > Chews',
      weight: '100mg'
    },
    {
      id: 'camino_sours',
      name: 'Camino Sours',
      matches: (text = '') => text.toLowerCase().includes('sour'),
      category_input: 'Gummies',
      category: 'Edibles > Gummies',
      weight: '100mg'
    },
    {
      id: 'camino_gummies',
      name: 'Camino Gummies',
      matches: (text = '') => text.toLowerCase().includes('gumm') || text.toLowerCase().includes('camino'),
      category_input: 'Gummies',
      category: 'Edibles > Gummies',
      weight: '100mg'
    }
  ]
};
