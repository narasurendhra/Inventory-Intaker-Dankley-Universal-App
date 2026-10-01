/**
 * PlaywrightSessionSniffer.js
 * 
 * Reusable Headless Browser Session Interceptor & Network Sniffer Engine.
 * 
 * Cannabis POS systems (Alleaves, Dutchie, BLAZE) frequently lack public developer
 * APIs or OAuth tools. This engine automates:
 * 1. Headless browser login into the dispensary POS backoffice.
 * 2. Real-time network sniffing on page requests and responses to intercept
 *    ephemeral JWT Bearer tokens, CSRF tokens, shop IDs, and internal API routes.
 * 3. Local token caching with automatic expiry detection and self-healing refresh.
 */

const fs = require('fs');
const path = require('path');

class PlaywrightSessionSniffer {
  /**
   * @param {object} options
   * @param {string} options.posKey POS identifier ('dutchie' | 'blaze' | 'alleaves')
   * @param {string} options.loginUrl Backoffice login URL
   * @param {string} options.username Login username / email
   * @param {string} options.password Login password
   * @param {string} options.usernameSelector CSS selector for username field
   * @param {string} options.passwordSelector CSS selector for password field
   * @param {string} options.submitSelector CSS selector for submit button
   * @param {RegExp|string} options.tokenUrlPattern URL pattern to match for auth token response
   * @param {function} options.extractToken Custom token extractor from response/request
   */
  constructor(options) {
    this.posKey = options.posKey || 'unknown_pos';
    this.loginUrl = options.loginUrl;
    this.username = options.username;
    this.password = options.password;
    this.usernameSelector = options.usernameSelector || 'input[type="email"], input[type="text"], #username, #email';
    this.passwordSelector = options.passwordSelector || 'input[type="password"], #password';
    this.submitSelector = options.submitSelector || 'button[type="submit"], input[type="submit"]';
    this.tokenUrlPattern = options.tokenUrlPattern || /auth|login|token|graphql/i;
    this.extractToken = options.extractToken || this._defaultTokenExtractor;

    this.tokenCachePath = path.resolve(process.cwd(), `.${this.posKey}_token.json`);
    this.cachedSession = null;
  }

  _defaultTokenExtractor(response, jsonBody, headers) {
    if (jsonBody?.token) return jsonBody.token;
    if (jsonBody?.data?.token) return jsonBody.data.token;
    if (jsonBody?.access_token) return jsonBody.access_token;
    if (jsonBody?.jwt) return jsonBody.jwt;

    // Check Authorization header in request
    const reqAuth = response.request().headers()['authorization'];
    if (reqAuth && reqAuth.startsWith('Bearer ')) {
      return reqAuth.substring(7);
    }
    return null;
  }

  loadCachedSession() {
    try {
      if (fs.existsSync(this.tokenCachePath)) {
        const raw = fs.readFileSync(this.tokenCachePath, 'utf8');
        this.cachedSession = JSON.parse(raw);
        return this.cachedSession;
      }
    } catch (e) {
      console.warn(`[SNIFFER:${this.posKey}] Failed reading token cache:`, e.message);
    }
    return null;
  }

  isSessionExpired(session = this.cachedSession) {
    if (!session || !session.token) return true;

    // If explicit expiresAt timestamp exists
    if (session.expiresAt && Date.now() > session.expiresAt - 60000) return true;

    // Try parsing JWT payload
    try {
      const parts = session.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.exp) {
          // Buffer 5 minutes
          return (Date.now() / 1000) > (payload.exp - 300);
        }
      }
    } catch (e) {
      // Non-JWT token, check file age (assume 8 hour expiry)
      if (session.timestamp) {
        return (Date.now() - session.timestamp) > (8 * 60 * 60 * 1000);
      }
    }

    return false;
  }

  saveSession(sessionData) {
    const payload = {
      posKey: this.posKey,
      token: sessionData.token,
      shopId: sessionData.shopId || null,
      headers: sessionData.headers || {},
      timestamp: Date.now(),
      ...sessionData
    };
    this.cachedSession = payload;
    fs.writeFileSync(this.tokenCachePath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[SNIFFER:${this.posKey}] Session token successfully saved to ${path.basename(this.tokenCachePath)}`);
    return payload;
  }

  /**
   * Acquire a valid session: checks cache first, then executes headless Playwright sniffer
   * @param {boolean} forceRefresh Force a new login attempt
   * @returns {Promise<object>} Session containing token and auth headers
   */
  async getValidSession(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.loadCachedSession();
      if (cached && !this.isSessionExpired(cached)) {
        return cached;
      }
    }

    return this.refreshSessionViaPlaywright();
  }

  /**
   * Launch Playwright, perform login, and intercept authenticated network traffic
   */
  async refreshSessionViaPlaywright() {
    let playwright;
    try {
      playwright = require('playwright');
    } catch (e) {
      console.warn(`[SNIFFER:${this.posKey}] Playwright not installed in environment. Returning mock fallback session.`);
      return this.saveSession({ token: `mock_${this.posKey}_token_${Date.now()}`, mock: true });
    }

    console.log(`[SNIFFER:${this.posKey}] Launching headless browser to refresh POS session...`);
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeoutId = setTimeout(async () => {
        if (!resolved) {
          resolved = true;
          await browser.close().catch(() => {});
          reject(new Error(`[SNIFFER:${this.posKey}] Login timeout: failed to intercept token within 30s.`));
        }
      }, 30000);

      // Listen for authenticated network traffic
      page.on('response', async (response) => {
        const url = response.url();
        const matchesUrl = typeof this.tokenUrlPattern === 'string'
          ? url.includes(this.tokenUrlPattern)
          : this.tokenUrlPattern.test(url);

        if (matchesUrl && response.request().method() !== 'OPTIONS') {
          try {
            let json = null;
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              json = await response.json().catch(() => null);
            }

            const token = this.extractToken(response, json, response.headers());
            if (token && !resolved) {
              resolved = true;
              clearTimeout(timeoutId);

              const session = this.saveSession({
                token,
                interceptedUrl: url,
                cookies: await context.cookies()
              });

              await browser.close().catch(() => {});
              resolve(session);
            }
          } catch (err) {
            // Ignore parse errors on preflight or non-JSON payloads
          }
        }
      });

      // Execute login sequence
      page.goto(this.loginUrl, { waitUntil: 'domcontentloaded' }).then(async () => {
        try {
          await page.waitForSelector(this.usernameSelector, { timeout: 10000 });
          await page.fill(this.usernameSelector, this.username);
          await page.fill(this.passwordSelector, this.password);
          await page.click(this.submitSelector);
          console.log(`[SNIFFER:${this.posKey}] Submitted login credentials. Sniffing network for token...`);
        } catch (fillErr) {
          console.warn(`[SNIFFER:${this.posKey}] Form interaction issue: ${fillErr.message}`);
        }
      }).catch(err => {
        if (!resolved) {
          clearTimeout(timeoutId);
          browser.close().catch(() => {});
          reject(err);
        }
      });
    });
  }
}

module.exports = PlaywrightSessionSniffer;
