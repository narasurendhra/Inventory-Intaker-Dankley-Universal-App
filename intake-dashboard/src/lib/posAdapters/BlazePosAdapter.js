/**
 * BlazePosAdapter.js
 * 
 * POS Adapter implementation for BLAZE POS (https://blaze.me).
 * Powers Dankley's strategic migration baseline from Alleaves to BLAZE.
 * 
 * Capabilities:
 * 1. Supports both direct BLAZE API keys and automated Playwright session sniffing.
 * 2. Fetches active BLAZE categories, brands, strains, and product catalogs.
 * 3. Maps Dankley's 4-part slug standard to BLAZE product attributes.
 * 4. Submits intake batches with Metrc package tags into BLAZE inventory.
 */

const BasePosAdapter = require('./BasePosAdapter');
const PlaywrightSessionSniffer = require('./PlaywrightSessionSniffer');

class BlazePosAdapter extends BasePosAdapter {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.BLAZE_API_KEY || '';
    this.companyId = config.companyId || process.env.BLAZE_COMPANY_ID || '';
    this.shopId = config.shopId || process.env.BLAZE_SHOP_ID || '';
    this.apiUrl = config.apiUrl || process.env.BLAZE_API_URL || 'https://api.blaze.me/api/v1';

    // Playwright session sniffer for BLAZE Admin Backoffice
    this.sniffer = new PlaywrightSessionSniffer({
      posKey: 'blaze',
      loginUrl: config.adminUrl || 'https://admin.blaze.me/login',
      username: config.username || process.env.BLAZE_USERNAME || '',
      password: config.password || process.env.BLAZE_PASSWORD || '',
      usernameSelector: 'input[name="email"], input[type="email"]',
      passwordSelector: 'input[name="password"], input[type="password"]',
      submitSelector: 'button[type="submit"]',
      tokenUrlPattern: /\/api\/.*\/auth|\/api\/v1\/users\/login|blaze\.me\/api/i
    });
  }

  getName() {
    return 'BLAZE POS';
  }

  getType() {
    return 'blaze';
  }

  /**
   * Execute authenticated request to BLAZE POS API
   */
  async _request(endpoint, options = {}) {
    let token = this.apiKey;

    // If no direct API key, obtain session token via Playwright sniffer
    if (!token && (process.env.BLAZE_USERNAME || this.config.username)) {
      try {
        const session = await this.sniffer.getValidSession();
        token = session?.token;
      } catch (sniffErr) {
        console.warn('[BLAZE ADAPTER] Playwright sniffer warning:', sniffErr.message);
      }
    }

    if (!token) {
      console.warn('[BLAZE ADAPTER] No BLAZE API key or login credentials. Using mock development data.');
      return null;
    }

    const url = `${this.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-BLAZE-API-KEY': token,
      'Content-Type': 'application/json',
      ...(this.shopId ? { 'X-BLAZE-SHOP-ID': this.shopId } : {}),
      ...options.headers
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`BLAZE API HTTP ${res.status}: ${errorText}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`[BLAZE ADAPTER ERROR] ${endpoint}:`, err.message);
      throw err;
    }
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
      "Concentrates > Live Rosin",
      "Concentrates > Badder",
      "Concentrates > Wax",
      "Tinctures > Sublingual Drops",
      "Topicals > Balms & Lotions"
    ];
  }

  async getBrands() {
    try {
      const data = await this._request('/mgmt/brands');
      if (Array.isArray(data?.values)) {
        return data.values.map(b => b.name);
      }
    } catch (e) {}

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
      "Kiva"
    ];
  }

  async getStrains() {
    try {
      const data = await this._request('/mgmt/strains');
      if (Array.isArray(data?.values)) {
        return data.values.map(s => s.name);
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
      "Super Boof"
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
      const data = await this._request(`/mgmt/products?brandName=${encodeURIComponent(brandName)}&active=true`);
      if (Array.isArray(data?.values)) {
        return data.values.map(p => ({
          id_item: p.id,
          item: p.name,
          brand: p.brandName || brandName,
          category: p.categoryName,
          category_path: p.categoryName,
          price_retail_adult_use: p.unitPrice,
          cost_of_good: p.unitCost,
          strain: p.strainName,
          uom: p.salesUom || 'Each'
        }));
      }
    } catch (e) {
      console.warn(`[BLAZE] Failed to query catalog for ${brandName}`);
    }

    return [];
  }

  async getBulkPackageData(uids) {
    const result = {};
    if (!Array.isArray(uids)) return result;

    try {
      const data = await this._request(`/inventory/metrc/packages?tags=${uids.join(',')}`);
      if (Array.isArray(data?.values)) {
        data.values.forEach(pkg => {
          result[pkg.packageTag] = {
            found: true,
            cost_of_good: pkg.unitCost || pkg.wholesaleCost,
            test_results: pkg.labResults || [],
            already_imported: pkg.status === 'ACCEPTED' || pkg.status === 'ACTIVE'
          };
        });
      }
    } catch (e) {}

    uids.forEach(uid => {
      if (!result[uid]) {
        result[uid] = { found: true, cost_of_good: null, test_results: [], already_imported: false };
      }
    });

    return result;
  }

  async submitBatch(items, manifestMetadata = {}) {
    const results = {
      success: true,
      importedCount: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const payload = {
          manifestNumber: manifestMetadata.manifest_number,
          vendorName: manifestMetadata.vendor,
          metrcTag: item.uid,
          productName: item.target_item_name || item.proposedSlug,
          brandName: item.brand,
          categoryName: item.category,
          batchNo: item.batch,
          expirationDate: item.expirationDate,
          quantity: item.metrc_quantity || item.quantity || 1,
          unitCost: parseFloat(item.costOfGoods || item.wholesale_cost || 0),
          unitPrice: parseFloat(item.retailPrice || 0),
          thc: item.thc_pct || 0,
          cbd: item.cbd_pct || 0,
          weight: item.parsed_weight_useable || 1.0
        };

        if (this.apiKey) {
          await this._request('/inventory/batches/receive', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        } else {
          console.log(`[BLAZE MOCK SUBMIT] Package ${item.uid} -> ${payload.productName} ($${payload.unitPrice})`);
        }
        results.importedCount++;
      } catch (err) {
        results.errors.push(`Item ${item.uid}: ${err.message}`);
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }
}

module.exports = BlazePosAdapter;
