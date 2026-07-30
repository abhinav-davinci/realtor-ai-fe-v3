"use client";

/**
 * Who is looking at the app, as a hook. Starts as the account owner so the
 * server render and the first client render always agree, then settles to the
 * real viewer after mount (impersonation lives in localStorage).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OWNER_VIEWER,
  TEAM_CHANGED_EVENT,
  VIEW_CHANGED_EVENT,
  can,
  currentViewer,
  type Capability,
  type Viewer,
} from "@/lib/team";

export function useViewer(): Viewer & { can: (c: Capability) => boolean; ready: boolean } {
  const [viewer, setViewer] = useState<Viewer>(OWNER_VIEWER);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => setViewer(currentViewer()), []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    reload();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(VIEW_CHANGED_EVENT, reload);
    // Deactivating or removing the person being viewed as drops you back to the
    // owner, so team changes have to re-run this too.
    window.addEventListener(TEAM_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(VIEW_CHANGED_EVENT, reload);
      window.removeEventListener(TEAM_CHANGED_EVENT, reload);
    };
  }, [reload]);

  // Memoised deliberately. An unstable object here means every callback and
  // effect that depends on the viewer is rebuilt on each render, which turns
  // "reload when the viewer changes" into an infinite loop.
  return useMemo(
    () => ({ ...viewer, ready, can: (c: Capability) => can(viewer, c) }),
    [viewer, ready]
  );
}
