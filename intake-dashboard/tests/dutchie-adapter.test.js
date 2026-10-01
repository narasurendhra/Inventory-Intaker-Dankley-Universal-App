const DutchiePosAdapter = require('../src/lib/posAdapters/DutchiePosAdapter');

describe('Dutchie POS Adapter Test Suite', () => {
  let dutchie;

  beforeEach(() => {
    dutchie = new DutchiePosAdapter({
      apiKey: '', // Dev mode
      locationId: 'LOC-DUTCHIE-DEV'
    });
  });

  it('correctly reports identity and type', () => {
    expect(dutchie.getName()).toBe('Dutchie POS');
    expect(dutchie.getType()).toBe('dutchie');
  });

  it('provides complete category and delivery route hierarchies', async () => {
    const categories = await dutchie.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(15);
    expect(categories).toContain('Flower > Bud');
    expect(categories).toContain('Vapes > All-in-One Vapes > Distillate');
    expect(categories).toContain('Edibles > Gummies');

    const routes = await dutchie.getDeliveryRoutes();
    expect(routes).toContain('Dried Marijuana');
    expect(routes).toContain('Edible > Solid Form');
  });

  it('submits intake batch and maps package items into Dutchie inventory payload', async () => {
    const mockItems = [
      {
        uid: '1A4120300002166000004533',
        proposedSlug: 'Cookies | Apples & Bananas x Huckleberry Gelato | Dual AIO | 2g',
        brand: 'Cookies',
        strain: 'Apples & Bananas x Huckleberry Gelato',
        category: 'Vapes > All-in-One Vapes > Distillate',
        product_format: 'Dual AIO',
        batch: 'CK-AB-HG-2G-0926',
        expirationDate: '09/26/27',
        quantity: 25,
        wholesale_cost: 35.00,
        retailPrice: '70.00',
        price_otd: 79.10,
        thc_pct: 91.02,
        parsed_weight_useable: 2.0
      },
      {
        uid: '1A4120300002166000004534',
        proposedSlug: 'Cookies | Berniehana Butter | Infused Preroll | 1g',
        brand: 'Cookies',
        strain: 'Berniehana Butter',
        category: 'Flower > Infused Prerolls',
        product_format: 'Infused Preroll',
        batch: 'CK-BB-1G-0926',
        expirationDate: '09/26/27',
        quantity: 50,
        wholesale_cost: 10.00,
        retailPrice: '20.00',
        price_otd: 22.60,
        thc_pct: 48.50,
        parsed_weight_useable: 1.0
      }
    ];

    const result = await dutchie.submitBatch(mockItems, {
      manifest_number: '0000421406',
      vendor: 'NanoCann Inc.'
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
    expect(result.errors.length).toBe(0);
  });
});
