/**
 * POST /api/pos/package-cost
 * 
 * Fetches wholesale cost of goods and Metrc lab test data for package UIDs
 * using the operator's active POS adapter.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    const body = await req.json();
    const { uid, uids } = body || {};

    const targetUids = uids || (uid ? [uid] : []);
    if (!Array.isArray(targetUids) || targetUids.length === 0) {
      return NextResponse.json({ error: 'At least one package UID is required.' }, { status: 400 });
    }

    const locationId = session?.locationId || req.nextUrl.searchParams.get('locationId') || 'sandbox';
    const adapter = PosAdapterFactory.getAdapter(locationId);

    const packageData = await adapter.getBulkPackageData(targetUids);

    if (uid && !uids) {
      const single = packageData[uid] || { found: false, cost_of_good: null };
      return NextResponse.json(single);
    }

    return NextResponse.json({ success: true, packages: packageData });
  } catch (error) {
    console.error('[POS PACKAGE COST ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
