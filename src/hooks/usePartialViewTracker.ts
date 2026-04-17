/**
 * usePartialViewTracker — records a "partial view" when a listing card
 * scrolls into view but the user doesn't tap it.
 *
 * After 3 partial views the backend suppresses the listing from the user's
 * feed for 7 days (convex/intel.ts::partialView mutation).
 *
 * Usage:
 *   const { onViewableItemsChanged, viewabilityConfig } = usePartialViewTracker();
 *   <FlashList onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} ... />
 */
import { useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const VISIBILITY_THRESHOLD = 0.5; // 50% of card must be visible
const DWELL_TIME_MS = 3000; // must be visible for 3s to count

export function usePartialViewTracker() {
  const partialView = useMutation(api.intel.partialView);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const onViewableItemsChanged = useCallback(
    ({ changed }: { changed: Array<{ item: { id: number }; isViewable: boolean }> }) => {
      for (const { item, isViewable } of changed) {
        const listingId = item?.id;
        if (!listingId) continue;

        if (isViewable) {
          // Start dwell timer
          if (!timers.current.has(listingId)) {
            timers.current.set(
              listingId,
              setTimeout(() => {
                partialView({ listingId }).catch(() => {});
                timers.current.delete(listingId);
              }, DWELL_TIME_MS),
            );
          }
        } else {
          // Cancel dwell timer if scrolled away before threshold
          const t = timers.current.get(listingId);
          if (t) {
            clearTimeout(t);
            timers.current.delete(listingId);
          }
        }
      }
    },
    [partialView],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: VISIBILITY_THRESHOLD * 100,
    minimumViewTime: 0,
  };

  return { onViewableItemsChanged, viewabilityConfig };
}
