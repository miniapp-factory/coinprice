"use client";

import { useEffect, useState, useRef } from "react";

const SYMBOLS = ["BTC", "ETH", "SOL"] as const;
type Symbol = typeof SYMBOLS[number];

interface PriceData {
  price: number;
  symbol: Symbol;
}

const STORAGE_KEY = "priceHistory";

export default function PriceDashboard() {
  const [prices, setPrices] = useState<Record<Symbol, number>>({
    BTC: 0,
    ETH: 0,
    SOL: 0,
  });

  const [history, setHistory] = useState<Record<Symbol, number[]>>({
    BTC: [],
    ETH: [],
    SOL: [],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch price for a single symbol
  const fetchPrice = async (symbol: Symbol) => {
    try {
      const res = await fetch(
        `/api/prices?symbol=${symbol}`
      );
      const data: PriceData = await res.json();
      return data.price;
    } catch {
      return null;
    }
  };

  // Update prices every 30 seconds
  useEffect(() => {
    const update = async () => {
      const newPrices: Record<Symbol, number> = { BTC: 0, ETH: 0, SOL: 0 };
      for (const sym of SYMBOLS) {
        const p = await fetchPrice(sym);
        if (p !== null) newPrices[sym] = p;
      }
      setPrices(newPrices);
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const newHist = { ...history };
    for (const sym of SYMBOLS) {
      newHist[sym] = [...(newHist[sym] ?? []), prices[sym]];
    }
    setHistory(newHist);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHist));
  }, [prices]);

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    SYMBOLS.forEach((sym, idx) => {
      const data = history[sym];
      if (!data || data.length === 0) return;

      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;
      const pad = range * 0.1;

      ctx.beginPath();
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min + pad) / (range + 2 * pad)) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = ["#4ade80", "#3b82f6", "#f59e0b"][idx];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Moving dot
      const lastX = width;
      const lastY = height - ((data[data.length - 1] - min + pad) / (range + 2 * pad)) * height;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#4ade80";
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 10;
      ctx.fill();
    });
  }, [history]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chainlink Price Feed Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {SYMBOLS.map((sym) => (
          <div key={sym} className="border rounded p-4">
            <h2 className="text-xl font-semibold">{sym}</h2>
            <p className="text-4xl font-bold">${prices[sym].toFixed(2)}</p>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} width={800} height={400} className="w-full border rounded" />
    </div>
  );
}
