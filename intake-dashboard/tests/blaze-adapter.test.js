const BlazePosAdapter = require('../src/lib/posAdapters/BlazePosAdapter');

describe('BLAZE POS Adapter Test Suite (Migration Baseline)', () => {
  let blaze;

  beforeEach(() => {
    blaze = new BlazePosAdapter({
      apiKey: '',
      shopId: 'SHOP_QUEENS_BLAZE'
    });
  });

  it('correctly reports identity and type', () => {
    expect(blaze.getName()).toBe('BLAZE POS');
    expect(blaze.getType()).toBe('blaze');
  });

  it('provides BLAZE categories and brands', async () => {
    const categories = await blaze.getCategories();
    expect(categories).toContain('Flower > Bud');
    expect(categories).toContain('Vapes > All-in-One Vapes > Distillate');

    const brands = await blaze.getBrands();
    expect(brands).toContain('Cookies');
    expect(brands).toContain('Eureka');
  });

  it('submits intake batch into BLAZE inventory structure', async () => {
    const mockItems = [
      {
        uid: '1A4120300002166000004533',
        proposedSlug: 'Cookies | Apples & Bananas x Huckleberry Gelato | Dual AIO | 2g',
        brand: 'Cookies',
        strain: 'Apples & Bananas x Huckleberry Gelato',
        category: 'Vapes > All-in-One Vapes > Distillate',
        batch: 'BATCH-001',
        wholesale_cost: 35.00,
        retailPrice: '0.00',
        parsed_weight_useable: 2.0
      }
    ];

    const result = await blaze.submitBatch(mockItems, {
      manifest_number: 'MANIFEST-001',
      vendor: 'Distributor LLC'
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);
  });
});
