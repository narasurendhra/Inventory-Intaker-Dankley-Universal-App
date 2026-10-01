# 🕵️‍♂️ Playwright POS Reverse-Engineering & Network Sniffing Playbook

> **The Dankley Standard**: How to connect to ANY cannabis POS (Alleaves, Dutchie, BLAZE, Flowhub, Treez) in under 15 minutes using Playwright network interception.

---

## The Core Problem
Cannabis dispensary software companies are notoriously slow to grant official developer API access or provide OAuth tooling. Waiting for developer portal keys can delay store launches by months.

## The Solution: Headless Session Sniffing
Instead of waiting, we treat the POS web application as an open API client:
1. Every web backoffice talks to an underlying JSON REST or GraphQL backend.
2. When a human logs in, the browser receives an **authenticated session token** (JWT Bearer, session cookie, or custom header).
3. By running a controlled browser with Playwright, we listen to network events, intercept that token, and reuse it for headless machine-to-machine automation.

---

## Step-by-Step Playbook

### 1. Launch the Sniffer
```bash
node scripts/sniff_pos_network.js --pos [dutchie|blaze|alleaves]
```

### 2. Perform the Manual Action
In the browser window that opens:
- Log into your dispensary store.
- Navigate to the page you want to automate (e.g. Products list, Intake page, Metrc transfer screen).
- Perform one creation or search.

### 3. Review the Captured Logs
Look in your workspace root for:
- `network_logs_[pos]_[timestamp].json`: Contains every single HTTP request, URL, method, query parameter, request payload, and JSON response body.
- `.[pos]_token.json`: The intercepted Bearer token and headers.

### 4. Wire the Endpoints into your Adapter
Open your POS adapter (e.g. `DutchiePosAdapter.js` or `BlazePosAdapter.js`):
- Copy the exact URL paths from `network_logs.json`.
- Match the JSON payload schema.
- Your app is now fully integrated with live dispensary inventory!

---

*Dankley Engineering Playbook — October 2026*
