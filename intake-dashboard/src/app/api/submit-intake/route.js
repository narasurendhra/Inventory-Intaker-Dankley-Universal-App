/**
 * POST /api/submit-intake
 * 
 * Finalizes the intake batch and injects the items into the active dispensary POS.
 * Triggers Dutchie, BLAZE, Alleaves, or Mock adapters to provision shells and link Metrc packages.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const locationId = session?.locationId || request.nextUrl.searchParams.get('locationId') || 'sandbox';
    const posAdapter = PosAdapterFactory.getAdapter(locationId);

    const body = await request.json();
    const { items = [], manifest_number, vendor } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided in submission payload." }, { status: 400 });
    }

    console.log(`[SUBMIT-INTAKE] Dispatching ${items.length} items to ${posAdapter.getName()} (Location: ${locationId})`);

    const result = await posAdapter.submitBatch(items, {
      manifest_number,
      vendor,
      submittedBy: session?.sub || 'operator@dankley.com',
      submittedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: result.success,
      importedCount: result.importedCount,
      errors: result.errors || [],
      posName: posAdapter.getName(),
      posType: posAdapter.getType(),
      details: result
    });
  } catch (error) {
    console.error('[SUBMIT-INTAKE ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
