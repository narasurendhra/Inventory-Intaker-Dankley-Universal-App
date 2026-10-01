/**
 * GET /api/pos/categories
 * 
 * Returns the active category hierarchy for the operator's assigned store POS.
 * Dynamic: resolves to Dutchie, BLAZE, Alleaves, or Mock categories based on user session.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    const locationId = session?.locationId || req.nextUrl.searchParams.get('locationId') || 'sandbox';
    const adapter = PosAdapterFactory.getAdapter(locationId);

    const [categories, brands, deliveryRoutes, strains] = await Promise.all([
      adapter.getCategories().catch(() => []),
      adapter.getBrands().catch(() => []),
      adapter.getDeliveryRoutes().catch(() => []),
      adapter.getStrains().catch(() => [])
    ]);

    return NextResponse.json({
      success: true,
      posType: adapter.getType(),
      posName: adapter.getName(),
      categories,
      brands,
      deliveryRoutes,
      strains
    });
  } catch (error) {
    console.error('[POS CATEGORIES ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
