/**
 * MockPosAdapter.js
 * 
 * Standalone Sandbox POS Adapter for zero-dependency local testing.
 * Allows developers to run the entire 5-minute photo intake pipeline
 * without connecting to live Dutchie or Alleaves production credentials.
 */

const BasePosAdapter = require('./BasePosAdapter');

class MockPosAdapter extends BasePosAdapter {
  constructor(config = {}) {
    super(config);
    this.name = config.name || 'Dankley Sandbox POS (Mock)';
  }

  getName() {
    return this.name;
  }

  getType() {
    return 'mock';
  }

  async getCategories() {
    return [
      "Flower > Bud",
      "Flower > Infused Flower",
      "Flower > Ground Flower",
      "Flower > Prerolls",
      "Flower > Infused Prerolls",
      "Vapes > All-in-One Vapes > Distillate",
      "Vapes > All-in-One Vapes > Live Resin",
      "Vapes > All-in-One Vapes > Live Rosin",
      "Vapes > All-in-One Vapes > Liquid Diamonds",
      "Vapes > Cartridges > Distillate",
      "Vapes > Cartridges > Live Resin",
      "Vapes > Pods > Distillate",
      "Edibles > Gummies",
      "Edibles > Chocolates",
      "Edibles > Baked Goods",
      "Edibles > Beverages",
      "Edibles > Coffee",
      "Concentrates > Live Resin",
      "Concentrates > Live Rosin"
    ];
  }

  async getBrands() {
    return [
      "Cookies",
      "Eureka",
      "Camino",
      "Dank By Definition",
      "Ripped",
      "Green Revolution",
      "Dopio",
      "Doozies",
      "Flav",
      "To The Moon",
      "Stiiizy",
      "Claybourne"
    ];
  }

  async getStrains() {
    return [
      "Apples & Bananas x Huckleberry Gelato",
      "Gary Payton x Pomegranate Shake",
      "LPC 75 x Black Cherry Gelato",
      "Berniehana Butter",
      "London Pound Cake 75",
      "Triple Scoop",
      "Super Skunk",
      "Wedding Cake",
      "Cherry Thunder Fuck",
      "Super Boof"
    ];
  }

  async getDeliveryRoutes() {
    return [
      "Dried Marijuana",
      "Edible > Solid Form",
      "Edible > Liquid Form",
      "Concentrate / Inhalable"
    ];
  }

  async getBrandCatalog(brandName) {
    const mockCatalogs = {
      'Eureka': [
        { id_item: 8001, item: 'Eureka | Wedding Cake | Live Resin Starter Kit | 1g', brand: 'Eureka', price_retail_adult_use: 40.00, cost_of_good: 20.00 },
        { id_item: 8002, item: 'Eureka | Wedding Cake | Live Resin AIO | 1g', brand: 'Eureka', price_retail_adult_use: 35.00, cost_of_good: 17.50 },
        { id_item: 8003, item: 'Eureka | Wedding Cake | Live Resin Cartridge | 1g', brand: 'Eureka', price_retail_adult_use: 30.00, cost_of_good: 15.00 },
        { id_item: 8004, item: 'Eureka | Super Skunk | Live Resin Reload | 1g', brand: 'Eureka', price_retail_adult_use: 30.00, cost_of_good: 15.00 }
      ],
      'Dank By Definition': [
        { id_item: 501, item: "Dank | Cherry Thunder Fuck | Sungrown Flower 3.5g", brand: "Dank By Definition", price_retail_adult_use: 30.00, cost_of_good: 15.00 },
        { id_item: 502, item: "Dank | Gorilla Glue #4 | Sungrown Flower 3.5g", brand: "Dank By Definition", price_retail_adult_use: 30.00, cost_of_good: 15.00 },
        { id_item: 503, item: "Dank | Super Boof | Preroll 1g", brand: "Dank By Definition", price_retail_adult_use: 14.00, cost_of_good: 7.00 }
      ],
      'Camino': [
        { id_item: 701, item: "Camino | Midnight Blueberry | Gummies | 100mg", brand: "Camino", price_retail_adult_use: 18.00, cost_of_good: 9.00 },
        { id_item: 702, item: "Camino | Sparkling Pear | Gummies | 40mg", brand: "Camino", price_retail_adult_use: 18.00, cost_of_good: 9.00 },
        { id_item: 703, item: "Camino | Wild Berry | Gummies | 100mg", brand: "Camino", price_retail_adult_use: 18.00, cost_of_good: 9.00 }
      ]
    };

    return mockCatalogs[brandName] || [];
  }

  async getBulkPackageData(uids) {
    const result = {};
    (uids || []).forEach(uid => {
      result[uid] = {
        found: true,
        cost_of_good: 15.00,
        test_results: [
          { metrc_test_result: "THC%", value: "85.50" },
          { metrc_test_result: "CBD%", value: "0.20" }
        ],
        already_imported: false
      };
    });
    return result;
  }

  async submitBatch(items, manifestMetadata = {}) {
    console.log(`[MOCK POS] Finalizing batch of ${items.length} items for Manifest ${manifestMetadata.manifest_number || 'N/A'}`);
    return {
      success: true,
      importedCount: items.length,
      errors: [],
      simulated: true
    };
  }
}

module.exports = MockPosAdapter;
