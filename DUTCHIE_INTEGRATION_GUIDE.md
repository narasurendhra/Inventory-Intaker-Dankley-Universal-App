# 🛒 Dutchie POS Integration & Sniffing Guide

> **Target Audience**: Dankley North / Manhattan developer team connecting the universal intake app to Dutchie POS.

---

## 1. Understanding Dutchie POS Architecture

In Dutchie, product inventory operates in two distinct tiers:
1. **Product Catalog (The Shell)**: Defines the commercial SKU (`name`, `brand`, `category`, `strain`, `weight`, `retailPrice`).
2. **Inventory Packages (The Metrc Batches)**: Binds a specific 24-character Metrc RFID tag (`1A4120300...`), wholesale cost, quantity, batch lot, expiration date, and lab test results to a Product Catalog shell.

---

## 2. Reverse-Engineering Dutchie via Playwright Sniffer

Because Dutchie developer portal access can take weeks to provision, you can immediately sniff and automate your dispensary's Dutchie backoffice:

### Step 1: Run the Interactive Sniffer
From the root directory:
```bash
npm run sniff:dutchie
```
This launches a browser window pointing to `https://admin.dutchie.com/`.

### Step 2: Log into your Dutchie Dispensary Account
Type your username and password into Dutchie. 
As soon as Dutchie responds:
- The script intercepts the `Authorization: Bearer <JWT>` header or session cookie.
- It writes the credentials to `.dutchie_token.json`.
- It records all subsequent GraphQL and REST network requests to `network_logs_dutchie_[timestamp].json`.

### Step 3: Perform One Manual Intake in Dutchie UI
Navigate to **Inventory -> Packages -> Intake** in the Dutchie browser window and receive one item.
Press `Ctrl+C` in your terminal.
Open `network_logs_dutchie_[timestamp].json` and search for the intake endpoint (e.g. `/api/v1/inventory/intake` or GraphQL `IntakePackageMutation`).

---

## 3. DutchiePosAdapter Implementation Details

In `src/lib/posAdapters/DutchiePosAdapter.js`:

### Category Mapping Table
Dankley standard categories map to Dutchie internal types:
| Dankley POS Category | Dutchie Product Type |
|---|---|
| `Flower > Bud` | `Flower` |
| `Flower > Prerolls` | `Pre-roll` |
| `Vapes > All-in-One Vapes > Distillate` | `Vaporizer` |
| `Edibles > Gummies` | `Edible` |
| `Concentrates > Live Resin` | `Concentrate` |

### Intake Submission Payload
When the operator taps "Submit Intake" in the mobile app, `DutchiePosAdapter.submitBatch()` translates the synthesized items into:
```json
{
  "manifestNumber": "0000421406",
  "vendor": "NanoCann Inc.",
  "packageTag": "1A4120300002166000004533",
  "productName": "Cookies | Apples & Bananas x Huckleberry Gelato | Dual AIO | 2g",
  "brand": "Cookies",
  "strain": "Apples & Bananas x Huckleberry Gelato",
  "category": "Vapes > All-in-One Vapes > Distillate",
  "batchNumber": "CK-AB-HG-2G-0926",
  "expirationDate": "09/26/27",
  "quantity": 25,
  "cost": 35.00,
  "retailPrice": 0.00,
  "priceOtd": 0.00,
  "thcPercent": 91.02,
  "usableWeight": 2.0,
  "uom": "Grams"
}
```

---

## 4. Testing Your Dutchie Integration

You can test without live packages using our simulated Dutchie test:
```bash
cd intake-dashboard
npx jest tests/dutchie-adapter.test.js
```
To test with live Dutchie credentials, add your keys to `.env.local`:
```env
DUTCHIE_API_KEY=your_key_here
DUTCHIE_LOCATION_ID=your_location_id_here
```
And re-run the test suite!
