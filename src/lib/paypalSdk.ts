import { supabase } from "@/integrations/supabase/client";

export type PayPalMode = "capture" | "subscription";

let current: { mode: PayPalMode; promise: Promise<any> } | null = null;

/** Loads the PayPal SDK in the requested mode, replacing any SDK loaded in a different mode. */
export function loadPayPalSdk(mode: PayPalMode): Promise<any> {
  if (current?.mode === mode) return current.promise;
  document.querySelectorAll("script[data-paypal-sdk]").forEach((s) => s.remove());
  delete (window as any).paypal;
  const promise = (async () => {
    const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "config" } });
    if (error || !data?.client_id) throw new Error("PayPal config unavailable");
    const params = mode === "subscription"
      ? "intent=subscription&vault=true"
      : "intent=capture&enable-funding=card";
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${data.client_id}&currency=EUR&components=buttons&${params}`;
      script.dataset.paypalSdk = mode;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("PayPal failed to load"));
      document.body.appendChild(script);
    });
    return (window as any).paypal;
  })();
  current = { mode, promise };
  promise.catch(() => { if (current?.promise === promise) current = null; });
  return promise;
}
