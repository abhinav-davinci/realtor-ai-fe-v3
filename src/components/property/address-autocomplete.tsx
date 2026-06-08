"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { api, ApiError, type PlaceDetails } from "@/lib/api";

interface Prediction {
  description: string;
  place_id: string;
}

/**
 * Google-Places-backed address search. Debounced autocomplete via the backend
 * proxy; on select, resolves full place details and hands them to onSelect.
 */
export function AddressAutocomplete({
  placeholder = "Search address, locality or building…",
  onSelect,
  hideIcon = false,
  trailing,
}: {
  placeholder?: string;
  onSelect: (details: PlaceDetails) => void;
  hideIcon?: boolean;
  trailing?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  // Debounced autocomplete.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setPreds([]);
      setOpen(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.places.autocomplete(q);
        if (seq.current === id) {
          setPreds(res.predictions);
          setOpen(true);
          setError(null);
        }
      } catch (err) {
        if (seq.current === id) {
          setError(err instanceof ApiError ? err.message : "Search failed");
          setPreds([]);
        }
      } finally {
        if (seq.current === id) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function pick(p: Prediction) {
    setOpen(false);
    setQuery(p.description);
    setResolving(true);
    setError(null);
    try {
      const details = await api.places.details(p.place_id);
      onSelect(details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't fetch address details");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="focus-within:border-accent-blue/50 flex items-center gap-2.5 rounded-lg border border-black/15 bg-white px-3.5">
        {resolving ? (
          <Loader2 className="text-accent-blue size-4 shrink-0 animate-spin" />
        ) : hideIcon ? null : (
          <Search className="text-ink-muted size-4 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => preds.length && setOpen(true)}
          className="text-ink placeholder:text-ink-muted/60 h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {loading && <Loader2 className="text-ink-muted size-4 shrink-0 animate-spin" />}
        {trailing}
      </div>

      {open && preds.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg">
          {preds.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                onClick={() => pick(p)}
                className="hover:bg-accent-blue/[0.06] flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
              >
                <MapPin className="text-accent-blue mt-0.5 size-4 shrink-0" />
                <span className="text-ink">{p.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
