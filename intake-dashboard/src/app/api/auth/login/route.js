/**
 * POST /api/auth/login
 * 
 * Authenticates Dankley team members using their @dankley.com email address.
 * Rejects any non-dankley email domains and provisions store location & POS mapping.
 */

import { NextResponse } from 'next/server';
import { isDankleyEmail, resolveUserProfile, generateToken, ALLOWED_DOMAIN } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body || {};

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!isDankleyEmail(email)) {
      return NextResponse.json({
        error: `Access Denied: Only @${ALLOWED_DOMAIN} email accounts are authorized to use this application.`
      }, { status: 403 });
    }

    // Resolve user's store location, assigned POS, and model tier
    const userProfile = resolveUserProfile(email);
    const token = generateToken(userProfile);

    const response = NextResponse.json({
      success: true,
      message: `Welcome, ${userProfile.name}!`,
      token,
      user: userProfile
    });

    // Also set as HTTP-only cookie for web browsers
    response.cookies.set('dankley_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}
