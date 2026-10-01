/**
 * POST /api/preview-intake
 * 
 * Preflight validation endpoint for the mobile app before final submission.
 * Checks POS catalog matches, sample cloning parent shells, and 13% tax derivations.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';
import { matchPosCatalog } from '../process-intake/route';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const locationId = session?.locationId || request.nextUrl.searchParams.get('locationId') || 'sandbox';
    const posAdapter = PosAdapterFactory.getAdapter(locationId);

    const body = await request.json();
    const { items = [], manifest_number, vendor } = body;

    const uniqueBrands = [...new Set(items.map(i => i.brand).filter(Boolean))];
    const brandCatalogs = {};
    await Promise.all(uniqueBrands.map(async b => {
      brandCatalogs[b] = await posAdapter.getBrandCatalog(b).catch(() => []);
    }));

    const previewItems = items.map(item => {
      const brandCatalog = brandCatalogs[item.brand] || [];
      const isSample = Boolean(item.isSample || (item.wholesale_cost <= 0.05 && item.wholesale_cost > 0));
      const matched = matchPosCatalog(brandCatalog, item.proposedSlug, isSample, item);

      const retailNum = parseFloat(item.retailPrice || 0);
      const priceOtd = (!isNaN(retailNum) && retailNum > 0) ? Number((retailNum * 1.13).toFixed(2)) : 0.00;

      return {
        ...item,
        price_otd: priceOtd,
        target_item_exists: Boolean(matched),
        target_item_id: matched?.id_item || item.target_item_id || null,
        target_item_name: matched?.item || item.target_item_name || item.proposedSlug
      };
    });

    return NextResponse.json({
      success: true,
      manifest_number,
      vendor,
      posName: posAdapter.getName(),
      posType: posAdapter.getType(),
      items: previewItems
    });
  } catch (error) {
    console.error('[PREVIEW-INTAKE ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
