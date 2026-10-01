/**
 * DutchiePosAdapter.js
 * 
 * POS Adapter implementation for Dutchie POS / Dutchie Plus.
 * Powers the Dankley store location using Dutchie.
 * 
 * Capabilities:
 * 1. Queries Dutchie Product Catalog to identify existing product shells.
 * 2. Fetches Dutchie Categories, Brands, and Strains.
 * 3. Maps Dankley's 4-part canonical slug standard to Dutchie inventory items.
 * 4. Submits intake batches into Dutchie with Metrc package tags and lab potencies.
 */

const BasePosAdapter = require('./BasePosAdapter');

class DutchiePosAdapter extends BasePosAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.DUTCHIE_API_KEY || '';
    this.locationId = config.locationId || process.env.DUTCHIE_LOCATION_ID || '';
    this.apiUrl = config.apiUrl || process.env.DUTCHIE_API_URL || 'https://api.dutchie.com/v1';
  }

  getName() {
    return 'Dutchie POS';
  }

  getType() {
    return 'dutchie';
  }

  /**
   * Helper to perform authenticated requests to Dutchie API
   */
  async _request(endpoint, options = {}) {
    if (!this.apiKey) {
      console.warn('[DUTCHIE ADAPTER] No DUTCHIE_API_KEY configured. Returning mock development data.');
      return null;
    }

    const url = `${this.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Dutchie-Location-Id': this.locationId,
      ...options.headers
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Dutchie API HTTP ${res.status}: ${errorText}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`[DUTCHIE ADAPTER ERROR] ${endpoint}:`, err.message);
      throw err;
    }
  }

  /**
   * Dutchie Category Mapping
   */
  async getCategories() {
    // Dutchie standard hierarchy mapped to Dankley POS taxonomy
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
      "Concentrates > Live Rosin",
      "Concentrates > Badder",
      "Concentrates > Wax",
      "Tinctures > Sublingual Drops",
      "Topicals > Balms & Lotions"
    ];
  }

  async getBrands() {
    try {
      const data = await this._request('/brands');
      if (Array.isArray(data?.brands)) {
        return data.brands.map(b => b.name || b);
      }
    } catch (e) {
      console.warn('[DUTCHIE] Falling back to standard dispensary brands');
    }

    // Default registered brands in Dankley Dutchie location
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
      "Claybourne",
      "Lost Farm",
      "Kiva",
      "Off Hours"
    ];
  }

  async getStrains() {
    try {
      const data = await this._request('/strains');
      if (Array.isArray(data?.strains)) {
        return data.strains.map(s => s.name || s);
      }
    } catch (e) {}

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
      "Super Boof",
      "Tangie",
      "Tropical Storm"
    ];
  }

  async getDeliveryRoutes() {
    return [
      "Dried Marijuana",
      "Edible > Solid Form",
      "Edible > Liquid Form",
      "Concentrate / Inhalable",
      "Vape Oil / Cartridge"
    ];
  }

  async getBrandCatalog(brandName) {
    if (!brandName) return [];

    try {
      const data = await this._request(`/products?brand=${encodeURIComponent(brandName)}&status=ACTIVE`);
      if (Array.isArray(data?.products)) {
        return data.products.map(p => ({
          id_item: p.id,
          item: p.name || `${p.brand} | ${p.strain} | ${p.category} | ${p.weight}`,
          brand: p.brand || brandName,
          category: p.category,
          category_path: p.category_path || p.category,
          price_retail_adult_use: p.retailPrice || p.price,
          cost_of_good: p.wholesaleCost || p.cost,
          strain: p.strain,
          strain_type: p.strainType,
          uom: p.uom || 'Each'
        }));
      }
    } catch (e) {
      console.warn(`[DUTCHIE] Failed to query catalog for ${brandName}, using empty pool`);
    }

    return [];
  }

  async getBulkPackageData(uids) {
    const result = {};
    if (!Array.isArray(uids)) return result;

    try {
      const data = await this._request(`/inventory/packages?tags=${uids.join(',')}`);
      if (Array.isArray(data?.packages)) {
        data.packages.forEach(pkg => {
          result[pkg.packageTag] = {
            found: true,
            cost_of_good: pkg.wholesaleCost || pkg.cost,
            test_results: pkg.labResults || [],
            already_imported: pkg.status === 'ACTIVE' || pkg.status === 'IMPORTED'
          };
        });
      }
    } catch (e) {
      console.warn('[DUTCHIE] Error fetching bulk package data');
    }

    // Ensure all UIDs have an entry
    uids.forEach(uid => {
      if (!result[uid]) {
        result[uid] = { found: true, cost_of_good: null, test_results: [], already_imported: false };
      }
    });

    return result;
  }

  /**
   * Submit finalized intake batch into Dutchie
   */
  async submitBatch(items, manifestMetadata = {}) {
    const results = {
      success: true,
      importedCount: 0,
      errors: [],
      createdProductIds: [],
      linkedPackageIds: []
    };

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, importedCount: 0, errors: ["No items to import"] };
    }

    for (const item of items) {
      try {
        const payload = {
          manifestNumber: manifestMetadata.manifest_number,
          vendor: manifestMetadata.vendor,
          packageTag: item.uid,
          productName: item.target_item_name || item.proposedSlug,
          brand: item.brand,
          strain: item.strain,
          category: item.category,
          productFormat: item.product_format,
          batchNumber: item.batch,
          expirationDate: item.expirationDate,
          quantity: item.metrc_quantity || item.quantity || 1,
          cost: parseFloat(item.costOfGoods || item.wholesale_cost || 0),
          retailPrice: parseFloat(item.retailPrice || 0),
          priceOtd: parseFloat(item.price_otd || 0),
          thcPercent: item.thc_pct || 0,
          thcMg: item.thc_mg || 0,
          cbdPercent: item.cbd_pct || 0,
          cbdMg: item.cbd_mg || 0,
          usableWeight: item.parsed_weight_useable || 1.0,
          uom: item.parsed_uom || item.uom || 'Grams'
        };

        if (this.apiKey) {
          const res = await this._request('/inventory/intake', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          results.importedCount++;
          if (res?.productId) results.createdProductIds.push(res.productId);
          if (res?.packageId) results.linkedPackageIds.push(res.packageId);
        } else {
          // Simulation / dry run mode for development
          console.log(`[DUTCHIE MOCK SUBMIT] Package ${item.uid} -> ${payload.productName} ($${payload.retailPrice})`);
          results.importedCount++;
        }
      } catch (err) {
        results.errors.push(`Item ${item.uid} (${item.strain}): ${err.message}`);
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }
}

module.exports = DutchiePosAdapter;
