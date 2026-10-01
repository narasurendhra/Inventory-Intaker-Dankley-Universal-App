/**
 * auth.js
 * 
 * Multi-tenant authentication and authorization utility for Dankley team members.
 * Strictly enforces that only verified @dankley.com email accounts can access the intake app.
 * Uses native Node.js crypto (zero-dependency) for signing & verifying JWT session tokens.
 */

const crypto = require('crypto');
const dankleyConfig = require('../config/dankleyLocations.json');

const JWT_SECRET = process.env.JWT_SECRET || 'dankley_universal_intake_dev_secret_key_2026_change_in_production';
const ALLOWED_DOMAIN = dankleyConfig.domain || 'dankley.com';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Validate that an email belongs to @dankley.com
 * @param {string} email 
 * @returns {boolean}
 */
function isDankleyEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Find or provision a user profile based on email
 * @param {string} email 
 * @returns {object} User profile with assigned location and POS
 */
function resolveUserProfile(email) {
  if (!isDankleyEmail(email)) {
    throw new Error(`Access Denied: Only @${ALLOWED_DOMAIN} email accounts are permitted.`);
  }

  const normalized = email.trim().toLowerCase();
  const existing = dankleyConfig.defaultUsers.find(u => u.email.toLowerCase() === normalized);

  if (existing) {
    const loc = dankleyConfig.locations[existing.locationId] || dankleyConfig.locations['sandbox'];
    return {
      email: existing.email,
      name: existing.name,
      role: existing.role,
      locationId: existing.locationId,
      locationName: loc.name,
      posType: loc.posType,
      allowedLocations: existing.allowedLocations || [existing.locationId],
      aiModel: loc.defaultModel || 'gemini-2.5-flash'
    };
  }

  // Auto-provision new @dankley.com team members into the sandbox
  const defaultLocId = process.env.DEFAULT_LOCATION_ID || 'sandbox';
  const defaultLoc = dankleyConfig.locations[defaultLocId] || dankleyConfig.locations['sandbox'];

  const namePart = normalized.split('@')[0].replace(/[._-]/g, ' ');
  const capitalizedName = namePart.replace(/\b\w/g, l => l.toUpperCase());

  return {
    email: normalized,
    name: capitalizedName,
    role: 'operator',
    locationId: defaultLocId,
    locationName: defaultLoc.name,
    posType: defaultLoc.posType,
    allowedLocations: Object.keys(dankleyConfig.locations),
    aiModel: defaultLoc.defaultModel || 'gemini-2.5-flash'
  };
}

/**
 * Generate a JWT session token for an authenticated Dankley user (Native Node.js HMAC-SHA256)
 * @param {object} userProfile 
 * @returns {string} Signed JWT
 */
function generateToken(userProfile) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userProfile.email,
    name: userProfile.name,
    role: userProfile.role,
    locationId: userProfile.locationId,
    posType: userProfile.posType,
    allowedLocations: userProfile.allowedLocations,
    aiModel: userProfile.aiModel,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT session token
 * @param {string} token 
 * @returns {object|null} Decoded user session
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Extract user session from a Next.js / Node Request object
 * @param {Request} req 
 * @returns {object|null}
 */
function getSessionFromRequest(req) {
  const authHeader = req.headers?.get ? req.headers.get('authorization') : req.headers?.['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Fallback to cookie if present
  const cookieHeader = req.headers?.get ? req.headers.get('cookie') : req.headers?.['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/dankley_session=([^;]+)/);
    if (match) return verifyToken(match[1]);
  }

  // In local development / tests, fallback to default sandbox user if unauthenticated
  if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_ANONYMOUS === 'true') {
    return resolveUserProfile('developer@dankley.com');
  }

  return null;
}

module.exports = {
  isDankleyEmail,
  resolveUserProfile,
  generateToken,
  verifyToken,
  getSessionFromRequest,
  ALLOWED_DOMAIN
};
