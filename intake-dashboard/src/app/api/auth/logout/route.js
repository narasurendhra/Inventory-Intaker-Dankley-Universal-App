/**
 * POST /api/auth/logout
 * 
 * Clears the Dankley operator session cookie.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('dankley_session');
  return response;
}
