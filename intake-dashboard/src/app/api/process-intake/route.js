const { NextResponse } = require('next/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const { 
  getBrandTaxonomy, 
  getPromptInjectionForBrand, 
  applyBrandTaxonomy, 
  listRegisteredBrands,
  getFamilyBrands
} = require('../../../lib/brandTaxonomy');
const { getSessionFromRequest } = require('../../../lib/auth');
const PosAdapterFactory = require('../../../lib/posAdapters/PosAdapterFactory');
const GeminiProvider = require('../../../lib/ai/geminiProvider');

const maxDuration = 300;

// Helper: Title-case strings, preserving cannabis acronyms
const toTitleCase = (s) => {
  if (!s || typeof s !== 'string') return '';
  if (s === s.toUpperCase() && /[A-Z]{3,}/.test(s)) {
    return s.replace(/[A-Za-z0-9#]+/g, (w) => {
      const upper = w.toUpperCase();
      if (['OG', 'CBD', 'THC', 'BX', 'RS11', 'GG4', 'AIO'].includes(upper)) return upper;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
  }
  return s;
};

// Helper: Resilient JSON parser for LLM responses
const safeJsonParse = (text) => {
  if (!text || typeof text !== 'string') return {};
  let clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(clean);
  } catch (err) {
    let repaired = clean
      .replace(/([^\s{}[\],])\s*\n\s*,\s*\{/g, '$1\n    },\n    {')
      .replace(/([^\s{}[\],])\s*\n\s*\{/g, '$1,\n    {')
      .replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(repaired);
  }
};

// Helper: Normalize string for comparison
const norm = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');

// Helper: Canonical 5-tier strain classification and normalization matching STRAIN_TYPE_GUIDELINES.md
const normalizeStrainClassification = (rawText, rawIndicaPct, rawSativaPct) => {
  if (typeof rawText === 'number') {
    const idMap = { 1: ["Indica", 1, 100, 0], 2: ["Sativa", 2, 0, 100], 3: ["Hybrid", 3, 50, 50], 4: ["Indica Leaning Hybrid", 4, 75, 25], 5: ["Sativa Leaning Hybrid", 5, 25, 75] };
    if (idMap[rawText]) return { strainType: idMap[rawText][0], id_strain_type: idMap[rawText][1], pctIndica: idMap[rawText][2], pctSativa: idMap[rawText][3] };
  }
  const normText = (rawText || '').toString().toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const toP = v => (v != null && !isNaN(Number(v))) ? (Number(v) <= 1 && Number(v) > 0 ? Math.round(Number(v) * 100) : (Number(v) > 100 ? Math.min(100, Math.max(0, Math.round(Number(v) / 100))) : Math.min(100, Math.max(0, Math.round(Number(v)))))) : NaN;
  const iNum = toP(rawIndicaPct), sNum = toP(rawSativaPct);
  const hasNums = !isNaN(iNum) && !isNaN(sNum);
  const is5050 = iNum === 50 && sNum === 50, hasExplicit = normText && normText !== 'hybrid';
  if (hasNums && (!is5050 || !hasExplicit)) {
    if (iNum === 100 && sNum === 0) return { strainType: "Indica", id_strain_type: 1, pctIndica: 100, pctSativa: 0 };
    if (sNum === 100 && iNum === 0) return { strainType: "Sativa", id_strain_type: 2, pctIndica: 0, pctSativa: 100 };
    if (iNum >= 60) return { strainType: "Indica Leaning Hybrid", id_strain_type: 4, pctIndica: iNum, pctSativa: sNum };
    if (sNum >= 60) return { strainType: "Sativa Leaning Hybrid", id_strain_type: 5, pctIndica: iNum, pctSativa: sNum };
    return { strainType: "Hybrid", id_strain_type: 3, pctIndica: 50, pctSativa: 50 };
  }
  if (normText.includes('sativa') && (normText.includes('lean') || normText.includes('dom') || normText.includes('hybrid'))) return { strainType: "Sativa Leaning Hybrid", id_strain_type: 5, pctIndica: 25, pctSativa: 75 };
  if (normText.includes('indica') && (normText.includes('lean') || normText.includes('dom') || normText.includes('hybrid'))) return { strainType: "Indica Leaning Hybrid", id_strain_type: 4, pctIndica: 75, pctSativa: 25 };
  if (normText === 'indica' || normText === 'i') return { strainType: "Indica", id_strain_type: 1, pctIndica: 100, pctSativa: 0 };
  if (normText === 'sativa' || normText === 's') return { strainType: "Sativa", id_strain_type: 2, pctIndica: 0, pctSativa: 100 };
  return { strainType: "Hybrid", id_strain_type: 3, pctIndica: 50, pctSativa: 50 };
};

// Helper: Parse numerical mass from string (supports both grams and milligrams)
const parseMass = (s) => {
  if (!s) return null;
  const mg = s.match(/\|\s*(\d+(?:\.\d+)?)\s*mg\b/i) || s.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  if (mg) return parseFloat(mg[1]);
  const g = s.match(/\|\s*(\d+(?:\.\d+)?)\s*g\b/i) || [...s.matchAll(/(\d+(?:\.\d+)?)\s*g\b/gi)].pop();
  return g ? parseFloat(g[1]) : null;
};

// Helper: Extract pack count
const extractPackCount = (str = '') => {
  const s = str.toString().toLowerCase();
  const m = s.match(/(\d+)\s*(?:pk|pack|count|ct|ea|pieces|pcs)\b/i) || s.match(/(\d+)\s*x\s*\d+/i);
  return m ? parseInt(m[1], 10) : (s.includes('2pk') || s.includes('2-pk') ? 2 : (s.includes('5pk') ? 5 : 1));
};

const LEAF_MAP = { Grounded: 'Ground Flower', 'Infused Grounded Flower': 'Infused Ground Flower', Bud: 'Flower' };

// Helper: Normalizes commercial product format (slug Part 3) with AI Decision Sovereignty
const normalizeProductFormat = (fmt = '', category = '', rawItemName = '') => {
  let val = (fmt || (category ? category.split('>').pop() : '') || rawItemName || 'Product').trim();
  if (val.includes('>')) val = val.split('>').pop().trim();
  val = LEAF_MAP[val] || val;
  return val.includes(',') ? [...new Set(val.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' '))].join(' ') : val;
};

// Helper: Check if item category is unit-dosed (edibles, tinctures, topicals, capsules)
const isUnitDosed = (cat = '', fmt = '') => {
  const c = `${cat || ''} ${fmt || ''}`.toLowerCase();
  return c.includes('edible') || c.includes('gumm') || c.includes('chocolat') || c.includes('beverage') || c.includes('coffee') || c.includes('tincture') || c.includes('capsule');
};

// Helper: Auto-assign state delivery compliance route
const autoAssignDeliveryRoute = (category = '', format = '') => {
  const c = `${category || ''} ${format || ''}`.toLowerCase();
  if (c.includes('beverage') || c.includes('liquid') || c.includes('drink') || c.includes('coffee')) return "Edible > Liquid Form";
  if (c.includes('edible') || c.includes('gumm') || c.includes('chocolat') || c.includes('capsule')) return "Edible > Solid Form";
  if (c.includes('vape') || c.includes('cartridge') || c.includes('pod') || c.includes('aio')) return "Vape Oil / Cartridge";
  if (c.includes('concentrate') || c.includes('rosin') || c.includes('resin') || c.includes('badder') || c.includes('wax')) return "Concentrate / Inhalable";
  return "Dried Marijuana";
};

// Helper: Extract vape hardware subtype to prevent false relinking across hardware shells
const getHardwareSubtype = (itemOrSlug) => {
  const str = (typeof itemOrSlug === 'string' ? itemOrSlug : (itemOrSlug?.item || itemOrSlug?.proposedSlug || '')).toLowerCase();
  if (str.includes('starter kit') || str.includes('starterkit')) return 'starter_kit';
  if (str.includes('reload') || str.includes('pod')) return 'pod';
  if (str.includes('cartridge') || str.includes('cart') || str.includes('510')) return str.includes('battery') ? 'battery' : 'cartridge';
  if (str.includes('aio') || str.includes('disposable') || str.includes('all-in-one') || str.includes('all in one')) return 'aio';
  if (str.includes('battery') || str.includes('device')) return 'battery';
  return 'standard';
};

// Helper: Hardware conflict detection
const isHardwareConflict = (incomingSlug, candidateSlug) => {
  const inc = getHardwareSubtype(incomingSlug);
  const cand = getHardwareSubtype(candidateSlug);
  if (inc === 'standard' || cand === 'standard') return false;
  return inc !== cand;
};

// POS Catalog Matcher with Hardware, Edible & Sample Conflict Isolation
const matchPosCatalog = (brandCatalog, proposedSlug, isSample = false, itemContext = {}) => {
  if (!Array.isArray(brandCatalog) || brandCatalog.length === 0 || !proposedSlug) return null;
  const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const incClean = clean(proposedSlug);

  // Exact slug match
  const exact = brandCatalog.find(c => {
    if (clean(c.item) !== incClean) return false;
    const catIsSample = (c.item || '').toLowerCase().includes('sample');
    if (Boolean(isSample) !== catIsSample) return false;
    if (isHardwareConflict(proposedSlug, c.item)) return false;
    return true;
  });
  if (exact) return exact;

  // Substring fallback with hardware isolation
  const norm = s => (s || '').toLowerCase().trim();
  const incStrain = norm(itemContext?.strain);
  const incWeight = norm(itemContext?.weight);

  return brandCatalog.find(c => {
    const cNorm = norm(c.item);
    const catIsSample = cNorm.includes('sample');
    if (Boolean(isSample) !== catIsSample) return false;
    if (isHardwareConflict(proposedSlug, c.item)) return false;
    const hasStrain = incStrain && cNorm.includes(incStrain);
    const hasWeight = incWeight && cNorm.includes(incWeight);
    return hasStrain && hasWeight;
  }) || null;
};

// Helper: Check if a strain exists in POS database
const checkTargetStrainExists = (strainName, brandName, liveStrains = [], brandCatalog = []) => {
  if (!strainName) return false;
  const sNorm = norm(strainName), bNorm = norm(brandName);
  const inLive = (liveStrains || []).some(s => {
    const str = typeof s === 'string' ? s : (s.strain || s.name || '');
    const cleanStr = norm(str);
    return cleanStr === sNorm || cleanStr === norm(`${strainName} (${brandName})`) || cleanStr === norm(`${strainName} ${brandName}`);
  });
  if (inLive) return true;
  return (brandCatalog || []).some(c => {
    const itemNorm = norm(c.item || '');
    return itemNorm.includes(sNorm) && (!bNorm || itemNorm.includes(bNorm));
  });
};

async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const locationId = session?.locationId || request.nextUrl.searchParams.get('locationId') || 'sandbox';
    const posAdapter = PosAdapterFactory.getAdapter(locationId);

    const body = await request.json();
    const { sessionId, images = [] } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    const tempDir = path.resolve(process.cwd(), 'temp_sessions');
    let sessionFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir).filter(f => f.startsWith(sessionId)) : [];

    // Stage 1: Load Manifest OCR Texts
    const manifestFiles = sessionFiles.filter(f => f.includes('_manifest_ocr_'));
    let manifestOcrText = "";
    manifestFiles.sort().forEach(file => {
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(tempDir, file), 'utf8'));
        if (parsed.ocrText) manifestOcrText += parsed.ocrText + "\n--- PAGE BREAK ---\n";
      } catch (err) {}
    });

    // Fail-fast if no manifest detected
    if (!manifestOcrText.trim()) {
      return NextResponse.json({
        error: "No Metrc manifest pages detected in uploaded photos. Please include clear photos of the printed paper manifest."
      }, { status: 400 });
    }

    // Stage 2: Load Physical Packaging Extractions
    const packagingFiles = sessionFiles.filter(f => f.includes('_product_') && f.endsWith('.json'));
    const cleanPackaging = [];
    packagingFiles.forEach(file => {
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(tempDir, file), 'utf8'));
        if (parsed && typeof parsed === 'object') cleanPackaging.push(parsed);
      } catch (err) {}
    });

    const activeModelName = session?.aiModel || process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.5-flash';
    const genAiClient = GeminiProvider.getClient(locationId);
    
    // Fallback if no Gemini API key configured
    if (!genAiClient) {
      console.warn('[PROCESS-INTAKE] Running in offline / mock mode: Generating mock synthesized items.');
      return NextResponse.json({
        manifest_number: "MANIFEST-MOCK-001",
        vendor: "Dankley Distribution Sandbox",
        posName: posAdapter.getName(),
        posType: posAdapter.getType(),
        items: []
      });
    }

    // Stage 1 Manifest Extraction
    const manifestModel = genAiClient.getGenerativeModel({
      model: activeModelName,
      generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
    });

    const stage1Prompt = `Extract Metrc manifest line items into JSON:
${manifestOcrText}
Return schema: {"manifest_number": string, "vendor": string, "items": [{"line_number": number, "uid": string, "brand": string, "raw_item_name": string, "strain": string, "weight": string, "quantity": number, "wholesale_cost": number, "costOfGoods": number, "source_package_uid": string, "batch": string}]}`;

    // Concurrently fetch POS master registries and run Stage 1
    const [stage1Res, liveCategories, liveBrands, liveStrains] = await Promise.all([
      manifestModel.generateContent(stage1Prompt),
      posAdapter.getCategories().catch(() => []),
      posAdapter.getBrands().catch(() => []),
      posAdapter.getStrains().catch(() => [])
    ]);

    const stage1Parsed = safeJsonParse(stage1Res.response.text());

    // Assemble Brand Guides
    const combinedContext = `${manifestOcrText} ${JSON.stringify(stage1Parsed)} ${JSON.stringify(cleanPackaging)}`.toLowerCase();
    const brandGuides = listRegisteredBrands().map(b => {
      const tax = getBrandTaxonomy(b);
      return (tax && (combinedContext.includes(b.toLowerCase()) || (tax.aliases || []).some(a => combinedContext.includes(a.toLowerCase())))) ? getPromptInjectionForBrand(b) : null;
    }).filter(Boolean);

    // Stage 3 Master Judge AI Synthesizer
    const stage3Prompt = `You are the Master Intake Synthesizer (Stage 3 Judge AI) for Dankley Cannabis Dispensaries.
Synthesize the manifest line items and physical product packaging into canonical retail products.

1. Preserve exact dual-chamber strain names and lineages (e.g. "Apples & Bananas x Huckleberry Gelato" -> Sativa Leaning Hybrid 75% Sativa / 25% Indica).
2. For high-potency inhalables (>85% THC) without explicit Live Resin claims, default to Distillate.
3. Prioritize certified compliance sticker lab decimals over rounded marketing integers.
4. Output 1:1 items matching Stage 1 manifest line items.

${brandGuides.length > 0 ? `\nBrand Guides:\n${brandGuides.join('\n\n')}\n` : ''}

Stage 1 Manifest:
${JSON.stringify(stage1Parsed)}

Stage 2 Packaging Extractions:
${JSON.stringify(cleanPackaging)}

Return JSON: {"manifest_number": string, "vendor": string, "items": [{"line_number": number, "uid": string, "batch": string, "expirationDate": string, "brand": string, "strain": string, "strain_type": string, "pctSativa": number, "pctIndica": number, "category": string, "product_format": string, "weight": string, "parsed_weight_useable": number, "parsed_uom": string, "servings": number, "dosage_recommended": string, "metrc_quantity": number, "wholesale_cost": number, "costOfGoods": number, "thc_pct": number, "thc_mg": number, "cbd_pct": number, "cbd_mg": number}]}`;

    const judgeModel = genAiClient.getGenerativeModel({
      model: activeModelName,
      generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
    });
    const judgeRes = await judgeModel.generateContent(stage3Prompt);
    const synthesized = safeJsonParse(judgeRes.response.text());

    // Fetch Brand Catalogs and Package Data via POS Adapter
    const uniqueBrands = [...new Set((synthesized.items || []).map(i => i.brand).filter(Boolean))];
    const brandCatalogs = {};
    await Promise.all(uniqueBrands.map(async b => {
      brandCatalogs[b] = await posAdapter.getBrandCatalog(b).catch(() => []);
    }));

    const uids = (synthesized.items || []).map(i => i.uid).filter(Boolean);
    const bulkPackageMap = await posAdapter.getBulkPackageData(uids).catch(() => ({}));

    // Normalize and bind items to POS schema
    const finalizedItems = (synthesized.items || []).map((item, idx) => {
      const stage1Item = (stage1Parsed.items || []).find(s => s.line_number === item.line_number || s.uid === item.uid) || {};
      const mcpPkg = bulkPackageMap[item.uid] || {};
      const brandCatalog = brandCatalogs[item.brand] || [];

      // Build Proposed Slug
      const isEdible = (item.category || '').toLowerCase().includes('edible');
      const isSample = Boolean(item.isSample || (item.wholesale_cost <= 0.05 && item.wholesale_cost > 0));
      const nominalWeight = item.weight || (isEdible ? '100mg' : '1g');
      const formatPart = item.product_format || (isEdible ? 'Gummies' : 'Flower');
      const baseSlug = `${item.brand || 'Dankley'} | ${item.strain} | ${formatPart} | ${nominalWeight}`;
      item.proposedSlug = isSample ? `${baseSlug} | Sample` : baseSlug;

      // POS Catalog Auto-Match
      const matchedPos = matchPosCatalog(brandCatalog, item.proposedSlug, isSample, item);
      item.target_item_exists = Boolean(matchedPos);
      item.target_item_id = matchedPos?.id_item || null;
      item.target_item_name = matchedPos?.item || item.proposedSlug;

      // Strict Retail Pricing Invariant: New shells default to "0.00"; existing items inherit POS price
      item.retailPrice = matchedPos ? String(matchedPos.price_retail_adult_use || matchedPos.price || "0.00") : "0.00";
      const rawRetailNum = parseFloat(item.retailPrice || 0);
      item.price_otd = (!isNaN(rawRetailNum) && rawRetailNum > 0) ? Number((rawRetailNum * 1.13).toFixed(2)) : 0.00;

      // Financials
      item.costOfGoods = String(stage1Item.wholesale_cost || item.wholesale_cost || mcpPkg.cost_of_good || 0.00);
      item.wholesale_cost = parseFloat(item.costOfGoods) || 0;

      // Compliance Weights
      if (isUnitDosed(item.category, item.product_format)) {
        item.uom_weight_useable = "Milligrams";
        item.parsed_weight_useable = item.thc_mg || (item.thc_pct > 0 ? item.thc_pct : 100);
      } else {
        item.uom_weight_useable = "Grams";
        item.parsed_weight_useable = parseMass(item.weight) || 1.0;
      }

      item.delivery_route = autoAssignDeliveryRoute(item.category, item.product_format);
      return item;
    });

    return NextResponse.json({
      manifest_number: synthesized.manifest_number || stage1Parsed.manifest_number,
      vendor: synthesized.vendor || stage1Parsed.vendor,
      posName: posAdapter.getName(),
      posType: posAdapter.getType(),
      items: finalizedItems
    });
  } catch (error) {
    console.error('[PROCESS-INTAKE ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

module.exports = {
  POST,
  maxDuration,
  toTitleCase,
  safeJsonParse,
  norm,
  normalizeStrainClassification,
  parseMass,
  extractPackCount,
  normalizeProductFormat,
  isUnitDosed,
  autoAssignDeliveryRoute,
  getHardwareSubtype,
  isHardwareConflict,
  matchPosCatalog,
  checkTargetStrainExists
};
