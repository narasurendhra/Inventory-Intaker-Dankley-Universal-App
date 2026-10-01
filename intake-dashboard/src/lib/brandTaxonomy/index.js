/**
 * Central Brand Taxonomy Registry
 * Aggregates brand modules and provides:
 * - getBrandTaxonomy(brandName)
 * - getPromptInjectionForBrand(brandName)
 * - applyBrandTaxonomy(item, rawCombinedText, photoContext)
 * - listRegisteredBrands()
 */

import { timelessTaxonomy } from './brands/timeless.js';
import { claybourneTaxonomy } from './brands/claybourne.js';
import { stiiizyTaxonomy } from './brands/stiiizy.js';
import { eurekaTaxonomy } from './brands/eureka.js';
import { calypsoTaxonomy } from './brands/calypso.js';
import { runtzTaxonomy } from './brands/runtz.js';
import { preferredGardensTaxonomy } from './brands/preferred_gardens.js';
import { smartbudTaxonomy } from './brands/smartbud.js';
import { rippedTaxonomy } from './brands/ripped.js';
import { greenRevolutionTaxonomy } from './brands/green_revolution.js';
import { dooziesTaxonomy } from './brands/doozies.js';
import { dopioTaxonomy } from './brands/dopio.js';
import { dankByDefinitionTaxonomy } from './brands/dank_by_definition.js';
import { caminoTaxonomy } from './brands/camino.js';
import { flavTaxonomy } from './brands/flav.js';
import { toTheMoonTaxonomy } from './brands/to_the_moon.js';
import { cannagenixTaxonomy } from './brands/cannagenix.js';

const registeredBrands = [
  timelessTaxonomy,
  claybourneTaxonomy,
  stiiizyTaxonomy,
  eurekaTaxonomy,
  calypsoTaxonomy,
  runtzTaxonomy,
  preferredGardensTaxonomy,
  smartbudTaxonomy,
  dooziesTaxonomy,
  dopioTaxonomy,
  rippedTaxonomy,
  greenRevolutionTaxonomy,
  dankByDefinitionTaxonomy,
  caminoTaxonomy,
  flavTaxonomy,
  toTheMoonTaxonomy,
  cannagenixTaxonomy
];

const norm = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Look up brand taxonomy by exact name or alias
 */
export function getBrandTaxonomy(brandName = '') {
  if (!brandName) return null;
  const n = norm(brandName);
  if (!n) return null;
  return registeredBrands.find(b => {
    if (norm(b.brand) === n) return true;
    return (b.aliases || []).some(a => norm(a) === n);
  }) || null;
}

/**
 * Returns tailored markdown prompt guide for Gemini injection
 */
export function getPromptInjectionForBrand(brandName = '') {
  const taxonomy = getBrandTaxonomy(brandName);
  if (taxonomy && taxonomy.promptGuide) {
    return taxonomy.promptGuide.trim();
  }
  return '';
}

/**
 * Returns list of all registered brand names
 */
export function listRegisteredBrands() {
  return registeredBrands.map(b => b.brand);
}

/**
 * Returns list of all related/family brand names to cross-search in POS catalogs
 */
export function getFamilyBrands(brandName = '') {
  if (!brandName) return [];
  const taxonomy = getBrandTaxonomy(brandName);
  if (!taxonomy) return [brandName];
  if (Array.isArray(taxonomy.relatedBrands) && taxonomy.relatedBrands.length > 0) {
    return taxonomy.relatedBrands;
  }
  const set = new Set([taxonomy.brand]);
  (taxonomy.aliases || []).forEach(a => set.add(a));
  return Array.from(set);
}

/**
 * Applies deterministic downstream taxonomy rules to an item
 */
export function applyBrandTaxonomy(item, rawCombinedText = '', photoContext = '') {
  if (!item || !item.brand) return item;

  const taxonomy = getBrandTaxonomy(item.brand);
  if (!taxonomy) return item;

  // Normalize canonical brand name (e.g. "Noir" -> "Timeless", "The R Brand" -> "Runtz")
  if (typeof taxonomy.resolveSubBrand !== 'function' && norm(item.brand) !== norm(taxonomy.brand)) {
    const matchesAlias = (taxonomy.aliases || []).some(a => norm(a) === norm(item.brand));
    if (matchesAlias) {
      item.brand = taxonomy.brand;
    }
  }

  const combined = (rawCombinedText || '') + ' ' + (item.raw_item_name || '') + ' ' + (item.product_format || '') + ' ' + (item.category_input || '') + ' ' + (item.strain || '') + ' ' + (item.batch || '') + ' ' + (photoContext || '');

  // 1. Timeless Vapes Specific Resolution (Custom dual-axis hardware/formulation mapping)
  if (taxonomy.brand === 'Timeless' && typeof taxonomy.detectHardware === 'function') {
    const hardware = taxonomy.detectHardware(combined);
    let matchedLine = null;

    for (const line of taxonomy.productLines) {
      if (line.matches(combined)) {
        matchedLine = line;
        break;
      }
    }

    if (matchedLine) {
      item.category_input = matchedLine.formatSlug(hardware);
      item.category = (matchedLine.categoryMap && matchedLine.categoryMap[hardware]) || item.category;
      item.alleaves_category_path = item.category;
    }
    return item;
  }

  // 2. Processor Re-Routing (e.g. Green Revolution -> Doozies, Dopio, etc.)
  if (typeof taxonomy.resolveSubBrand === 'function') {
    const sub = taxonomy.resolveSubBrand(combined);
    if (sub) {
      item.brand = sub.brand;
      if (item.product_format) {
        item.category_input = item.product_format;
      } else if (sub.category_input) {
        item.category_input = sub.category_input;
      }
      if (sub.category) {
        item.category = sub.category;
        item.alleaves_category_path = sub.category;
      }
    }
    return item;
  }

  // 3. Generic Modular Brand Resolution (Claybourne, STIIIZY, Eureka, Calypso, Runtz, Preferred Gardens, Smartbud, Ripped, Dopio, etc.)
  if (Array.isArray(taxonomy.productLines)) {
    for (const line of taxonomy.productLines) {
      if (typeof line.matches === 'function' && line.matches(combined)) {
        if (item.product_format && !line.forceFormat) {
          item.category_input = item.product_format;
        } else {
          const resolvedInput = typeof line.category_input === 'function' ? line.category_input(combined) : line.category_input;
          if (resolvedInput) item.category_input = resolvedInput;
        }
        if (line.category) {
          const resolvedCat = typeof line.category === 'function' ? line.category(combined) : line.category;
          if (!item.category || item.category === 'Flower' || item.category === 'Edibles' || item.category === 'Vapes' || item.category === 'Unknown') {
            item.category = resolvedCat;
          }
          item.alleaves_category_path = item.category || resolvedCat;
        } else if (item.category) {
          item.alleaves_category_path = item.category;
        }
        if (line.weight && (!item.weight || (item.weight === '100mg' && line.weight.includes('pk')) || line.forceWeight)) {
          item.weight = line.weight;
        }
        break;
      }
    }
    if (item.product_format && !item.category_input) {
      item.category_input = item.product_format;
    }
    if (item.category && !item.alleaves_category_path) {
      item.alleaves_category_path = item.category;
    }
    return item;
  }

  if (item.product_format && !item.category_input) {
    item.category_input = item.product_format;
  }
  if (item.category && !item.alleaves_category_path) {
    item.alleaves_category_path = item.category;
  }
  return item;
}
