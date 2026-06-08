/** Save a remote video file, letting the user choose the location when the
 * browser supports the File System Access API (Chromium). Falls back to a
 * normal blob download otherwise. Returns "saved" once the file is written, or
 * "cancelled" if the user dismisses the save dialog. */

type SaveResult = "saved" | "cancelled";

interface WritableHandle {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}
type SaveFilePicker = (opts?: {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}) => Promise<WritableHandle>;

export async function saveVideoFile(url: string, filename: string): Promise<SaveResult> {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

  // Preferred: let the user pick where to save the file.
  if (typeof picker === "function") {
    let handle: WritableHandle | null = null;
    try {
      handle = await picker({
        suggestedName: filename,
        types: [{ description: "MP4 video", accept: { "video/mp4": [".mp4"] } }],
      });
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
      handle = null; // other errors → fall back to a normal download
    }
    if (handle) {
      const res = await fetch(url);
      const blob = await res.blob();
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    }
  }

  // Fallback: blob download to the browser's default location.
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return "saved";
}
