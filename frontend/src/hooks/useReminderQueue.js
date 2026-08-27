/* ============================================================================
   useReminderQueue
   ----------------------------------------------------------------------------
   Generic due-item reminder scheduler. Knows nothing about syllabi, courses,
   or assessments — it only understands objects shaped like:

     { id: string, title: string, subtitle?: string, dueAt: string | number | Date }

   Swap the data source by writing a different adapter that produces this
   shape (see mta/avatar/adaptAssessments.js for the current one) and passing
   its output in as `items`. This file should never need to change for that.

   Behavior:
   - Polls `items` on an interval and queues any that have entered their
     reminder window (due within `leadTimeMs`, not shown yet, not overdue by
     more than `graceMs`).
   - Only one reminder is ever "active" (displayed) at a time.
   - After a reminder becomes active, no other reminder is promoted from the
     queue until `cooldownMs` has passed — even if more are already due.
     They wait in the queue.
   - An active reminder auto-clears after `autoDismissMs`, or immediately via
     the returned `dismiss()` (e.g. on click).
   - `forceShow(item?)` shows a reminder immediately, bypassing the due
     window and cooldown — for a manual trigger (e.g. tapping the avatar).
     With no argument it shows whichever item has the soonest `dueAt`.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;

export function useReminderQueue(items, options = {}) {
  const {
    leadTimeMs = 3 * DAY,
    graceMs = 60 * 60 * 1000,
    cooldownMs = 60 * 1000,
    autoDismissMs = 6000,
    pollIntervalMs = 15 * 1000,
    now = () => Date.now(),
  } = options;

  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);

  const shownIdsRef = useRef(new Set());
  const lastShownAtRef = useRef(0);
  const queueRef = useRef(queue);
  const activeRef = useRef(active);
  const itemsRef = useRef(items);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Scan for newly-due items and append them to the queue. Dedup against the
  // queue happens inside the setQueue updater (not against queueRef here) so
  // that two scans firing back-to-back — e.g. React StrictMode's dev-only
  // double-invoke of effects — can never both pass a stale "not queued yet"
  // check and double-add the same item before the ref catches up.
  useEffect(() => {
    const scan = () => {
      const t = now();
      const dueNow = itemsRef.current.filter((item) => {
        if (item.dueAt == null) return false;
        const dueAt = new Date(item.dueAt).getTime();
        if (Number.isNaN(dueAt)) return false;
        const msUntilDue = dueAt - t;
        if (msUntilDue > leadTimeMs) return false; // not due yet
        if (msUntilDue < -graceMs) return false; // too overdue, don't resurrect it
        if (shownIdsRef.current.has(item.id)) return false;
        if (activeRef.current && activeRef.current.id === item.id) return false;
        return true;
      });
      if (dueNow.length === 0) return;
      setQueue((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const additions = dueNow.filter((item) => !existingIds.has(item.id));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    };

    scan();
    const id = setInterval(scan, pollIntervalMs);
    return () => clearInterval(id);
    // `items` is read through a ref so a new array reference each render
    // doesn't restart the poll interval.
  }, [leadTimeMs, graceMs, pollIntervalMs]);

  // Promote the next queued item to active, respecting the cooldown.
  useEffect(() => {
    if (active || queue.length === 0) return undefined;

    const wait = Math.max(0, cooldownMs - (now() - lastShownAtRef.current));
    const timer = setTimeout(() => {
      const current = queueRef.current;
      if (current.length === 0) return;
      const [next, ...rest] = current;
      shownIdsRef.current.add(next.id);
      lastShownAtRef.current = now();
      setQueue(rest);
      setActive(next);
    }, wait);

    return () => clearTimeout(timer);
  }, [active, queue, cooldownMs]);

  // Auto-dismiss the active reminder.
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setActive(null), autoDismissMs);
    return () => clearTimeout(timer);
  }, [active, autoDismissMs]);

  const dismiss = useCallback(() => setActive(null), []);

  const forceShow = useCallback((item) => {
    const target = item || soonest(itemsRef.current);
    if (!target) return;
    shownIdsRef.current.add(target.id);
    lastShownAtRef.current = now();
    setActive(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { active, pendingCount: queue.length, dismiss, forceShow };
}

function soonest(items) {
  let best = null;
  let bestTime = Infinity;
  for (const item of items) {
    if (item.dueAt == null) continue;
    const t = new Date(item.dueAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t < bestTime) {
      bestTime = t;
      best = item;
    }
  }
  return best;
}
