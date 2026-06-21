"use client";

/**
 * Renders the auto-call surfaces from app state: the full progress modal when
 * it's open, otherwise the floating tracker while a run is active. Mounted once
 * in the root layout (inside AutoCallProvider) so both are reachable on any page.
 */
import { useAutoCall } from "./auto-call-context";
import { AutoCallModal } from "./auto-call-modal";
import { AutoCallTracker } from "./auto-call-tracker";

export function AutoCallOverlay() {
  const { modalOpen, active } = useAutoCall();
  return (
    <>
      {modalOpen && <AutoCallModal />}
      {active && !modalOpen && <AutoCallTracker />}
    </>
  );
}
