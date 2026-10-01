/**
 * GET /api/auth/me
 * 
 * Returns the currently authenticated user's profile, store location,
 * assigned POS system, and active AI model.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import PosAdapterFactory from '@/lib/posAdapters/PosAdapterFactory';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null
      }, { status: 401 });
    }

    const adapter = PosAdapterFactory.getAdapter(session.locationId);

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.sub,
        name: session.name,
        role: session.role,
        locationId: session.locationId,
        posType: session.posType || adapter.getType(),
        posName: adapter.getName(),
        aiModel: session.aiModel || 'gemini-2.5-flash',
        availableLocations: PosAdapterFactory.getLocations()
      }
    });
  } catch (error) {
    console.error('[AUTH ME ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
