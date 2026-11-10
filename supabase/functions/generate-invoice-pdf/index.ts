import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceData {
  invoiceId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId }: InvoiceData = await req.json();
    if (typeof invoiceId !== "string" || !/^[0-9a-f-]{36}$/i.test(invoiceId)) {
      return new Response(JSON.stringify({ error: "Invalid invoice" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    const deny = () => new Response(JSON.stringify({ error: "Not allowed" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    if (!user) return deny();
    const { data: inv } = await supabase.from("invoices").select("user_id, company_id").eq("id", invoiceId).maybeSingle();
    if (!inv) return deny();
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    let allowed = !!isAdmin || inv.user_id === user.id;
    if (!allowed && inv.company_id) {
      const { data: member } = await supabase.rpc("is_company_member", { _company_id: inv.company_id, _user_id: user.id, _min_role: "viewer" });
      allowed = !!member;
    }
    if (!allowed) return deny();

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order");

    if (itemsError) throw itemsError;

    // Fetch billing settings
    const { data: settings } = await supabase
      .from("billing_settings")
      .select("key, value");

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    // Generate HTML invoice
    const html = generateInvoiceHTML(invoice, items, settingsMap);

    console.log("Generated invoice PDF HTML for:", invoice.invoice_number);

    return new Response(
      JSON.stringify({ 
        success: true, 
        html,
        invoiceNumber: invoice.invoice_number,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating invoice PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function reverseChargeNote(taxRate: unknown, buyerTaxId: unknown): string | null {
  const id = String(buyerTaxId ?? "").trim();
  if (Number(taxRate ?? 0) !== 0 || !id) return null;
  return `Reverse charge: VAT to be accounted for by the recipient (NUIS ${id}). / Autongarkesë: TVSH llogaritet nga marrësi.`;
}

function generateInvoiceHTML(
  invoice: Record<string, unknown>,
  items: Record<string, unknown>[],
  settings: Record<string, string>
): string {
  const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${esc(item.description)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price as number)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total as number)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info { text-align: right; }
    .company-name { font-size: 24px; font-weight: bold; color: #E8272C; margin-bottom: 8px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
    .invoice-number { font-size: 18px; color: #6b7280; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address-block { width: 45%; }
    .address-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .items-table th:last-child, .items-table td:last-child { text-align: right; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #1f2937; padding-top: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer-text { font-size: 14px; color: #6b7280; text-align: center; }
    .bank-details { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .bank-details-title { font-weight: 600; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoice.invoice_number}</div>
      <div style="margin-top: 12px;">
        <span class="status-badge status-${invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : 'pending'}">
          ${(invoice.status as string).replace('_', ' ').toUpperCase()}
        </span>
      </div>
    </div>
    <div class="company-info">
      <div class="company-name">iMake LLC</div>
      <div>Operator of Jobs.al</div>
      <div>5900 Balcones Drive STE 100</div>
      <div>Austin, TX 78731</div>
      <div>USA</div>
      <div>info@jobs.al</div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <div class="address-label">Bill To</div>
      <div style="font-weight: 600;">${esc(invoice.billing_name || 'N/A')}</div>
      ${invoice.tax_id ? `<div>NUIS: ${esc(invoice.tax_id)}</div>` : ''}
      ${invoice.billing_address ? `<div>${esc(invoice.billing_address)}</div>` : ''}
      ${invoice.billing_city || invoice.billing_postal_code ? `<div>${esc(invoice.billing_city)} ${esc(invoice.billing_postal_code)}</div>` : ''}
      ${invoice.billing_country ? `<div>${esc(invoice.billing_country)}</div>` : ''}
      ${invoice.billing_email ? `<div>${esc(invoice.billing_email)}</div>` : ''}
    </div>
    <div class="address-block" style="text-align: right;">
      <div class="address-label">Invoice Details</div>
      ${invoice.reference ? `<div><strong>Reference:</strong> ${esc(invoice.reference)}</div>` : ''}
      <div><strong>Issue Date:</strong> ${formatDate(invoice.issue_date as string)}</div>
      ${invoice.due_date ? `<div><strong>Due Date:</strong> ${formatDate(invoice.due_date as string)}</div>` : ''}
      ${invoice.paid_date ? `<div><strong>Paid Date:</strong> ${formatDate(invoice.paid_date as string)}</div>` : ''}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${formatCurrency(invoice.subtotal as number)}</span>
    </div>
    ${(invoice.tax_amount as number) > 0 ? `
    <div class="totals-row">
      <span>VAT (${invoice.tax_rate}%)</span>
      <span>${formatCurrency(invoice.tax_amount as number)}</span>
    </div>
    ` : ''}
    ${(invoice.discount_amount as number) > 0 ? `
    <div class="totals-row" style="color: #059669;">
      <span>Discount</span>
      <span>-${formatCurrency(invoice.discount_amount as number)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(invoice.total as number)}</span>
    </div>
    ${(invoice.amount_paid as number) > 0 ? `
    <div class="totals-row" style="color: #059669;">
      <span>Paid</span>
      <span>-${formatCurrency(invoice.amount_paid as number)}</span>
    </div>
    <div class="totals-row" style="font-weight: 600;">
      <span>Balance Due</span>
      <span>${formatCurrency((invoice.total as number) - (invoice.amount_paid as number))}</span>
    </div>
    ` : ''}
  </div>

  ${reverseChargeNote(invoice.tax_rate, invoice.tax_id) ? `
  <div style="margin-top: 24px; font-size: 13px;">${esc(reverseChargeNote(invoice.tax_rate, invoice.tax_id))}</div>` : ''}

  ${invoice.payment_link && !['paid', 'void', 'cancelled'].includes(invoice.status as string) ? `
  <div class="bank-details">
    <div class="bank-details-title">Pay online (PayPal or card)</div>
    <div style="word-break: break-all;"><a href="${esc(invoice.payment_link)}">${esc(invoice.payment_link)}</a></div>
  </div>` : ''}

  ${settings.bank_name ? `
  <div class="bank-details">
    <div class="bank-details-title">Payment Details</div>
    <div><strong>Bank:</strong> ${settings.bank_name}</div>
    ${settings.bank_account ? `<div><strong>Account:</strong> ${settings.bank_account}</div>` : ''}
    ${settings.bank_iban ? `<div><strong>IBAN:</strong> ${settings.bank_iban}</div>` : ''}
    ${settings.bank_swift ? `<div><strong>SWIFT:</strong> ${settings.bank_swift}</div>` : ''}
  </div>
  ` : ''}

  ${invoice.notes ? `
  <div style="margin-top: 30px;">
    <div style="font-weight: 600; margin-bottom: 8px;">Notes</div>
    <div style="color: #6b7280;">${esc(invoice.notes)}</div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="footer-text">${settings.invoice_footer_text || 'Thank you for your business!'}</div>
  </div>
</body>
</html>
  `;
}