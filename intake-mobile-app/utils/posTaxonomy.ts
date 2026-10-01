export const extractSlugString = (itemOrSlug: any): string => {
  if (!itemOrSlug) return '';
  if (typeof itemOrSlug === 'string') return itemOrSlug;
  return itemOrSlug.item || itemOrSlug.slug || itemOrSlug.name || itemOrSlug.item_name || '';
};

export const parseMass = (s: string = ''): number | null => {
  if (!s) return null;
  const mgMatch = s.match(/\|\s*(\d+(?:\.\d+)?)\s*mg\b/i) || s.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  if (mgMatch) return parseFloat(mgMatch[1]);
  const pipeMatch = s.match(/\|\s*(\d+(?:\.\d+)?)\s*g\b/i);
  if (pipeMatch) return parseFloat(pipeMatch[1]);
  const allG = [...s.matchAll(/(\d+(?:\.\d+)?)\s*g\b/gi)];
  if (allG.length > 0) return parseFloat(allG[allG.length - 1][1]);
  return null;
};

export const extractPackCount = (str: any): number => {
  if (!str) return 1;
  const s = str.toString().toLowerCase();
  if (/\b2\s*(?:pk|pack|x1g)|orgf2|multi\s*pod/i.test(s)) return 2;
  if (/\b5\s*(?:pk|pack)/i.test(s)) return 5;
  const match = s.match(/\b(\d+)\s*(?:pk|ea|count|ct|pack|pieces|pcs)\b/i) || s.match(/\b(\d+)\s*x\s*\d/i);
  return match ? parseInt(match[1], 10) : 1;
};

export const KNOWN_SERIES_TOKENS = ['dna', 'exotics', 'livest', 'classic', 'select', 'reserve', 'allinone', 'aio', 'distillate', 'liveresin', 'liverosin', 'curedresin'];

export const isStrainContradiction = (incomingStrain: string = '', catalogSlug: string = ''): boolean => {
  if (!incomingStrain) return false;
  const normalize = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const normIn = normalize(incomingStrain);
  if (normIn.length < 3 || KNOWN_SERIES_TOKENS.includes(normIn)) return false;

  const normCat = normalize(catalogSlug);
  if (normCat.includes(normIn)) return false;

  const parts = (catalogSlug || '').split('|').map(p => p.trim());
  let candidateCatStrain = '';
  if (parts.length >= 3 && KNOWN_SERIES_TOKENS.includes(normalize(parts[1]))) {
    candidateCatStrain = normalize(parts[2]);
  } else if (parts.length >= 2) {
    candidateCatStrain = normalize(parts[1]);
  }

  if (candidateCatStrain && candidateCatStrain.length >= 3 && !KNOWN_SERIES_TOKENS.includes(candidateCatStrain)) {
    if (!candidateCatStrain.includes(normIn) && !normIn.includes(candidateCatStrain)) {
      return true;
    }
  }
  return false;
};

export const getExtractType = (text: string = ''): string => {
  const s = (text || '').toLowerCase();
  const hasLiveRosin = s.includes('live rosin') || s.includes('liverosin') || s.includes('rosin');
  const hasLiveResin = s.includes('live resin') || s.includes('liveresin');
  const hasCuredResin = s.includes('cured resin') || s.includes('cured hash') || s.includes('cured');
  const hasLiquidDiamonds = s.includes('liquid diamond') || s.includes('liquid diamonds') || s.includes('diamond');
  const hasDistillate = s.includes('distillate') || s.includes('disty');

  if (hasLiveRosin) return 'live_rosin';
  if (hasLiveResin && hasLiquidDiamonds) return 'live_resin_liquid_diamonds';
  if (hasCuredResin && hasLiquidDiamonds) return 'cured_resin_liquid_diamonds';
  if (hasLiveResin) return 'live_resin';
  if (hasCuredResin) return 'cured_resin';
  if (hasLiquidDiamonds) return 'liquid_diamonds';
  if (hasDistillate) return 'distillate';
  return 'standard';
};

export const isExtractCompatible = (incomingText: string = '', catalogText: string = ''): boolean => {
  const inExtract = getExtractType(incomingText);
  const catExtract = getExtractType(catalogText);
  return inExtract === 'standard' || catExtract === 'standard' || inExtract === catExtract;
};

export const getHardwareSubtype = (str: string = ''): string => {
  const s = (str || '').toLowerCase();
  return /starter\s*kit/.test(s) ? 'starter_kit' : /reload/.test(s) ? 'reload' : /aio|dispos|all-in-one|all in one/.test(s) ? 'aio' : /pod/.test(s) ? 'pod' : /cart|cartridge/.test(s) ? 'cartridge' : /battery|device|power bank/.test(s) ? 'battery' : 'standard';
};

export const isHardwareConflict = (s1: string = '', s2: string = ''): boolean => {
  const h1 = getHardwareSubtype(s1), h2 = getHardwareSubtype(s2);
  if (h1 !== 'standard' && h2 !== 'standard') return !((h1 === h2) || (h1 === 'reload' && h2 === 'pod') || (h1 === 'pod' && h2 === 'reload'));
  const isDab = (s: string) => /badder|budder|wax|shatter|sauce|sugar|hash|rosin|cured resin|live resin/.test((s || '').toLowerCase());
  return (h1 !== 'standard' && isDab(s2)) || (h2 !== 'standard' && isDab(s1));
};

export const extractRatio = (str: string = ''): string | null => {
  if (!str) return null;
  const match = str.match(/\b(\d+(?:\.\d+)?(?:[:/]\d+(?:\.\d+)?){1,2})(?:\s*[-:]?\s*([A-Za-z/]+))?\b/i);
  if (!match) return null;
  const digits = match[1].replace(/\//g, ':');
  const cannabinoids = match[2] ? match[2].toUpperCase().replace(/[^A-Z]/g, '') : '';
  return cannabinoids ? `${digits}-${cannabinoids}` : digits;
};

export const isRatioConflict = (s1: string = '', s2: string = ''): boolean => {
  const r1 = extractRatio(s1);
  const r2 = extractRatio(s2);
  if (r1 && r2) {
    const d1 = r1.split('-')[0];
    const d2 = r2.split('-')[0];
    if (d1 !== d2) return true;
    const c1 = r1.split('-')[1];
    const c2 = r2.split('-')[1];
    if (c1 && c2 && c1 !== c2) return true;
    return false;
  }
  if ((r1 && !r2) || (!r1 && r2)) return true;
  return false;
};

export const getEdibleSubtype = (str: string = ''): string => {
  const s = (str || '').toLowerCase();
  if (s.includes('belt')) return 'gummy_belt';
  if ((s.includes('mega') || s.includes('2pk') || s.includes('2 piece')) && s.includes('ring')) return 'mega_gummy_ring';
  if (s.includes('ring')) return 'gummy_ring';
  if (s.includes('gummy') || s.includes('gummies') || s.includes('chew') || s.includes('chews')) return 'gummy';
  if (s.includes('chocolate') || s.includes('bar') || s.includes('bite') || s.includes('bites') || s.includes('terra')) return 'chocolate';
  if (s.includes('tincture') || s.includes('drops')) return 'tincture';
  const coffee = ['espresso', 'latte', 'mocha', 'cappuccino', 'americano', 'macchiato', 'cold brew'].find(c => s.includes(c));
  if (coffee) return `coffee_${coffee.replace(/\s+/g, '_')}`;
  if (s.includes('coffee')) return 'coffee';
  return ['beverage', 'seltzer', 'drink', 'soda', 'tonic', 'lemonade', 'punch'].some(k => s.includes(k)) ? 'beverage' : 'standard';
};

export const isEdibleConflict = (s1: string = '', s2: string = ''): boolean => {
  const e1 = getEdibleSubtype(s1);
  const e2 = getEdibleSubtype(s2);
  if (e1 === 'standard' || e2 === 'standard') return false;
  return e1 !== e2;
};

export const isConcentrateVsVapeConflict = (s1: string = '', s2: string = ''): boolean => {
  const isV = (s: string) => /aio|all-in-one|dispos|cart|pod|reload|\bvapes?\b/i.test(s || '');
  const isC = (s: string) => /badder|budder|wax|shatter|sauce|sugar|hash|rosin|cured resin|live resin/i.test(s || '');
  const v1 = isV(s1), v2 = isV(s2);
  const c1 = isC(s1) && !v1, c2 = isC(s2) && !v2;
  return (v1 && c2) || (v2 && c1);
};

export const getFlowerSubtype = (str: string = ''): string => {
  const s = (str || '').toLowerCase();
  if (s.includes('smalls') || s.includes('minis') || s.includes('little') || s.includes('littles') || s.includes('popcorn') || s.includes('baby buds')) return 'smalls';
  if (s.includes('infused') && (s.includes('ground') || s.includes('shake') || s.includes('pre-ground') || s.includes('preground'))) return 'infused_ground_flower';
  if (s.includes('shake') || s.includes('trim') || s.includes('ground flower') || s.includes('ground') || s.includes('pre-ground') || s.includes('preground')) return 'shake';
  if (s.includes('infused flower') || s.includes('infused bud') || s.includes('moonrock') || s.includes('snowball')) return 'infused_flower';
  return 'bud';
};

export const isFlowerSubtypeConflict = (s1: string = '', s2: string = ''): boolean => {
  const f1 = getFlowerSubtype(s1);
  const f2 = getFlowerSubtype(s2);
  return f1 !== f2;
};

export const isInfusedFlowerConflict = (s1: string = '', s2: string = ''): boolean => {
  const isInf1 = s1.toLowerCase().includes('infused flower') || s1.toLowerCase().includes('moonrock') || s1.toLowerCase().includes('snowball');
  const isInf2 = s2.toLowerCase().includes('infused flower') || s2.toLowerCase().includes('moonrock') || s2.toLowerCase().includes('snowball');
  return isInf1 !== isInf2;
};

export const getPrerollTipSubtype = (s: string = ''): string => {
  const t = (s || '').toLowerCase();
  if (t.includes('glass tip') || t.includes('glasstip') || t.includes('glass-tip')) return 'glass_tip';
  if (t.includes('wood tip') || t.includes('woodtip') || t.includes('wood-tip')) return 'wood_tip';
  if (t.includes('hand roll') || t.includes('hand-roll') || t.includes('handroll')) return 'hand_rolled';
  return 'standard';
};

export const isPrerollConflict = (s1: string = '', s2: string = ''): boolean => {
  const isPre1 = /preroll|pre-roll|joint/i.test(s1 || '');
  const isPre2 = /preroll|pre-roll|joint/i.test(s2 || '');
  if (isPre1 !== isPre2) return true;
  if (isPre1 && isPre2) {
    const t1 = getPrerollTipSubtype(s1), t2 = getPrerollTipSubtype(s2);
    if (t1 !== t2 && (t1 !== 'standard' || t2 !== 'standard')) return true;
  }
  return false;
};

export const normalizePosSlug = (s: string = ''): string => (s || '')
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')
  .replace(/preground/g, 'ground')
  .replace(/grounded/g, 'ground');

export const getNormSlugVariants = (str: string = ''): string[] => {
  const n = normalizePosSlug(str);
  const vars = [n];
  if (n.startsWith('dankbydefinition')) {
    vars.push(n.replace(/^dankbydefinition/, 'dank'));
  } else if (n.startsWith('dank')) {
    vars.push(n.replace(/^dank/, 'dankbydefinition'));
  }
  return vars;
};

export const brandMatchesSlug = (normStr: string = '', brandKey: string = ''): boolean => {
  if (!normStr || !brandKey) return false;
  if (normStr.includes(brandKey)) return true;
  if (brandKey === 'dankbydefinition' && (normStr.includes('dank') || normStr.startsWith('dank'))) return true;
  if (brandKey === 'dank' && normStr.includes('dankbydefinition')) return true;
  return false;
};

export const getBrandCatalogList = (brandItemsMap: any, brandName: string = ''): any[] => {
  if (!brandItemsMap || !brandName) return [];
  if (brandItemsMap[brandName]?.length > 0) return brandItemsMap[brandName];
  const trimmed = brandName.trim();
  if (brandItemsMap[trimmed]?.length > 0) return brandItemsMap[trimmed];
  const lower = trimmed.toLowerCase();
  const foundKey = Object.keys(brandItemsMap).find(k => k.trim().toLowerCase() === lower);
  if (foundKey && brandItemsMap[foundKey]?.length > 0) return brandItemsMap[foundKey];
  const bKey = lower.replace(/[^a-z0-9]/g, '');
  const families: Record<string, string[]> = {
    dank: ['Dank By Definition', 'Dank'],
    dankbydefinition: ['Dank By Definition', 'Dank'],
    greenrevolution: ['Doozies', 'Dopio', 'Green Revolution'],
    doozies: ['Green Revolution', 'Doozies'],
    dopio: ['Green Revolution', 'Dopio'],
    camino: ['Lost Farm', 'Kiva', 'Camino'],
    lostfarm: ['Camino', 'Lost Farm']
  };
  const related = families[bKey] || [];
  for (const r of related) {
    if (brandItemsMap[r]?.length > 0) return brandItemsMap[r];
  }
  return brandItemsMap[brandName] || [];
};

export const checkBrandExists = (brandName: string = '', brandsList: any[] = []): boolean => {
  if (!brandsList || brandsList.length === 0) return true;
  const valLower = (brandName || '').trim().toLowerCase();
  if (!valLower) return false;
  return brandsList.some((b: any) => {
    const bName = typeof b === 'string' ? b : (b.brand || b.name || '');
    const bLower = bName.trim().toLowerCase();
    return bLower === valLower ||
           ((valLower === 'dank' || valLower === 'dank by definition') && (bLower === 'dank by definition' || bLower === 'dank'));
  });
};

export const findStrain = (strainStr: string = '', brandStr: string = '', strainsList: any[] = []): string | null => {
  const norm = (s: string) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean = norm((strainStr || '').replace(/\s*\([^)]*\)\s*$/, ''));
  if (!clean) return null;
  const nBrand = norm(brandStr);
  const brandAliases = (nBrand === 'dank' || nBrand === 'dankbydefinition') ? ['dank', 'dankbydefinition'] : [nBrand].filter(Boolean);
  const strip = (s: string) => (s.endsWith('s') || s.endsWith('z')) ? s.slice(0, -1) : s;
  const matchGlobal = (raw: any) => {
    const rawStr = typeof raw === 'string' ? raw : (raw?.strain || raw?.name || '');
    if (!rawStr) return false;
    const pm = rawStr.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (brandAliases.length > 0) {
      if (!pm || !brandAliases.some((b: string) => norm(pm[2]) === b || strip(norm(pm[2])) === strip(b))) return false;
      const rBase = norm(pm[1]), clBaseNoB = brandAliases.reduce((acc: string, b: string) => (acc.endsWith(b) ? acc.slice(0, -b.length) : acc), rBase);
      const clInNoB = brandAliases.reduce((acc: string, b: string) => (acc.endsWith(b) ? acc.slice(0, -b.length) : acc), clean);
      return rBase === clean || strip(rBase) === strip(clean) || clBaseNoB === clInNoB;
    }
    const n = norm(rawStr);
    return n === clean || strip(n) === strip(clean);
  };
  const m = (strainsList || []).find(matchGlobal);
  if (!m) return null;
  return typeof m === 'string' ? m : (m?.strain || m?.name || null);
};

export const checkStrainExists = (strainStr: string = '', brandStr: string = '', strainsList: any[] = [], brandCatList: any[] = []): boolean => {
  return Boolean(findStrain(strainStr, brandStr, strainsList));
};

export const matchCatalogSlug = (targetList: any[], targetNewSlug: string = '', incomingItem: any = {}, isSampleCheck: boolean = false): any => {
  if (!Array.isArray(targetList) || targetList.length === 0) return null;

  const incomingPack = extractPackCount(`${incomingItem.weight || ''} ${incomingItem.raw_item_name || ''} ${targetNewSlug || ''}`);
  const inMass = parseMass(incomingItem.weight || targetNewSlug);
  const inDept = (incomingItem.category || '').split('>')[0].trim().toLowerCase();

  const isConflict = (s: any) => {
    const sStr = extractSlugString(s), sLower = sStr.toLowerCase();
    if (isSampleCheck !== (sLower.includes('sample') || sLower.includes('smp'))) return true;
    const catDept = (s?.category_path || s?.category || '').split('>')[0].trim().toLowerCase();
    if (inDept && catDept && inDept !== catDept) return true;
    return extractPackCount(sStr) !== incomingPack ||
      isStrainContradiction(incomingItem.strain, sStr) ||
      !isExtractCompatible(targetNewSlug, sStr) ||
      isHardwareConflict(targetNewSlug, sStr) ||
      isRatioConflict(targetNewSlug, sStr) ||
      isEdibleConflict(targetNewSlug, sStr) ||
      isConcentrateVsVapeConflict(targetNewSlug, sStr) ||
      isInfusedFlowerConflict(targetNewSlug, sStr) ||
      isFlowerSubtypeConflict(targetNewSlug, sStr) ||
      isPrerollConflict(targetNewSlug, sStr);
  };

  // 1. Exact string match (ignoring case, matching sample status)
  const exact = targetList.find(s => {
    const sStr = extractSlugString(s), sLower = sStr.toLowerCase();
    const isCatSample = sLower.includes('sample') || sLower.includes('smp');
    if (isSampleCheck !== isCatSample) return false;
    return sStr.toLowerCase() === targetNewSlug.toLowerCase();
  });
  if (exact) return exact;

  // 2. Normalized slug variant match (e.g. 'Dank' vs 'Dank By Definition', 'preground' vs 'ground')
  const normNewVars = getNormSlugVariants(targetNewSlug);
  const superFuzzy = targetList.find(s => !isConflict(s) && normNewVars.includes(normalizePosSlug(extractSlugString(s))));
  if (superFuzzy) return superFuzzy;

  // 3. Keyword / Strain + Brand + Mass match
  const b = (incomingItem.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const s = (incomingItem.strain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (b && s) {
    const keywordMatch = targetList.find(slug => {
      if (isConflict(slug)) return false;
      const slugStr = extractSlugString(slug);
      const norm = normalizePosSlug(slugStr);
      if (!brandMatchesSlug(norm, b)) return false;

      const parts = slugStr.split('|').map(p => p.trim());
      const normParts = parts.map(p => normalizePosSlug(p));
      const normSlugStr = normalizePosSlug(slugStr);

      let cleanS = s;
      if (b && cleanS.startsWith(b)) cleanS = cleanS.slice(b.length).trim();
      if (b && cleanS.endsWith(b)) cleanS = cleanS.slice(0, -b.length).trim();
      const cleanSEnd = cleanS.endsWith('s') ? cleanS.slice(0, -1) : cleanS;
      const zSEnd = cleanS.endsWith('s') ? cleanS.slice(0, -1) + 'z' : (cleanS.endsWith('z') ? cleanS.slice(0, -1) + 's' : cleanS);

      const matchesAnyPart = normParts.some(p => {
        let cleanCatStrain = p;
        if (b && cleanCatStrain.startsWith(b)) cleanCatStrain = cleanCatStrain.slice(b.length).trim();
        if (b && cleanCatStrain.endsWith(b)) cleanCatStrain = cleanCatStrain.slice(0, -b.length).trim();
        return cleanCatStrain === cleanS || cleanCatStrain === cleanSEnd || cleanCatStrain === zSEnd || p === s;
      });

      const strainMatches = matchesAnyPart;
      if (!strainMatches) return false;

      const catMass = parseMass(slugStr), catPack = extractPackCount(slugStr);
      if (catMass !== null && inMass !== null) {
        const isWeightMatch = Math.abs(catMass - inMass) <= 0.15 || (catPack > 1 && Math.abs((catMass * catPack) - inMass) <= 0.15) || (incomingPack > 1 && Math.abs((inMass * incomingPack) - catMass) <= 0.15);
        if (!isWeightMatch) return false;
      }
      return true;
    });
    if (keywordMatch) return keywordMatch;
  }

  return null;
};

export const isUnitDosedCategory = (category?: string, format?: string): boolean => {
  const s = `${category || ''} ${format || ''}`.toLowerCase();
  return [
    'edible', 'gumm', 'choc', 'bake', 'bever', 'drink', 'tinct', 'drop',
    'subling', 'topic', 'lot', 'balm', 'salv', 'cream', 'patch', 'capsul', 'tablet', 'syrup', 'coffee', 'latte', 'espresso', 'mocha', 'cappuccino', 'americano', 'macchiato'
  ].some(k => s.includes(k));
};

export const autoAssignDeliveryRoute = (category?: string, format?: string): string => {
  const s = `${category || ''} ${format || ''}`.toLowerCase();
  if (['beverage', 'drink', 'tincture', 'syrup', 'drop', 'liquid', 'coffee', 'cold brew', 'latte', 'espresso', 'mocha', 'cappuccino', 'americano', 'macchiato'].some(k => s.includes(k))) return 'Edible > Liquid Form';
  if (['edible', 'gumm', 'chocolate', 'baked', 'capsule', 'tablet', 'chew', 'solid'].some(k => s.includes(k))) return 'Edible > Solid Form';
  if (['flower', 'bud', 'preroll', 'pre-roll', 'shake', 'smalls', 'ground'].some(k => s.includes(k))) return 'Dried Marijuana';
  if (['vape', 'concentrate', 'extract', 'rosin', 'resin', 'badder', 'shatter', 'wax', 'diamond', 'cartridge', 'aio', 'disposable', 'distillate', 'pod'].some(k => s.includes(k))) return 'Concentrate';
  return ['topical', 'lotion', 'balm', 'salve', 'cream', 'patch'].some(k => s.includes(k)) ? 'Topical' : 'Dried Marijuana';
};

export const getFullCategoryTree = (terminalNode: string) => {
  if (!terminalNode) return '';
  const map: Record<string, string> = {
    'Prerolls': 'Flower > Prerolls',
    'Infused Prerolls': 'Flower > Infused Prerolls',
    'Bud': 'Flower > Bud',
    'Flower': 'Flower > Bud',
    'Gummies': 'Edibles > Gummies',
    'Chocolates': 'Edibles > Chocolates',
    'Candy': 'Edibles > Candy',
    'Beverages': 'Edibles > Beverages',
    'Baked Goods': 'Edibles > Baked Goods',
    'Mints': 'Edibles > Mints',
    'Capsules': 'Edibles > Capsules',
    'Tinctures': 'Edibles > Tinctures',
    'Carts': 'Vapes > Carts',
    'Distillate': 'Vapes > Carts > Distillate',
    'Live Resin': 'Vapes > Carts > Live Resin',
    'Rosin': 'Vapes > Carts > Rosin',
    'Disposable': 'Vapes > Disposable',
    'All-in-One Vapes': 'Vapes > All-in-One Vapes',
    'Pods': 'Vapes > Pods',
    'Concentrates': 'Concentrates',
    'Topicals': 'Topicals'
  };
  const match = Object.keys(map).find(k => k.toLowerCase() === terminalNode.toLowerCase());
  return match ? map[match] : terminalNode;
};

export function normalizeStrainClassification(rawText?: string | number, rawIndicaPct?: number, rawSativaPct?: number): {
  strainType: "Indica" | "Sativa" | "Hybrid" | "Indica Leaning Hybrid" | "Sativa Leaning Hybrid";
  id_strain_type: 1 | 2 | 3 | 4 | 5;
  pctIndica: number;
  pctSativa: number;
} {
  if (typeof rawText === 'number') {
    const idMap: Record<number, { strainType: "Indica" | "Sativa" | "Hybrid" | "Indica Leaning Hybrid" | "Sativa Leaning Hybrid"; id_strain_type: 1 | 2 | 3 | 4 | 5; pctIndica: number; pctSativa: number }> = {
      1: { strainType: "Indica", id_strain_type: 1, pctIndica: 100, pctSativa: 0 },
      2: { strainType: "Sativa", id_strain_type: 2, pctIndica: 0, pctSativa: 100 },
      3: { strainType: "Hybrid", id_strain_type: 3, pctIndica: 50, pctSativa: 50 },
      4: { strainType: "Indica Leaning Hybrid", id_strain_type: 4, pctIndica: 75, pctSativa: 25 },
      5: { strainType: "Sativa Leaning Hybrid", id_strain_type: 5, pctIndica: 25, pctSativa: 75 }
    };
    if (idMap[rawText]) return idMap[rawText];
  }
  const norm = (rawText || '').toString().toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const toP = (v: any) => (v != null && !isNaN(Number(v))) ? (Number(v) <= 1 && Number(v) > 0 ? Math.round(Number(v) * 100) : (Number(v) > 100 ? Math.min(100, Math.max(0, Math.round(Number(v) / 100))) : Math.min(100, Math.max(0, Math.round(Number(v)))))) : NaN;
  const iNum = toP(rawIndicaPct), sNum = toP(rawSativaPct);
  const hasNums = !isNaN(iNum) && !isNaN(sNum);
  const is5050 = (iNum === 50 && sNum === 50);
  const hasExplicitNonHybrid = norm && norm !== 'hybrid';

  if (hasNums && (!is5050 || !hasExplicitNonHybrid)) {
    if (iNum === 100 && sNum === 0) return { strainType: "Indica", id_strain_type: 1, pctIndica: 100, pctSativa: 0 };
    if (sNum === 100 && iNum === 0) return { strainType: "Sativa", id_strain_type: 2, pctIndica: 0, pctSativa: 100 };
    if (sNum >= 60) return { strainType: "Sativa Leaning Hybrid", id_strain_type: 5, pctIndica: iNum, pctSativa: sNum };
    if (iNum >= 60) return { strainType: "Indica Leaning Hybrid", id_strain_type: 4, pctIndica: iNum, pctSativa: sNum };
    return { strainType: "Hybrid", id_strain_type: 3, pctIndica: 50, pctSativa: 50 };
  }
  if (norm.includes('sativa') && (norm.includes('lean') || norm.includes('dom') || norm.includes('hybrid'))) return { strainType: "Sativa Leaning Hybrid", id_strain_type: 5, pctIndica: 25, pctSativa: 75 };
  if (norm.includes('indica') && (norm.includes('lean') || norm.includes('dom') || norm.includes('hybrid'))) return { strainType: "Indica Leaning Hybrid", id_strain_type: 4, pctIndica: 75, pctSativa: 25 };
  if (norm === 'indica' || norm === 'i') return { strainType: "Indica", id_strain_type: 1, pctIndica: 100, pctSativa: 0 };
  if (norm === 'sativa' || norm === 's') return { strainType: "Sativa", id_strain_type: 2, pctIndica: 0, pctSativa: 100 };
  return { strainType: "Hybrid", id_strain_type: 3, pctIndica: 50, pctSativa: 50 };
}

export const getEffectiveSativa = (it: any): number => {
  if (!it) return 50;
  if (it.id_strain_type === 2) return 100;
  if (it.id_strain_type === 1) return 0;
  const toP = (v: any) => (v != null && !isNaN(Number(v))) ? (Number(v) <= 1 && Number(v) > 0 ? Math.round(Number(v) * 100) : (Number(v) > 100 ? Math.min(100, Math.max(0, Math.round(Number(v) / 100))) : Math.min(100, Math.max(0, Math.round(Number(v)))))) : NaN;
  if (it.id_strain_type === 5) {
    const s = toP(it.pctSativa);
    return !isNaN(s) ? s : 75;
  }
  if (it.id_strain_type === 4) {
    const s = toP(it.pctSativa);
    return !isNaN(s) ? s : 25;
  }
  if (it.id_strain_type === 3) return 50;

  const stype = (it.strain_type || "").toLowerCase().replace(/[\-_]/g, ' ');
  const rawS = toP(it.pctSativa);
  const rawI = toP(it.pctIndica);
  if (!isNaN(rawS) && !((rawS === 50 && rawI === 50) && stype !== "hybrid" && stype !== "")) {
    return rawS;
  }
  if (stype.includes("sativa") && (stype.includes("leaning") || stype.includes("dom"))) return 75;
  if (stype.includes("sativa")) return 100;
  if (stype.includes("indica") && (stype.includes("leaning") || stype.includes("dom"))) return 25;
  if (stype.includes("indica")) return 0;
  return 50;
};

export const generateCleanSlug = (item: any): string => {
  let cleanCat = item.category_input !== undefined ? item.category_input : (item.category || 'Unknown');
  if (cleanCat.includes('>')) {
    cleanCat = cleanCat.split('>').pop().trim();
  }
  cleanCat = cleanCat.replace(/,/g, ' ').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
  
  let cleanStrain = (item.strain || 'Unknown').trim();
  if (item.brand && cleanStrain.toLowerCase().startsWith(item.brand.toLowerCase())) {
    const candidate = cleanStrain.slice(item.brand.length).replace(/^[\s\-_|:]+/, '').trim();
    if (candidate) cleanStrain = candidate;
  }
  
  let slugWeightStr = item.weight ? ' | ' + item.weight : '';
  
  if (item.weight && (item.weight.includes('pk') || item.weight.includes('x'))) {
    if (cleanCat.includes(item.weight)) {
      if (item.parsed_weight_useable && item.parsed_weight_useable > 0) {
        const unit = item.parsed_uom === "Milligrams" ? "mg" : "g";
        slugWeightStr = ' | ' + item.parsed_weight_useable + unit;
      } else {
        slugWeightStr = '';
      }
    }
  }
  
  return `${item.brand || 'Unknown'} | ${cleanStrain} | ${cleanCat}${slugWeightStr}`;
};

export interface CatalogMatchResult {
  target_item_exists: boolean;
  target_item_name: string;
  target_sample_name: string;
  cleanBase: string;
  sampleSlug: string;
  matchedBase: any | null;
  matchedSample: any | null;
}

export function resolveCatalogMatch(
  brandCatalog: any[],
  candidateSlug: string,
  item: any
): CatalogMatchResult {
  const cleanBase = (candidateSlug || '').replace(/(\s*\|\s*Sample)+$/i, '').trim();
  const sampleSlug = `${cleanBase} | Sample`;
  const matchedBase = matchCatalogSlug(brandCatalog, cleanBase, item, false);
  const cleanBaseMatch = matchedBase
    ? extractSlugString(matchedBase).replace(/(\s*\|\s*Sample)+$/i, '').trim()
    : cleanBase;
  const matchedSample = matchCatalogSlug(brandCatalog, sampleSlug, item, true);
  const exists = Boolean(matchedBase || matchedSample);
  const finalTarget = cleanBaseMatch;
  const finalSample = matchedSample ? extractSlugString(matchedSample) : `${cleanBaseMatch} | Sample`;

  return {
    target_item_exists: exists,
    target_item_name: finalTarget,
    target_sample_name: finalSample,
    cleanBase,
    sampleSlug,
    matchedBase,
    matchedSample
  };
}

export interface EnrichedContext {
  curBrands: string[];
  curStrains: any[];
  curBrandItems: Record<string, any[]>;
  siblingItems?: any[];
}

export function enrichIntakeItem(item: any, ctx: EnrichedContext): any {
  const isEdible = isUnitDosedCategory(item.category, item.product_format);
  if (item.item_thc === undefined || item.item_thc === null || item.item_thc === '') {
    item.item_thc = isEdible ? (item.thc_mg ?? item.thc_pct ?? 100) : (item.thc_pct ?? item.thc_mg ?? 0);
  }
  if (item.item_cbd === undefined || item.item_cbd === null || item.item_cbd === '') {
    item.item_cbd = isEdible ? (item.cbd_mg ?? item.cbd_pct ?? 0) : (item.cbd_pct ?? item.cbd_mg ?? 0);
  }
  if (item.thc_mg === undefined || item.thc_mg === null) {
    item.thc_mg = isEdible ? (item.item_thc ?? 100) : null;
  }
  if (item.cbd_mg === undefined || item.cbd_mg === null) {
    item.cbd_mg = isEdible ? (item.item_cbd ?? 0) : null;
  }
  const rawRetail = parseFloat(item.retailPrice || 0);
  const price_otd = item.price_otd !== undefined && item.price_otd !== null
    ? item.price_otd
    : (!isNaN(rawRetail) && rawRetail > 0 ? Number((rawRetail * 1.13).toFixed(2)) : 0.00);
  const uom_weight_useable = item.uom_weight_useable || (isEdible ? "Milligrams" : "Grams");
  const weight_useable = item.weight_useable || (isEdible ? (item.thc_mg || item.item_thc || 100) : (item.parsed_weight_useable || 1.0));
  const delivery_route = item.delivery_route || autoAssignDeliveryRoute(item.category, item.product_format);
  const valLower = (item.brand || '').trim().toLowerCase();
  const getB = (b: any) => (typeof b === 'string' ? b : (b?.brand || b?.name || '')).trim();
  const matchedBrand = (ctx.curBrands || []).find((b: any) => getB(b).toLowerCase() === valLower) ||
                       (ctx.curBrands || []).find((b: any) => (valLower === 'dank' || valLower === 'dank by definition') && ['dank', 'dank by definition'].includes(getB(b).toLowerCase()));
  const canonicalBrandStr = matchedBrand ? getB(matchedBrand) : (item.brand || '');
  const bVal = canonicalBrandStr.trim();
  const bItems = getBrandCatalogList(ctx.curBrandItems, bVal);

  const target_brand_exists = item.target_brand_exists !== undefined
    ? item.target_brand_exists
    : (Boolean(matchedBrand) || checkBrandExists(item.brand, ctx.curBrands));

  const cleanStrainBase = (item.strain || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const existingStrain = findStrain(cleanStrainBase, bVal, ctx.curStrains);
  const target_strain_exists = item.target_strain_exists !== undefined
    ? item.target_strain_exists
    : Boolean(existingStrain);
  const target_strain_name = existingStrain || (bVal ? `${cleanStrainBase} (${bVal})` : cleanStrainBase);

  let target_item_exists = item.target_item_exists;
  let target_item_name = item.target_item_name;
  let target_sample_name = item.target_sample_name;

  if (target_item_exists === undefined) {
    const matchRes = resolveCatalogMatch(bItems, item.proposedSlug || generateCleanSlug(item), item);
    target_item_exists = matchRes.target_item_exists;
    target_item_name = matchRes.target_item_name;
    target_sample_name = matchRes.target_sample_name;
  }

  return {
    ...item,
    brand: bVal || item.brand,
    price_otd,
    uom_weight_useable,
    weight_useable,
    delivery_route,
    target_brand_exists,
    target_strain_exists,
    target_strain_name,
    target_item_exists,
    target_item_name: target_item_name || (item.proposedSlug || generateCleanSlug(item) || '').replace(/(\s*\|\s*Sample)+$/i, '').trim(),
    target_sample_name: target_sample_name || `${target_item_name} | Sample`
  };
}

export function calculateUpdatedItem(
  item: any,
  field: string,
  value: any,
  ctx: EnrichedContext
): any {
  const updated = { ...item, [field]: value };

  if (['proposedSlug', 'brand', 'strain', 'category', 'category_input', 'weight', 'product_format', 'isSample', 'costOfGoods', 'retailPrice', 'price_otd', 'thc_mg', 'thc_pct', 'cbd_mg', 'cbd_pct', 'item_thc', 'item_cbd', 'servings', 'dosage_recommended', 'ingredients_list', 'allergens', 'strain_type', 'pctSativa', 'pctIndica', 'id_strain_type'].includes(field)) {
    if (field === 'price_otd') {
      const otd = parseFloat(value);
      if (!isNaN(otd)) {
        updated.price_otd = value;
        updated.retailPrice = (otd / 1.13).toFixed(4);
      } else {
        updated.price_otd = value;
        if (value === '') updated.retailPrice = '';
      }
    }
    if (field === 'retailPrice') {
      const preTax = parseFloat(value);
      if (!isNaN(preTax)) {
        updated.retailPrice = value;
        updated.price_otd = (preTax * 1.13).toFixed(2);
      } else {
        updated.retailPrice = value;
        if (value === '') updated.price_otd = '';
      }
    }
    if (field === 'costOfGoods') {
      const costFloat = parseFloat(value || 0);
      const combinedText = `${updated.raw_item_name || ''} ${updated.strain || ''} ${updated.product_format || ''}`.toLowerCase();
      const hasSampleKeyword = combinedText.includes('sample') || combinedText.includes('promo') || combinedText.includes('tester');
      const isNominalCost = !isNaN(costFloat) && costFloat > 0 && costFloat <= 0.05;

      if (isNominalCost || hasSampleKeyword) {
        updated.isSample = true;
        const safeSampleCost = isNominalCost ? costFloat : 0.01;
        updated.retailPrice = (safeSampleCost * 2).toFixed(2);
        updated.price_otd = (safeSampleCost * 2 * 1.13).toFixed(2);
      } else if (!isNaN(costFloat) && costFloat > 0.05) {
        if (!hasSampleKeyword) {
          updated.isSample = false;
          if (updated.retailPrice === '0.02' || updated.retailPrice === '0.00' || !updated.retailPrice) {
            updated.retailPrice = (costFloat * 2).toFixed(2);
            updated.price_otd = (costFloat * 2 * 1.13).toFixed(2);
          }
        }
      }
    }
    if (field === 'isSample') {
      if (value === true) {
        const costFloat = parseFloat(updated.costOfGoods || 0);
        if (isNaN(costFloat) || costFloat <= 0 || costFloat > 0.05) {
          updated.costOfGoods = '0.01';
        }
        const safeSampleCost = parseFloat(updated.costOfGoods) || 0.01;
        updated.retailPrice = (safeSampleCost * 2).toFixed(2);
        updated.price_otd = (safeSampleCost * 2 * 1.13).toFixed(2);
      } else {
        updated.isSample = false;
        
        // Find matching standard commercial retail pricing from sibling items in the shipment
        let standardRetail: number | null = null;
        if (Array.isArray(ctx.siblingItems)) {
          const bKey = (updated.brand || '').toLowerCase().trim();
          const catKey = (updated.category || '').toLowerCase().trim();
          const fmtKey = (updated.product_format || '').toLowerCase().trim();
          const wKey = (updated.weight || '').toLowerCase().trim();
          const sibling = ctx.siblingItems.find((s: any) => {
            if (s === item || s.isSample) return false;
            const sCost = parseFloat(s.costOfGoods || s.wholesale_cost || 0);
            if (isNaN(sCost) || sCost <= 0.05) return false;
            const sb = (s.brand || '').toLowerCase().trim();
            if (sb !== bKey) return false;
            const sc = (s.category || '').toLowerCase().trim();
            const sf = (s.product_format || '').toLowerCase().trim();
            const sw = (s.weight || '').toLowerCase().trim();
            return (sc === catKey || sf === fmtKey) && (sw === wKey || !wKey || !sw);
          });
          if (sibling && sibling.retailPrice && parseFloat(sibling.retailPrice) > 0) {
            standardRetail = parseFloat(sibling.retailPrice);
          }
        }

        // If no sibling in shipment, check POS catalog for this brand
        if (!standardRetail) {
          const bCatalog = getBrandCatalogList(ctx.curBrandItems, updated.brand);
          const catItem = bCatalog.find((c: any) => {
            const cSlug = extractSlugString(c);
            if (cSlug.toLowerCase().includes('sample') || cSlug.toLowerCase().includes('smp')) return false;
            return c.category_path === updated.category || (c.price_retail_adult_use && c.category_path?.split('>')[0] === updated.category?.split('>')[0]);
          });
          if (catItem && (catItem.price_retail_adult_use || catItem.price)) {
            standardRetail = parseFloat(catItem.price_retail_adult_use || catItem.price);
          }
        }

        // Package cost preservation: Strictly preserve the actual package cost from the manifest / Alleaves package
        const pkgCostStr = (item.wholesale_cost !== undefined && item.wholesale_cost !== null && !isNaN(Number(item.wholesale_cost)))
          ? String(item.wholesale_cost)
          : ((updated.costOfGoods && updated.costOfGoods !== '') ? updated.costOfGoods : (item.costOfGoods || '0.01'));
        updated.costOfGoods = pkgCostStr;
        updated.wholesale_cost = parseFloat(pkgCostStr) || 0.01;

        if (standardRetail && !isNaN(standardRetail) && standardRetail > 0) {
          updated.retailPrice = standardRetail.toFixed(2);
          updated.price_otd = (standardRetail * 1.13).toFixed(2);
        } else {
          const curCost = parseFloat(updated.costOfGoods) || 0.01;
          updated.retailPrice = (curCost * 2).toFixed(2);
          updated.price_otd = (curCost * 2 * 1.13).toFixed(2);
        }
      }
    }
    if (field === 'category') {
      const isEdible = isUnitDosedCategory(value, updated.product_format);
      updated.delivery_route = autoAssignDeliveryRoute(value, updated.product_format);
      updated.uom_weight_useable = isEdible ? "Milligrams" : "Grams";
      if (isEdible) {
        updated.weight_useable = updated.thc_mg || (updated.item_thc >= 10 ? updated.item_thc : 100);
      } else {
        updated.weight_useable = updated.parsed_weight_useable || 1.0;
      }
    }
    if (field === 'thc_mg') {
      updated.thc_mg = value;
      updated.item_thc = value === '' ? '' : (parseFloat(value) || 0);
    }
    if (field === 'thc_pct') {
      updated.thc_pct = value;
      updated.item_thc = value === '' ? '' : (parseFloat(value) || 0);
    }
    if (field === 'cbd_mg') {
      updated.cbd_mg = value;
      updated.item_cbd = value === '' ? '' : (parseFloat(value) || 0);
    }
    if (field === 'cbd_pct') {
      updated.cbd_pct = value;
      updated.item_cbd = value === '' ? '' : (parseFloat(value) || 0);
    }
    if (field === 'item_thc') {
      updated.item_thc = value;
      if (isUnitDosedCategory(updated.category, updated.product_format)) {
        updated.thc_mg = value;
      } else {
        updated.thc_pct = value;
      }
    }
    if (field === 'item_cbd') {
      updated.item_cbd = value;
      if (isUnitDosedCategory(updated.category, updated.product_format)) {
        updated.cbd_mg = value;
      } else {
        updated.cbd_pct = value;
      }
    }
    if (field === 'strain_type') {
      const norm = normalizeStrainClassification(value, updated.pctIndica, updated.pctSativa);
      updated.strain_type = norm.strainType;
      updated.id_strain_type = norm.id_strain_type;
      updated.pctIndica = norm.pctIndica;
      updated.pctSativa = norm.pctSativa;
    }
    if (field === 'force_new_shell') {
      updated.force_new_shell = Boolean(value);
    }
    if (field === 'pctSativa' || field === 'pctIndica') {
      const raw = Number(value);
      const val = Math.min(100, Math.max(0, isNaN(raw) ? 50 : Math.round(raw)));
      const sNum = field === 'pctSativa' ? val : 100 - val;
      const iNum = 100 - sNum;
      const norm = normalizeStrainClassification('', iNum, sNum);
      updated.pctSativa = sNum;
      updated.pctIndica = iNum;
      updated.strain_type = norm.strainType;
      updated.id_strain_type = norm.id_strain_type;
    }
    if (field === 'id_strain_type') {
      const norm = normalizeStrainClassification(Number(value));
      updated.id_strain_type = norm.id_strain_type;
      updated.strain_type = norm.strainType;
      updated.pctIndica = norm.pctIndica;
      updated.pctSativa = norm.pctSativa;
    }

    const targetSlug = field === 'proposedSlug' ? value : generateCleanSlug(updated);
    if (field !== 'proposedSlug') updated.proposedSlug = targetSlug;

    if (field === 'brand') {
      const valLower = (value || '').trim().toLowerCase();
      const getB = (b: any) => (typeof b === 'string' ? b : (b?.brand || b?.name || '')).trim();
      const matched = (ctx.curBrands || []).find((b: any) => getB(b).toLowerCase() === valLower) ||
                      (ctx.curBrands || []).find((b: any) => (valLower === 'dank' || valLower === 'dank by definition') && ['dank', 'dank by definition'].includes(getB(b).toLowerCase()));
      if (matched) updated.brand = getB(matched);
      updated.target_brand_exists = Boolean(matched) || checkBrandExists(value, ctx.curBrands);
    }

    if (field === 'strain' || field === 'brand') {
      const cleanStrainBase = (updated.strain || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
      const bVal = (updated.brand || '').trim();
      const existingStrain = findStrain(cleanStrainBase, bVal, ctx.curStrains);
      updated.target_strain_exists = Boolean(existingStrain);
      updated.target_strain_name = existingStrain || (bVal ? `${cleanStrainBase} (${bVal})` : cleanStrainBase);
    }

    if (updated.force_new_shell) {
      updated.target_item_exists = false;
      updated.target_item_id = null;
      updated.alleaves_auto_match_id = null;
      updated.alleaves_auto_match_name = null;
      updated.native_match_id = null;
      updated.native_match_name = null;
    } else {
      const bCatalog = getBrandCatalogList(ctx.curBrandItems, updated.brand);
      const matchRes = resolveCatalogMatch(bCatalog, targetSlug, updated);
      updated.target_item_exists = matchRes.target_item_exists;
      updated.target_item_name = matchRes.target_item_name;
      updated.target_sample_name = matchRes.target_sample_name;
      const matchedShell = updated.isSample ? matchRes.matchedSample : matchRes.matchedBase;
      const matchedId = matchRes.target_item_exists
        ? (matchedShell?.id_item || (updated.isSample ? matchRes.matchedBase?.id_item : null) || updated.target_item_id || null)
        : null;
      if (updated.isSample && matchRes.matchedBase) {
        updated.clone_parent_id = matchRes.matchedBase.id_item;
      }
      updated.target_sample_exists = Boolean(matchRes.matchedSample);
      updated.target_item_id = matchedId;
      updated.alleaves_auto_match_id = matchedId;
      updated.alleaves_auto_match_name = matchRes.target_item_exists ? matchRes.target_item_name : null;
      updated.native_match_id = matchedId;
      updated.native_match_name = matchRes.target_item_exists ? matchRes.target_item_name : null;
      if (matchRes.target_item_exists && matchedShell?.strain_type && updated.target_strain_exists) {
        const sNorm = normalizeStrainClassification(matchedShell.strain_type, matchedShell.strain_percent_indica, matchedShell.strain_percent_sativa);
        updated.strain_type = matchedShell.strain_type || sNorm.strainType;
        updated.id_strain_type = matchedShell.id_strain_type || sNorm.id_strain_type;
        updated.pctSativa = sNorm.pctSativa;
        updated.pctIndica = sNorm.pctIndica;
      }
      if (matchedShell && !updated.isSample && (matchedShell.price_retail_adult_use || matchedShell.price)) {
        if (!updated.retailPrice || updated.retailPrice === '0.00' || updated.retailPrice === '0.02') {
          updated.retailPrice = String(matchedShell.price_retail_adult_use || matchedShell.price);
          updated.price_otd = (parseFloat(updated.retailPrice) * 1.13).toFixed(2);
        }
      }
      if (matchedShell?.category_path && (!updated.category || updated.category === 'Unknown' || updated.category === 'Uncategorized')) {
        updated.category = matchedShell.category_path;
      }
      if (field !== 'proposedSlug') {
        updated.proposedSlug = updated.isSample ? matchRes.target_sample_name : matchRes.target_item_name;
      }
    }
  }

  return updated;
}
