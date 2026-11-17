import { supabase } from "@/integrations/supabase/client";

const visitedKey = (kind: "job" | "company", id: string) => `jobsal-view:${kind}:${id}`;

export function shouldTrackVisit(kind: "job" | "company", id: string, storage: Pick<Storage, "getItem" | "setItem">): boolean {
  const key = visitedKey(kind, id);
  if (storage.getItem(key)) return false;
  storage.setItem(key, "1");
  return true;
}

/** Tracks at most once per browser session; the server also deduplicates by visitor. */
export async function trackPageView(kind: "job" | "company", id: string): Promise<void> {
  if (!shouldTrackVisit(kind, id, window.sessionStorage)) return;
  const { error } = await supabase.functions.invoke("track-page-view", { body: { kind, id } });
  if (error) console.error("Could not record page view");
}
