"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setBulkUpload } from "@/lib/bulk-upload";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  Loader2,
  MapPin,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type RowStatus = "complete" | "error";

interface ResultRow {
  name: string;
  loc: string;
  status: RowStatus;
  detail: string;
}

/* ---------- CSV parsing ---------- */

/** Minimal CSV parser that handles quoted fields, commas and newlines inside quotes. */
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

/** Parse the first sheet of an .xlsx/.xls file into rows keyed by lowercased
 * headers — mirrors parseCSV so the downstream mapping is identical. xlsx is
 * lazy-loaded so it isn't in the main bundle. */
async function parseExcel(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
  const nonEmpty = aoa.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const headers = nonEmpty[0].map((h) => String(h ?? "").trim().toLowerCase());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = String(r[idx] ?? "").trim()));
    return obj;
  });
}

function numOrNull(s: string): number | null {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function parseAmount(s: string): number | null {
  if (!s) return null;
  const low = s.toLowerCase();
  const n = parseFloat(low.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return null;
  if (low.includes("cr")) return n * 1e7;
  if (low.includes("lakh") || low.includes("lac")) return n * 1e5;
  return n;
}

const VALID_TYPES = ["residential", "commercial", "land"];

/** Map one CSV row → backend listing payload (mandatory fields filled). */
function buildBulkPayload(row: Record<string, string>): Record<string, unknown> {
  const g = (k: string) => (row[k] ?? "").trim();
  const isRent = g("available_for").toLowerCase().includes("rent");
  const amenities = g("amenities")
    .split(/[;|]/)
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  const has = (k: string) => amenities.some((a) => a.includes(k));
  const ptype = g("property_type").toLowerCase();
  const amount = parseAmount(g("price"));
  const data: Record<string, unknown> = {
    property_title: g("title") || "Untitled Property",
    description: g("description") || g("title") || "Imported listing",
    property_type: VALID_TYPES.includes(ptype) ? ptype : "residential",
    category: g("category") || "apartment_flats",
    listing_as: g("listing_as") || "owner",
    bedrooms: numOrNull(g("bedrooms")),
    bathrooms: numOrNull(g("bathrooms")),
    chargeable_area: numOrNull(g("area_sqft")),
    area_sqft: numOrNull(g("area_sqft")),
    property_on_floor: numOrNull(g("floor")) ?? 1,
    total_floors: numOrNull(g("total_floors")) ?? 1,
    year_of_construction: g("year") || "2020",
    unit_type_preference: "sq-ft",
    city: g("city") || null,
    state: g("state") || null,
    locality: g("locality") || null,
    building_name: g("building_name") || null,
    property_available_for: isRent ? "rent" : "sale",
    listing_status: "active",
    gym: has("gym"),
    swimming_pool: has("pool") || has("swim"),
    lift: has("lift"),
    security: has("security"),
    garden: has("garden"),
    club_house: has("club"),
    power_backup: has("power"),
    balcony: has("balcony"),
  };
  if (isRent) data.rent_rate = amount;
  else data.sale_rate = amount;
  if (g("price")) data.price = g("price");
  return data;
}

const SAMPLE_CSV = `title,property_type,category,bedrooms,bathrooms,area_sqft,price,available_for,city,locality,state,building_name,floor,total_floors,year,amenities
Spacious 3 BHK with Balcony,residential,apartment_flats,3,2,1500,90 Lakhs,sale,Pune,Baner,Maharashtra,Sunrise Towers,5,12,2021,Gym;Swimming Pool;Lift
Cozy 2 BHK near Metro,residential,apartment_flats,2,2,950,25000,rent,Mumbai,Andheri West,Maharashtra,Green Heights,3,9,2019,Gym;Security;Garden
Premium Office Space,commercial,office_spaces,,2,2200,1.2 Cr,sale,Bengaluru,Whitefield,Karnataka,Tech Park One,8,20,2020,Lift;Power Backup
`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-properties.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- UI ---------- */

const TABS: { key: "all" | RowStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "complete", label: "Listed" },
  { key: "error", label: "Failed" },
];

function StatusBadge({ status }: { status: RowStatus }) {
  return status === "complete" ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
      <CircleCheck className="size-4" />
      Listed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
      <CircleAlert className="size-4" />
      Failed
    </span>
  );
}

/** Simulated preview for PDF/Word until the backend extraction pipeline exists. */
const SAMPLE_DOC_ROWS: Record<string, string>[] = [
  { title: "Premium 3BHK in Raheja Vistas, NIBM", property_type: "Residential", locality: "Baner", city: "Pune", price: "₹4.2Lakh", area_sqft: "Chargeable- 1200 sq.ft.", amenities: "Car parking, garden, gym, pool, clubhouse" },
  { title: "Premium 3BHK in Raheja Vistas, NIBM", property_type: "Residential", locality: "Baner", city: "Pune", price: "₹4.2Lakh", area_sqft: "Chargeable- 1200 sq.ft.", amenities: "Car parking, garden, gym, pool, clubhouse" },
];

function fileKind(name: string): { isExcel: boolean; isCsv: boolean; isDoc: boolean; badge: string } {
  const n = name.toLowerCase();
  const isExcel = /\.xlsx?$/.test(n);
  const isCsv = n.endsWith(".csv");
  const isDoc = /\.(pdf|docx?)$/.test(n);
  const badge = isExcel ? "XLS" : isCsv ? "CSV" : n.endsWith(".pdf") ? "PDF" : isDoc ? "DOC" : "FILE";
  return { isExcel, isCsv, isDoc, badge };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Preview {
  rows: Record<string, string>[];
  total: number;
  missingLoc: number;
  simulated: boolean;
}

export function BulkUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"upload" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | RowStatus>("all");
  // Phase 1 upload UX
  const [parsing, setParsing] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const router = useRouter();

  // Read a freshly-picked file: show the upload loader, then a preview table.
  async function loadPreview(f: File) {
    setFile(f);
    setFileError(null);
    setPreview(null);
    const { isExcel, isCsv, isDoc } = fileKind(f.name);
    if (!isExcel && !isCsv && !isDoc) {
      setFileError("Please upload an Excel (.xlsx / .xls), CSV, PDF, or Word document.");
      return;
    }
    setParsing(true);
    setUploadPct(0);
    for (let p = 15; p <= 90; p += 25) {
      await sleep(140);
      setUploadPct(p);
    }
    let rows: Record<string, string>[] = [];
    let simulated = false;
    try {
      if (isExcel) rows = await parseExcel(f);
      else if (isCsv) rows = parseCSV(await f.text());
      else {
        rows = SAMPLE_DOC_ROWS; // PDF/Word: simulated until backend extraction exists
        simulated = true;
      }
    } catch {
      setParsing(false);
      setFileError(`Could not read the file.`);
      return;
    }
    setUploadPct(100);
    await sleep(180);
    if (rows.length === 0) {
      setParsing(false);
      setFileError("No data rows found. The file needs a header row plus at least one property.");
      return;
    }
    const missingLoc = rows.filter(
      (r) => !(r["locality"] || r["city"] || r["location"] || r["state"] || "").trim()
    ).length;
    setPreview({ rows, total: rows.length, missingLoc, simulated });
    setParsing(false);
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setFileError(null);
    setParsing(false);
  }

  // "Okay, Continue": start the bulk job and hand off to the method-select page,
  // which shows the progress banner → review-table page (Phase 2/3).
  function processFile() {
    if (!file || !preview) return;
    setShowProcessModal(false);
    setBulkUpload({ name: file.name, total: preview.total || 100, startedAt: Date.now() });
    // For real Excel/CSV, create the listings in the background (fire-and-forget;
    // client-side navigation keeps in-flight requests alive). PDF/Word are
    // simulated until the backend extraction pipeline exists.
    if (!preview.simulated) {
      const rows = preview.rows;
      void (async () => {
        for (const row of rows) {
          try {
            const data = buildBulkPayload(row);
            const transcript = (row["description"] || row["title"] || "Bulk import").trim();
            await api.listings.submit(data, transcript);
          } catch {
            /* individual failures are surfaced on the review page */
          }
        }
      })();
    }
    router.push("/add-property");
  }

  /* ----- Results view ----- */
  if (phase === "processing" || phase === "done") {
    const counts = {
      all: results.length,
      complete: results.filter((r) => r.status === "complete").length,
      error: results.filter((r) => r.status === "error").length,
    };
    const rows = tab === "all" ? results : results.filter((r) => r.status === tab);
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="flex shrink-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setPhase("upload");
              setProgress(0);
            }}
            aria-label="Back"
            className="text-ink mt-1 size-7 rounded-lg"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-ink text-2xl font-bold">
              {phase === "processing" ? "Importing Properties…" : "Bulk Import Complete"}
            </h1>
            <p className="text-ink-muted text-sm">
              {phase === "processing"
                ? "Creating a listing for each row in your file."
                : `${counts.complete} listed, ${counts.error} failed out of ${counts.all}.`}
            </p>
          </div>
        </div>

        {/* progress */}
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
          <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-lg">
            <Upload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08]">
              <div
                className="bg-accent-blue h-full rounded-full transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-accent-blue mt-1.5 flex items-center gap-1.5 text-xs">
              {phase === "processing" && <Loader2 className="size-3.5 animate-spin" />}
              {progress}% — {counts.complete + counts.error} of {results.length || "…"} processed
            </p>
          </div>
        </div>

        {/* tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-b border-black/[0.07]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-sm font-semibold transition-colors",
                  active ? "text-accent-blue" : "text-ink-muted hover:text-ink"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active ? "bg-accent-blue/10 text-accent-blue" : "bg-black/[0.06] text-ink-muted"
                  )}
                >
                  {counts[t.key]}
                </span>
                {active && <span className="bg-accent-blue absolute inset-x-0 -bottom-px h-0.5 rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* table */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/[0.07]">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="text-ink-muted border-b border-black/[0.07] bg-black/[0.02] text-xs font-medium">
                <th className="px-4 py-3">Property</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-black/[0.05] last:border-0 hover:bg-black/[0.015]">
                  <td className="px-4 py-3">
                    <p className="text-ink truncate text-sm font-medium">{r.name}</p>
                    <p className="text-ink-muted flex items-center gap-1 text-xs">
                      <MapPin className="size-3" />
                      {r.loc}
                    </p>
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className={cn("px-4 py-3 text-sm", r.status === "error" ? "text-red-500" : "text-ink-muted")}>
                    {r.detail}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-ink-muted px-4 py-8 text-center text-sm">
                    No rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {phase === "done" && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPhase("upload");
                setFile(null);
                setResults([]);
                setProgress(0);
              }}
              className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium"
            >
              Import Another File
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-6 text-sm font-semibold text-white"
            >
              View My Properties
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ----- Upload view ----- */
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <div className="flex shrink-0 items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/add-property" />}
          aria-label="Back"
          className="text-ink mt-1 size-7 rounded-lg"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-ink text-2xl font-bold">Bulk Upload Properties</h1>
          <p className="text-ink-muted text-sm">
            Upload Excel, PDF or Word Document with multiple properties at once
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-ink text-lg font-bold">Upload File</h2>
            <p className="text-ink-muted text-sm">Upload Excel, PDF or Word Document</p>
          </div>
          <button
            type="button"
            onClick={downloadSample}
            className="text-accent-blue inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <Download className="size-4" />
            Download sample CSV
          </button>
        </div>

        <div className="border-brand-orange/20 bg-brand-orange/[0.06] mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3">
          <Sparkles className="text-brand-orange mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-ink text-sm font-semibold">Save Hours with Bulk Upload</p>
            <p className="text-ink-muted text-xs">
              Simply upload your Excel sheet or documents and let AI create multiple property listings
              automatically.
            </p>
          </div>
        </div>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const ff = e.dataTransfer.files?.[0];
            if (ff) loadPreview(ff);
          }}
          className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/15 bg-black/[0.01] px-6 py-12 text-center transition-colors hover:border-accent-blue/40"
        >
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,.pdf,.doc,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const ff = e.target.files?.[0];
              if (ff) loadPreview(ff);
              e.target.value = "";
            }}
          />
          <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-full">
            <Upload className="size-6" />
          </span>
          <p className="text-ink mt-4 font-semibold">Drag and drop your file here</p>
          <p className="text-ink-muted mt-1 text-sm">Click to select Excel, PDF or Word Document</p>
          <span className="border-accent-blue/40 text-accent-blue mt-4 rounded-lg border bg-white px-5 py-2 text-sm font-semibold">
            Upload File
          </span>
        </label>

        {/* Uploading loader */}
        {parsing && file && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] bg-black/[0.015] px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-blue text-[10px] font-bold text-white">
              {fileKind(file.name).badge}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-medium">Uploading 1 File… please wait</p>
              <div className="bg-accent-blue/15 mt-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-accent-blue h-full rounded-full transition-[width] duration-200"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* File card (ready) */}
        {!parsing && file && preview && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-blue text-[10px] font-bold text-white">
                {fileKind(file.name).badge}
              </span>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">{file.name}</p>
                <p className="text-ink-muted text-xs">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                <Check className="size-3" strokeWidth={3} /> Ready
              </span>
              <Button
                variant="outline"
                onClick={removeFile}
                className="h-9 rounded-lg border-red-300 px-4 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {fileError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{fileError}</p>
        )}
      </div>

      {/* File preview */}
      {!parsing && preview && (
        <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white p-6">
          <p className="text-ink font-bold">File Preview (first 2 rows)</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-black/[0.06]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-ink-muted bg-black/[0.02] text-xs">
                  <th className="px-4 py-3 font-semibold">Property Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Amenities</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 2).map((r, i) => {
                  const loc = r["location"] || [r["locality"], r["city"]].filter(Boolean).join(", ");
                  const am = (r["amenities"] || "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
                  const amShort = am.slice(0, 2).join(", ");
                  return (
                    <tr key={i} className="text-ink border-t border-black/[0.06]">
                      <td className="px-4 py-3">{r["title"] || "—"}</td>
                      <td className="px-4 py-3">{r["property_type"] || "—"}</td>
                      <td className="px-4 py-3">{loc || "—"}</td>
                      <td className="px-4 py-3">{r["price"] || "—"}</td>
                      <td className="px-4 py-3">{r["area_sqft"] || r["area"] || "—"}</td>
                      <td className="px-4 py-3">
                        {amShort || "—"}
                        {am.length > 2 && <span className="text-accent-blue text-xs"> +{am.length - 2} more</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {preview.missingLoc > 0 && (
            <div className="border-brand-orange/20 bg-brand-orange/[0.07] mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
              <CircleAlert className="text-brand-orange size-4 shrink-0" />
              <p className="text-ink">
                {preview.missingLoc} row{preview.missingLoc > 1 ? "s have" : " has"}{" "}
                <span className="font-semibold">missing location</span>. These will be flagged during processing.
              </p>
            </div>
          )}
          {preview.simulated && (
            <p className="text-ink-muted mt-3 text-xs italic">
              Preview is a sample — AI extraction for PDF/Word documents is being set up. Upload Excel/CSV to create
              listings now.
            </p>
          )}
        </div>
      )}

      {preview && !parsing && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/add-property" />}
            className="text-ink h-11 rounded-lg border-black/15 px-6 text-sm font-medium"
          >
            Back
          </Button>
          <Button
            onClick={() => setShowProcessModal(true)}
            className="bg-brand-blue hover:bg-brand-blue-hover h-11 rounded-lg px-6 text-sm font-semibold text-white"
          >
            Process with File
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* "Your Properties Are Being Processed" modal */}
      {showProcessModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          style={{ animation: "fade-in 160ms ease-out both" }}
          onClick={() => setShowProcessModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
            style={{ animation: "scale-in 200ms ease-out both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Loader2 className="text-accent-blue mx-auto size-8 animate-spin" />
            <h3 className="text-ink mt-4 text-xl font-bold">Your Properties Are Being Processed</h3>
            <p className="text-ink-muted mt-1.5 text-sm">
              We&apos;ve started analyzing your uploaded file. Your property listings will be created shortly, and
              we&apos;ll notify you once they&apos;re ready.
            </p>
            <div className="bg-accent-blue/[0.06] mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-left">
              <Bell className="text-accent-blue mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-ink text-sm font-semibold">We&apos;ll Notify You</p>
                <p className="text-ink-muted text-xs">
                  You&apos;ll receive a notification once your property listings are ready for review and publishing.
                </p>
              </div>
            </div>
            <Button
              onClick={processFile}
              className="bg-brand-blue hover:bg-brand-blue-hover mt-5 h-11 w-full rounded-lg text-sm font-semibold text-white"
            >
              Okay, Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
