/**
 * GET /api/pos/config
 * 
 * Returns active POS engine details, capabilities, and location list.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    const locationId = session?.locationId || req.nextUrl.searchParams.get('locationId') || 'sandbox';
    const adapter = PosAdapterFactory.getAdapter(locationId);

    return NextResponse.json({
      success: true,
      activeLocationId: locationId,
      posName: adapter.getName(),
      posType: adapter.getType(),
      locations: PosAdapterFactory.getLocations(),
      sessionUser: session ? { email: session.sub, name: session.name } : null
    });
  } catch (error) {
    console.error('[POS CONFIG ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
