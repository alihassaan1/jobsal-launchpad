// Shared Jobs.al email layout: white header with logo, white card, grey footer.
// Table-based with inline styles only, so it renders the same in Gmail, Outlook and Apple Mail.

export const EMAIL_LOGO_URL = "https://cdn.jobs.al/assets/logo.png";

const RED = "#E9282B";
const INK = "#1F1F1F";
const MUTED = "#6B6B6B";
const FONT = "Inter,-apple-system,'Segoe UI',Roboto,Arial,Helvetica,sans-serif";

export interface EmailBanner {
  imageUrl: string; // 1120x320 image, shown at 560x160
  href: string;
  alt: string;
}

export interface WrapOptions {
  preheader?: string;
  unsubscribeUrl?: string;
  banner?: EmailBanner;
  signOff?: boolean;
}

const attr = (v: string) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function wrapEmail(content: string, opts: WrapOptions = {}): string {
  const { preheader = "", unsubscribeUrl = "https://jobs.al/settings", banner, signOff = true } = opts;
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Jobs.al</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:${FONT};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${attr(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="background:#FFFFFF;border-radius:8px 8px 0 0;padding:22px 32px;border-bottom:3px solid ${RED};">
<a href="https://jobs.al" style="text-decoration:none;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:40px;height:40px;"><img src="${EMAIL_LOGO_URL}" width="40" height="40" alt="Jobs.al" style="display:block;width:40px;height:40px;border:0;"></td>
<td style="padding-left:12px;font-size:22px;font-weight:700;color:${RED};letter-spacing:-0.3px;font-family:${FONT};">jobs.al</td>
</tr></table></a></td></tr>
<tr><td style="background:#FFFFFF;padding:32px;border-radius:0 0 8px 8px;font-size:15px;line-height:1.6;font-family:${FONT};color:${INK};">
${content}
${banner ? bannerBlock(banner) : ""}
${signOff ? `<p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:${INK};">Me respekt,<br><b>Ekipi i Jobs.al</b></p>` : ""}
</td></tr>
<tr><td style="padding:22px 32px;font-size:12px;line-height:1.7;color:#8A8A8A;text-align:center;font-family:${FONT};">
Jobs.al · portali i punësimit për Shqipërinë<br>
<a href="mailto:info@jobs.al" style="color:#8A8A8A;">info@jobs.al</a> · <a href="https://jobs.al" style="color:#8A8A8A;">jobs.al</a> · <a href="https://facebook.com/jobs.al" style="color:#8A8A8A;">Facebook</a> · <a href="https://instagram.com/jobs.al" style="color:#8A8A8A;">Instagram</a> · <a href="https://linkedin.com/company/jobs-al" style="color:#8A8A8A;">LinkedIn</a><br>
© ${year} Jobs.al · <a href="${attr(unsubscribeUrl)}" style="color:#8A8A8A;">Çregjistrohu nga emailet</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

/** Rounded marketing banner (image + link). Outlook desktop shows square corners. */
export function bannerBlock(b: EmailBanner): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;"><tr><td align="center">
<a href="${attr(b.href)}" style="text-decoration:none;"><img src="${attr(b.imageUrl)}" width="536" alt="${attr(b.alt)}" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:12px;"></a>
</td></tr></table>`;
}

export function h1(title: string, subtitle?: string): string {
  return `<h1 style="margin:0 0 ${subtitle ? 6 : 18}px;font-size:22px;line-height:1.3;color:${INK};font-family:${FONT};">${title}</h1>` +
    (subtitle ? `<p style="margin:0 0 20px;font-size:14px;color:${MUTED};">${subtitle}</p>` : "");
}

export function p(text: string, muted = false): string {
  return `<p style="margin:0 0 14px;font-size:${muted ? 14 : 15}px;line-height:1.6;color:${muted ? MUTED : INK};">${text}</p>`;
}

/** Key/value table. Rows with an empty value are skipped. */
export function details(rows: [string, string | undefined | null][]): string {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && String(v) !== "");
  if (!shown.length) return "";
  const n = shown.length;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF1F1;border:1px solid #F0C4C4;border-radius:6px;font-size:14px;margin:6px 0 14px;">` +
    shown.map(([l, v], i) => {
      const b = i === n - 1 ? "" : "border-bottom:1px solid #F0C4C4;";
      return `<tr><td style="padding:12px 16px;color:${MUTED};${b}">${l}</td><td align="right" style="padding:12px 16px;font-weight:700;color:${INK};${b}">${v}</td></tr>`;
    }).join("") + `</table>`;
}

export function button(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td align="center"><a href="${attr(url)}" style="display:inline-block;background:${RED};color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 30px;border-radius:6px;font-family:${FONT};">${text}</a></td></tr></table>`;
}

/** Secondary action shown as an outlined button. */
export function button2(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;"><tr><td align="center"><a href="${attr(url)}" style="display:inline-block;background:#FFFFFF;color:${RED};text-decoration:none;font-weight:700;font-size:14px;padding:11px 26px;border-radius:6px;border:2px solid ${RED};font-family:${FONT};">${text}</a></td></tr></table>`;
}

/** Numbered steps or feature list. */
export function steps(items: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 10px;">` +
    items.map(([t, d], i) =>
      `<tr><td valign="top" style="width:34px;padding:8px 0;"><div style="width:24px;height:24px;border-radius:12px;background:${RED};color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">${i + 1}</div></td>` +
      `<td style="padding:8px 0;font-size:15px;line-height:1.5;color:${INK};"><b>${t}</b>${d ? `<br><span style="color:${MUTED};font-size:14px;">${d}</span>` : ""}</td></tr>`
    ).join("") + `</table>`;
}

/** Simple bullet list. */
export function bullets(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">` +
    items.map((t) => `<tr><td valign="top" style="width:20px;padding:4px 0;color:${RED};font-size:15px;line-height:1.5;">&#8226;</td><td style="padding:4px 0;font-size:15px;line-height:1.5;color:${INK};">${t}</td></tr>`).join("") +
    `</table>`;
}

/** Highlighted note box. tone: info (grey), warn (amber), alert (red). */
export function note(html: string, tone: "info" | "warn" | "alert" = "info"): string {
  const c = tone === "warn" ? ["#FFF8E6", "#F3D58A", "#7A5200"] : tone === "alert" ? ["#FDF1F1", "#F0C4C4", "#A3191C"] : ["#F7F7F7", "#E5E5E5", "#3D3D3D"];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;"><tr><td style="background:${c[0]};border:1px solid ${c[1]};border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.6;color:${c[2]};">${html}</td></tr></table>`;
}

/** Job card: title, company, meta line, optional link and extra line. */
export function jobCard(o: { title: string; company?: string; meta?: string; linkText?: string; linkUrl?: string; extra?: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr><td style="border:1px solid #E5E5E5;border-radius:6px;padding:16px;">` +
    `<div style="font-size:16px;font-weight:700;color:${INK};margin:0 0 4px;">${o.title}</div>` +
    (o.company ? `<div style="font-size:14px;color:${RED};font-weight:600;margin:0 0 4px;">${o.company}</div>` : "") +
    (o.meta ? `<div style="font-size:13px;color:${MUTED};">${o.meta}</div>` : "") +
    (o.extra ? `<div style="margin-top:10px;">${o.extra}</div>` : "") +
    (o.linkUrl ? `<div style="margin-top:10px;"><a href="${attr(o.linkUrl)}" style="color:${RED};font-size:14px;font-weight:600;text-decoration:none;">${o.linkText || "Shiko detajet"} &rarr;</a></div>` : "") +
    `</td></tr></table>`;
}

/** Small coloured status pill. */
export function badge(text: string, bg = "#F7F7F7", color = "#3D3D3D"): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${bg};color:${color};font-size:13px;font-weight:600;">${text}</span>`;
}

/** Row of up to 3 big numbers (for reports). */
export function stats(items: [string, string][]): string {
  const w = Math.floor(100 / items.length);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;"><tr>` +
    items.map(([v, l]) => `<td width="${w}%" style="padding:4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#FDF1F1;border:1px solid #F0C4C4;border-radius:6px;padding:16px 8px;"><div style="font-size:24px;font-weight:800;color:${RED};">${v}</div><div style="font-size:12px;color:${MUTED};margin-top:2px;">${l}</div></td></tr></table></td>`).join("") +
    `</tr></table>`;
}

export const link = (text: string, url: string) => `<a href="${attr(url)}" style="color:${RED};">${text}</a>`;

/** DD.MM.YYYY from a Date or ISO string; returns the input if it cannot be parsed. */
export function fmtDate(v?: string | Date | null): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}
