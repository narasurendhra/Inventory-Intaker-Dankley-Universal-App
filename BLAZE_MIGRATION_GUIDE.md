# 🔥 BLAZE POS Migration Guide

> **Target Audience**: Dankley Engineering team preparing the POS migration baseline from Alleaves to BLAZE POS.

---

## 1. Why BLAZE POS?

BLAZE POS provides modern cannabis inventory controls, robust multi-store fulfillment, and clean Metrc state traceability.
Our universal adapter architecture (`BlazePosAdapter.js`) provides an instant migration bridge so our intake mobile app and 5-minute photo workflow remain 100% identical when the switch occurs!

---

## 2. BLAZE POS Architecture & APIs

BLAZE operates two primary API surfaces:
1. **BLAZE Management API (`https://api.blaze.me/api/v1/mgmt`)**:
   - Manages Brands (`/mgmt/brands`), Strains (`/mgmt/strains`), and Products (`/mgmt/products`).
2. **BLAZE Inventory & Metrc Intake (`https://api.blaze.me/api/v1/inventory`)**:
   - Manages incoming Metrc packages (`/inventory/metrc/packages`) and batch creation (`/inventory/batches/receive`).

---

## 3. Playwright Session Sniffing for BLAZE

If direct API keys are pending BLAZE partner support:
1. Run the BLAZE sniffer:
   ```bash
   npm run sniff:blaze
   ```
2. Log into `https://admin.blaze.me/login`.
3. The sniffer automatically hooks into network traffic, grabs your BLAZE session token and `X-BLAZE-SHOP-ID`, and writes `.blaze_token.json`.
4. `BlazePosAdapter` automatically loads this token for all intake operations!

---

## 4. Testing BLAZE POS Adapter

Verify the adapter locally:
```bash
cd intake-dashboard
npx jest tests/blaze-adapter.test.js
```
The test verifies:
- Identity and type (`blaze`).
- Category and brand mappings.
- Batch intake payload formatting.

---

*Dankley Migration Lead — October 2026*
