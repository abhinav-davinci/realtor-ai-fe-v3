"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Stage = "idle" | "parsing" | "ready" | "error" | "importing" | "done";

interface Parsed {
  total: number; // data rows with content
  unique: number; // distinct phone numbers (what gets imported)
  duplicates: number; // total - unique
}

const MAX_MB = 10;
// A few colours for the success burst (rare, first-time moment, so a little delight).
const CONFETTI: { tx: number; r: number; color: string }[] = [
  { tx: -46, r: -90, color: "bg-brand-orange" },
  { tx: -16, r: 40, color: "bg-accent-blue" },
  { tx: 18, r: -40, color: "bg-brand-green" },
  { tx: 48, r: 100, color: "bg-brand-orange" },
];

const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const normPhone = (s: string) => s.replace(/\D/g, "").replace(/^0+/, "").slice(-10);

export function UploadLeadsModal({ onClose, onImported }: { onClose: () => void; onImported?: (count: number) => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Land focus inside the dialog on open.
  useEffect(() => {
    dropRef.current?.focus();
  }, []);

  async function handleFile(f: File) {
    setFile(f);
    setError("");
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      setStage("error");
      setError("That file type is not supported. Upload an .xlsx, .xls, or .csv file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setStage("error");
      setError(`That file is over ${MAX_MB} MB. Please upload a smaller one.`);
      return;
    }
    setStage("parsing");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
      if (aoa.length < 2) {
        setStage("error");
        setError("That file looks empty. Add your contacts and try again.");
        return;
      }
      const headers = (aoa[0] as unknown[]).map((h) => String(h).toLowerCase().trim());
      const phoneCol = headers.findIndex((h) => /phone|mobile|number|contact/.test(h));
      if (phoneCol < 0) {
        setStage("error");
        setError("We could not find a phone column. Download the template to see the format.");
        return;
      }
      const rows = aoa.slice(1).filter((r) => (r as unknown[]).some((c) => String(c).trim() !== ""));
      const phones = new Set<string>();
      for (const r of rows) {
        const p = normPhone(String((r as unknown[])[phoneCol] ?? ""));
        if (p.length >= 10) phones.add(p);
      }
      if (phones.size === 0) {
        setStage("error");
        setError("No valid phone numbers found. Check the phone column and try again.");
        return;
      }
      setParsed({ total: rows.length, unique: phones.size, duplicates: Math.max(0, rows.length - phones.size) });
      setStage("ready");
    } catch {
      setStage("error");
      setError("We could not read that file. Please try again.");
    }
  }

  function reset() {
    setFile(null);
    setParsed(null);
    setError("");
    setStage("idle");
  }

  function downloadTemplate() {
    const csv = "Name,Phone,Email\nRahul Sharma,9876543210,rahul@example.com\nPriya Nair,9123456780,priya@example.com\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "trythat-lead-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport() {
    if (!parsed) return;
    setStage("importing");
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 9);
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => {
          setStage("done");
          onImported?.(parsed.unique);
        }, 280);
      }
    }, 110);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upload your lead list"
        className="modal-pop w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {stage === "done" ? (
          /* ------------------------------ success ----------------------------- */
          <div className="py-2 text-center">
            <div className="relative mx-auto size-16">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cn("absolute top-1/2 left-1/2 size-1.5 rounded-[2px] opacity-0 motion-safe:animate-[confetti-pop_1100ms_ease-out_forwards]", c.color)}
                  style={{ "--tx": `${c.tx}px`, "--peak-y": "-50px", "--fall-y": "92px", "--r": `${c.r}deg`, animationDelay: `${120 + i * 50}ms` } as React.CSSProperties}
                />
              ))}
              <span className="bg-brand-green/10 text-brand-green relative grid size-full place-items-center rounded-2xl motion-safe:animate-[tick-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
                <CheckCircle2 className="size-9" />
              </span>
            </div>
            <h2 className="text-ink mt-4 text-lg font-bold">{parsed?.unique} leads added</h2>
            <p className="text-ink-muted mx-auto mt-1.5 max-w-xs text-sm">
              Your AI agents will start reaching out. New leads will appear in your list shortly.
            </p>
            <Button onClick={onClose} className="bg-brand-green hover:bg-brand-green-hover mx-auto mt-5 h-11 w-full max-w-[220px] rounded-lg text-sm font-semibold text-white">
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg">
                  <UploadCloud className="size-5" />
                </span>
                <h2 className="text-ink text-lg font-bold">Upload your lead list</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink hover:bg-black/[0.04] -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg">
                <X className="size-5" />
              </button>
            </div>

            <p className="text-ink-muted mt-2 text-sm">
              Drop an Excel or CSV with <span className="text-ink font-semibold">name</span>, <span className="text-ink font-semibold">phone</span>, and{" "}
              <span className="text-ink font-semibold">email</span>. Phones are normalised to +91XXXXXXXXXX and duplicates are skipped.
            </p>

            <button
              type="button"
              onClick={downloadTemplate}
              className="text-accent-blue hover:bg-accent-blue/[0.06] border-accent-blue/30 mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30"
            >
              <Download className="size-4" /> Download template
            </button>

            {/* importing */}
            {stage === "importing" ? (
              <div className="mt-4 grid place-items-center rounded-xl border border-black/[0.08] bg-black/[0.015] py-8 text-center">
                <span className="bg-accent-blue/10 text-accent-blue grid size-12 place-items-center rounded-full">
                  <Loader2 className="size-5 animate-spin" />
                </span>
                <p className="text-ink mt-3 text-sm font-semibold">Importing your leads...</p>
                <div className="bg-black/[0.06] mt-3 h-1.5 w-48 overflow-hidden rounded-full">
                  <div className="bg-accent-blue h-full rounded-full transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-ink-muted mt-2 text-xs tabular-nums">{progress}%</p>
              </div>
            ) : stage === "error" ? (
              /* error */
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-4 text-center" style={{ animation: "scale-in 180ms ease-out both" }}>
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle className="size-5" />
                </span>
                <p className="text-ink mt-3 text-sm font-semibold">We could not import that file</p>
                <p className="text-ink-muted mx-auto mt-1 max-w-xs text-xs">{error}</p>
                <button type="button" onClick={reset} className="text-accent-blue mt-3 text-xs font-semibold outline-none hover:underline">
                  Choose another file
                </button>
              </div>
            ) : stage === "ready" && file && parsed ? (
              /* ready: parsed file card */
              <div className="mt-4 rounded-xl border border-black/[0.08] bg-white p-3.5" style={{ animation: "scale-in 180ms ease-out both" }}>
                <div className="flex items-center gap-3">
                  <span className="bg-brand-green/10 text-brand-green grid size-10 shrink-0 place-items-center rounded-lg">
                    <FileSpreadsheet className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-semibold">{file.name}</p>
                    <p className="text-ink-muted text-xs">{fmtSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={reset} aria-label="Remove file" className="text-ink-muted hover:text-red-500 hover:bg-red-50 grid size-8 shrink-0 place-items-center rounded-lg">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="bg-brand-green/[0.07] mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                  <CheckCircle2 className="text-brand-green size-4 shrink-0" />
                  <span className="text-ink">
                    <span className="font-bold tabular-nums">{parsed.unique}</span> contacts ready to import
                    {parsed.duplicates > 0 && (
                      <span className="text-ink-muted">
                        {" "}· {parsed.duplicates} duplicate{parsed.duplicates > 1 ? "s" : ""} skipped
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              /* idle / parsing dropzone */
              <button
                ref={dropRef}
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (stage !== "parsing") setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                aria-label="Upload a file by dragging it here or clicking to browse"
                className={cn(
                  "mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent-blue/30",
                  dragging ? "border-accent-blue bg-accent-blue/[0.06]" : "hover:border-accent-blue/50 border-black/15 hover:bg-black/[0.015]"
                )}
              >
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full transition-transform",
                    dragging ? "bg-accent-blue scale-110 text-white" : "bg-accent-blue/10 text-accent-blue"
                  )}
                >
                  {stage === "parsing" ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                </span>
                <p className="text-ink text-sm font-semibold">
                  {stage === "parsing" ? "Reading your file..." : dragging ? "Drop to upload" : "Drag and drop, or click to browse"}
                </p>
                <p className="text-ink-muted text-xs">.xlsx, .xls, .csv up to 10 MB</p>
              </button>
            )}

            {/* footer */}
            {stage !== "importing" && (
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onClose} className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
                  Cancel
                </Button>
                {stage === "ready" && parsed && (
                  <Button onClick={doImport} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
                    Import {parsed.unique} {parsed.unique === 1 ? "lead" : "leads"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
