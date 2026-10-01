/**
 * BasePosAdapter.js
 * 
 * Abstract Base Class defining the standard interface for POS integrations
 * in the Dankley Universal Inventory Intake App.
 * 
 * Any POS system (Dutchie, Alleaves, Flowhub, Treez, etc.) implements this
 * contract to seamlessly plug into the 5-minute photo intake pipeline.
 */

class BasePosAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Human-readable POS name (e.g. "Dutchie POS", "Alleaves POS")
   */
  getName() {
    throw new Error('BasePosAdapter.getName() must be implemented by subclass');
  }

  /**
   * System identifier ('dutchie' | 'alleaves' | 'mock')
   */
  getType() {
    throw new Error('BasePosAdapter.getType() must be implemented by subclass');
  }

  /**
   * Fetch active category paths available in the POS
   * @returns {Promise<string[]>} e.g. ["Flower > Bud", "Vapes > All-in-One Vapes > Distillate", ...]
   */
  async getCategories() {
    throw new Error('BasePosAdapter.getCategories() must be implemented');
  }

  /**
   * Fetch registered brands in the POS
   * @returns {Promise<string[]>}
   */
  async getBrands() {
    throw new Error('BasePosAdapter.getBrands() must be implemented');
  }

  /**
   * Fetch registered strains in the POS
   * @returns {Promise<Array<string | object>>}
   */
  async getStrains() {
    throw new Error('BasePosAdapter.getStrains() must be implemented');
  }

  /**
   * Fetch delivery compliance routes (e.g. "Dried Marijuana", "Edible > Solid Form")
   * @returns {Promise<string[]>}
   */
  async getDeliveryRoutes() {
    throw new Error('BasePosAdapter.getDeliveryRoutes() must be implemented');
  }

  /**
   * Fetch all active products in the POS for a specific brand
   * @param {string} brandName 
   * @returns {Promise<Array<{ id_item: string|number, item: string, brand: string, category: string, price_retail_adult_use?: number, cost_of_good?: number }>>}
   */
  async getBrandCatalog(brandName) {
    throw new Error('BasePosAdapter.getBrandCatalog() must be implemented');
  }

  /**
   * Pull Metrc package lab tests and historical costs for given package UIDs
   * @param {string[]} uids 24-character Metrc RFID package tags
   * @returns {Promise<Record<string, { found: boolean, cost_of_good?: number, test_results?: any[], already_imported?: boolean }>>}
   */
  async getBulkPackageData(uids) {
    throw new Error('BasePosAdapter.getBulkPackageData() must be implemented');
  }

  /**
   * Match an incoming synthesized slug against a brand's existing POS catalog
   * @param {Array<object>} brandCatalog 
   * @param {string} incomingSlug 
   * @param {boolean} isSample 
   * @param {object} itemContext 
   * @returns {object|null} Matched POS item or null if new shell required
   */
  matchCatalogItem(brandCatalog, incomingSlug, isSample, itemContext) {
    if (!Array.isArray(brandCatalog) || brandCatalog.length === 0 || !incomingSlug) return null;
    const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const incClean = clean(incomingSlug);

    // Exact slug match
    const exact = brandCatalog.find(c => clean(c.item) === incClean);
    if (exact) return exact;

    // Substring / component token matching
    const norm = s => (s || '').toLowerCase().trim();
    const incStrain = norm(itemContext?.strain);
    const incWeight = norm(itemContext?.weight);

    return brandCatalog.find(c => {
      const cNorm = norm(c.item);
      const hasStrain = incStrain && cNorm.includes(incStrain);
      const hasWeight = incWeight && cNorm.includes(incWeight);
      return hasStrain && hasWeight;
    }) || null;
  }

  /**
   * Provision, relink, and finalize intake batch into the POS
   * @param {Array<object>} items Approved intake items
   * @param {object} manifestMetadata Manifest number, vendor, license
   * @returns {Promise<{ success: boolean, importedCount: number, errors: string[] }>}
   */
  async submitBatch(items, manifestMetadata) {
    throw new Error('BasePosAdapter.submitBatch() must be implemented');
  }
}

module.exports = BasePosAdapter;
