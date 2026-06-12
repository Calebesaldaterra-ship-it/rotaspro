"use client";

import { useEffect, useRef, useState } from "react";

export type GeoResult = {
  label: string;
  fullLabel: string;
  lat: number;
  lon: number;
  uf: string | null;
};

export default function SearchInput({
  placeholder,
  value,
  onSelect,
  onClear,
}: {
  placeholder: string;
  value: string;
  onSelect: (r: GeoResult) => void;
  onClear?: () => void;
}) {
  const [text, setText] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function search(q: string) {
    setText(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 450);
  }

  return (
    <div ref={box} className="relative">
      <input
        value={text}
        onChange={(e) => search(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
      )}
      {!loading && text && (
        <button
          type="button"
          aria-label="Limpar"
          onClick={() => {
            setText("");
            setResults([]);
            onClear?.();
          }}
          className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
        >
          ×
        </button>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setText(r.label);
                  setOpen(false);
                }}
                className="block w-full px-3.5 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {r.label}
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {r.fullLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
