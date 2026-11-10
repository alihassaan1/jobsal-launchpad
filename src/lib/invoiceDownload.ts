import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Generates the invoice server-side and saves it as a real PDF file. */
export async function downloadInvoicePdf(invoiceId: string, invoiceNumber?: string) {
  const t = toast.loading("Preparing invoice PDF…");
  try {
    const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", { body: { invoiceId } });
    if (error || !data?.html) throw error || new Error("No invoice content");
    const html2pdf = (await import("html2pdf.js")).default;
    const doc = new DOMParser().parseFromString(data.html, "text/html");
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff";
    doc.head.querySelectorAll("style").forEach((s) => host.appendChild(s.cloneNode(true)));
    host.insertAdjacentHTML("beforeend", doc.body.innerHTML);
    document.body.appendChild(host);
    try {
      await html2pdf()
        .set({
          margin: 0,
          filename: `${data.invoiceNumber || invoiceNumber || "invoice"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(host)
        .save();
    } finally {
      host.remove();
    }
    toast.success("Invoice downloaded", { id: t });
  } catch (e) {
    console.error(e);
    toast.error("Could not generate the invoice PDF", { id: t });
  }
}
