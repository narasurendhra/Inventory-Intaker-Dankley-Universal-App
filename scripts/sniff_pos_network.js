#!/usr/bin/env node

/**
 * scripts/sniff_pos_network.js
 * 
 * Interactive Playwright Network Sniffer & POS Reverse-Engineering Tool.
 * 
 * Usage:
 *   node scripts/sniff_pos_network.js --pos dutchie
 *   node scripts/sniff_pos_network.js --pos blaze
 *   node scripts/sniff_pos_network.js --pos alleaves
 * 
 * What this does:
 * 1. Opens a live browser window for manual or automated login into your dispensary POS backoffice.
 * 2. Intercepts all outgoing requests and responses, automatically sniffing out:
 *    - Bearer Tokens, API Keys, Session Cookies, and CSRF tokens.
 *    - GraphQL queries and REST endpoints for inventory intake, batches, and product catalogs.
 * 3. Saves intercepted authentication credentials directly to .[pos]_token.json so the intake app
 *    can immediately make headless API calls without needing official developer portal keys.
 * 4. Exports a complete trace of network payloads to network_logs_[pos].json for developer analysis.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const posArgIdx = args.indexOf('--pos');
const targetPos = posArgIdx !== -1 && args[posArgIdx + 1] ? args[posArgIdx + 1].toLowerCase() : 'dutchie';

const POS_TARGETS = {
  dutchie: {
    name: 'Dutchie POS Backoffice',
    startUrl: 'https://admin.dutchie.com/',
    tokenPattern: /token|auth|graphql|session/i,
    cacheFile: '.dutchie_token.json'
  },
  blaze: {
    name: 'BLAZE POS Admin',
    startUrl: 'https://admin.blaze.me/login',
    tokenPattern: /blaze\.me\/api|auth|login|mgmt/i,
    cacheFile: '.blaze_token.json'
  },
  alleaves: {
    name: 'Alleaves ERP Backoffice',
    startUrl: 'https://app.alleaves.com/',
    tokenPattern: /api\/auth|inventory|metrc/i,
    cacheFile: '.alleaves_token.json'
  }
};

const config = POS_TARGETS[targetPos] || POS_TARGETS['dutchie'];

(async () => {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('Playwright is required to run the network sniffer. Install via: npm install playwright');
    process.exit(1);
  }

  console.log('==============================================================================');
  console.log(`🚀 Starting Playwright Network Sniffer for ${config.name}`);
  console.log(`Target URL: ${config.startUrl}`);
  console.log(`Token Cache Target: ${config.cacheFile}`);
  console.log('==============================================================================');
  console.log('A visible browser window will open now. Please log into your dispensary account.');
  console.log('The sniffer is actively listening to intercept your bearer token and API routes...\n');

  const browser = await playwright.chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  const networkLogs = [];
  const logFilePath = path.resolve(process.cwd(), `network_logs_${targetPos}_${Date.now()}.json`);
  let tokenCaptured = false;

  page.on('response', async (response) => {
    const request = response.request();
    const url = request.url();
    const method = request.method();
    const status = response.status();

    if (method === 'OPTIONS') return;

    try {
      const contentType = response.headers()['content-type'] || '';
      const postData = request.postData() || null;
      let responseBody = null;

      if (contentType.includes('application/json')) {
        responseBody = await response.json().catch(() => null);
      }

      // Check request headers for Authorization Bearer
      const reqHeaders = request.headers();
      const authHeader = reqHeaders['authorization'] || reqHeaders['x-blaze-api-key'] || reqHeaders['x-dutchie-token'];
      
      let discoveredToken = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        discoveredToken = authHeader.substring(7);
      } else if (authHeader) {
        discoveredToken = authHeader;
      } else if (responseBody?.token || responseBody?.data?.token || responseBody?.access_token) {
        discoveredToken = responseBody.token || responseBody.data?.token || responseBody.access_token;
      }

      if (discoveredToken && (!tokenCaptured || discoveredToken.length > 20)) {
        tokenCaptured = true;
        const tokenCachePath = path.resolve(process.cwd(), config.cacheFile);
        const cacheData = {
          pos: targetPos,
          token: discoveredToken,
          sourceUrl: url,
          interceptedHeaders: reqHeaders,
          timestamp: Date.now(),
          capturedAt: new Date().toISOString()
        };
        fs.writeFileSync(tokenCachePath, JSON.stringify(cacheData, null, 2), 'utf8');
        console.log(`\n🎉 [TOKEN SNIFFED!] Successfully intercepted and saved credentials to ${config.cacheFile}`);
      }

      const logEntry = {
        time: new Date().toISOString(),
        method,
        status,
        url,
        requestPayload: postData,
        responseBody
      };

      networkLogs.push(logEntry);
      fs.writeFileSync(logFilePath, JSON.stringify(networkLogs, null, 2), 'utf8');

      if (status >= 200 && status < 400 && config.tokenPattern.test(url)) {
        console.log(`[Captured ${status}] ${method} ${url.substring(0, 90)}`);
      }
    } catch (err) {}
  });

  await page.goto(config.startUrl);

  console.log('\n[INFO] You are in control of the browser. Perform your actions in the POS UI.');
  console.log(`Press Ctrl+C in this terminal when finished to finalize logs.\n`);

  await new Promise(() => {});
})();
