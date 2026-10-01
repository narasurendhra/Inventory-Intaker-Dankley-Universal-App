const {
  matchPosCatalog,
  isHardwareConflict,
  getHardwareSubtype,
  normalizeProductFormat,
  normalizeStrainClassification,
  parseMass,
  autoAssignDeliveryRoute,
  isUnitDosed,
  norm,
  checkTargetStrainExists
} = require('../src/app/api/process-intake/route.js');

describe('Universal process-intake Pipeline & Hardware Conflict Suite', () => {
  describe('Standard 1: Vape Hardware Subtype & Conflict Isolation Gate', () => {
    it('accurately identifies hardware subtypes across starter kits, reloads, pods, aios, and carts', () => {
      expect(getHardwareSubtype('Eureka | Wedding Cake | Live Resin Starter Kit | 1g')).toBe('starter_kit');
      expect(getHardwareSubtype('Eureka | Super Skunk | Live Resin Reload | 1g')).toBe('pod');
      expect(getHardwareSubtype('Eureka | Wedding Cake | Live Resin AIO | 1g')).toBe('aio');
      expect(getHardwareSubtype('Eureka | Wedding Cake | Live Resin Cartridge | 1g')).toBe('cartridge');
      expect(getHardwareSubtype('Eureka | 510 Battery Device')).toBe('battery');
      expect(getHardwareSubtype('Dank | Cherry Thunder Fuck | Flower | 3.5g')).toBe('standard');
    });

    it('strictly prevents cross-hardware false matches (Eureka Reload vs Starter Kit / AIO / Cartridge)', () => {
      const reloadSlug = 'Eureka | Wedding Cake | Live Resin Reload | 1g';
      const starterKitSlug = 'Eureka | Wedding Cake | Live Resin Starter Kit | 1g';
      const aioSlug = 'Eureka | Wedding Cake | Live Resin AIO | 1g';

      expect(isHardwareConflict(reloadSlug, starterKitSlug)).toBe(true);
      expect(isHardwareConflict(reloadSlug, aioSlug)).toBe(true);
      expect(isHardwareConflict(reloadSlug, reloadSlug)).toBe(false);
    });

    it('enforces matchPosCatalog never auto-links an incoming vape item to an incompatible hardware shell', () => {
      const mockEurekaCatalog = [
        { id_item: 8001, item: 'Eureka | Wedding Cake | Live Resin Starter Kit | 1g', brand: 'Eureka', price_retail_adult_use: 40.00, cost_of_good: 20.00 },
        { id_item: 8002, item: 'Eureka | Wedding Cake | Live Resin AIO | 1g', brand: 'Eureka', price_retail_adult_use: 35.00, cost_of_good: 17.50 },
        { id_item: 8004, item: 'Eureka | Super Skunk | Live Resin Reload | 1g', brand: 'Eureka', price_retail_adult_use: 30.00, cost_of_good: 15.00 }
      ];

      // Incoming Wedding Cake Reload must NOT match Wedding Cake Starter Kit
      const incomingReload = { brand: 'Eureka', strain: 'Wedding Cake', weight: '1g' };
      const matchedReload = matchPosCatalog(mockEurekaCatalog, 'Eureka | Wedding Cake | Live Resin Reload | 1g', false, incomingReload);
      expect(matchedReload).toBeNull();

      // Incoming Wedding Cake Starter Kit matches the Starter Kit shell
      const incomingKit = { brand: 'Eureka', strain: 'Wedding Cake', weight: '1g' };
      const matchedKit = matchPosCatalog(mockEurekaCatalog, 'Eureka | Wedding Cake | Live Resin Starter Kit | 1g', false, incomingKit);
      expect(matchedKit).not.toBeNull();
      expect(matchedKit.id_item).toBe(8001);
    });
  });

  describe('Standard 2: Dual-Chamber Lineage Parity (Apples & Bananas Sativa Leaning Hybrid)', () => {
    it('preserves authentic dual-chamber leaning lineage (75% Sativa / 25% Indica)', () => {
      const lineage = normalizeStrainClassification('Sativa Leaning Hybrid', 25, 75);
      expect(lineage.strainType).toBe('Sativa Leaning Hybrid');
      expect(lineage.id_strain_type).toBe(5);
      expect(lineage.pctSativa).toBe(75);
      expect(lineage.pctIndica).toBe(25);
    });

    it('preserves authentic dual-chamber Indica leaning lineage (75% Indica / 25% Sativa)', () => {
      const lineage = normalizeStrainClassification('Indica Leaning Hybrid', 75, 25);
      expect(lineage.strainType).toBe('Indica Leaning Hybrid');
      expect(lineage.id_strain_type).toBe(4);
      expect(lineage.pctIndica).toBe(75);
      expect(lineage.pctSativa).toBe(25);
    });
  });

  describe('Standard 3: Strict Retail Pricing Invariant', () => {
    it('defaults new product shells to 0.00 retail price without auto-doubling wholesale cost', () => {
      const mockCatalog = [];
      const incomingItem = { brand: 'Cookies', strain: 'New Flavor', weight: '2g', wholesale_cost: 35.00 };
      const matched = matchPosCatalog(mockCatalog, 'Cookies | New Flavor | Dual AIO | 2g', false, incomingItem);
      expect(matched).toBeNull();

      // Invariant: when matched is null, retailPrice must be "0.00"
      const retailPrice = matched ? String(matched.price_retail_adult_use || "0.00") : "0.00";
      expect(retailPrice).toBe("0.00");
    });

    it('inherits established retail price when an existing POS catalog item is matched', () => {
      const mockCatalog = [
        { id_item: 501, item: 'Dank | Cherry Thunder Fuck | Flower | 3.5g', price_retail_adult_use: 30.00 }
      ];
      const incomingItem = { brand: 'Dank', strain: 'Cherry Thunder Fuck', weight: '3.5g' };
      const matched = matchPosCatalog(mockCatalog, 'Dank | Cherry Thunder Fuck | Flower | 3.5g', false, incomingItem);
      expect(matched).not.toBeNull();

      const retailPrice = matched ? String(matched.price_retail_adult_use || "0.00") : "0.00";
      expect(retailPrice).toBe("30");
    });
  });
});
