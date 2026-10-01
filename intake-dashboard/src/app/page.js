'use client';

import React, { useState, useEffect } from 'react';

export default function HomePage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pos/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="border-b border-neutral-800 pb-8 mb-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-block bg-emerald-950 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider mb-2">
              Dankley Universal Shell
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Inventory Intake & POS Bridge
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Multi-tenant, POS-agnostic cannabis intake orchestrator powered by Google Gemini Vision.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-neutral-900 border border-neutral-700 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Active POS: {loading ? 'Loading...' : config?.posName || 'Dutchie / BLAZE / Alleaves'}
            </span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="text-emerald-400 font-bold text-sm uppercase mb-1">Workflow Target</div>
          <h2 className="text-xl font-bold text-white mb-2">5-Minute Intake</h2>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Photograph the paper shipping manifest and SKU packaging labels. Gemini Vision extracts potencies, batches, and strain lineages in real-time.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="text-emerald-400 font-bold text-sm uppercase mb-1">POS Agnostic</div>
          <h2 className="text-xl font-bold text-white mb-2">Multi-Store Routing</h2>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Dynamic adapters for Dutchie POS, BLAZE POS, and Alleaves ERP. Operators at any @dankley.com store provision inventory effortlessly.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="text-emerald-400 font-bold text-sm uppercase mb-1">Playwright Sniffer</div>
          <h2 className="text-xl font-bold text-white mb-2">Headless Session Engine</h2>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Bypasses the lack of public POS APIs by using automated headless Playwright login & network traffic sniffing to capture bearer tokens.
          </p>
        </div>
      </section>

      <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Configured Store Locations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(config?.locations || [
            { id: 'queens', name: 'Dankley Queens (Current Alleaves)', posType: 'alleaves' },
            { id: 'queens_blaze', name: 'Dankley Queens (Blaze Migration Target)', posType: 'blaze' },
            { id: 'manhattan_dutchie', name: 'Dankley Manhattan (Dutchie)', posType: 'dutchie' },
            { id: 'sandbox', name: 'Universal Developer Sandbox', posType: 'mock' }
          ]).map((loc, idx) => (
            <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">{loc.name}</div>
                <div className="text-xs text-neutral-500">ID: {loc.id}</div>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono rounded bg-neutral-800 text-emerald-300 uppercase">
                {loc.posType}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
