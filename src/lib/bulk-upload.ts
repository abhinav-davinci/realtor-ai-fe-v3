/** Tiny client-side store for the in-progress bulk upload, shared between the
 * bulk form, the "Choose Input Method" progress banner, and the review-table
 * page. Persisted to localStorage so it survives navigation. */

const KEY = "tt_bulk_upload";

export interface BulkUploadState {
  name: string; // file name, e.g. "Raheja_Vistas_NIBM.docx"
  total: number; // total properties being processed
  startedAt: number; // epoch ms — used to simulate progress over time
}

export function setBulkUpload(state: BulkUploadState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getBulkUpload(): BulkUploadState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BulkUploadState) : null;
  } catch {
    return null;
  }
}

export function clearBulkUpload() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Simulated "x of total processed" — ramps to total over ~50s from startedAt. */
export function bulkProcessed(state: BulkUploadState): number {
  const elapsed = Date.now() - state.startedAt;
  const pct = Math.min(1, elapsed / 50_000);
  return Math.min(state.total, Math.round(state.total * pct));
}
