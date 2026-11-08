// Bilingual (Albanian + English) employer package & payment emails.
type D = Record<string, string>;
type Wrap = (content: string) => string;

const esc = (v: string | undefined, fallback = "") =>
  String(v ?? fallback).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const BILLING = "https://jobs.al/employer/billing";

function rows(items: [string, string | undefined][]) {
  const shown = items.filter(([, v]) => v);
  return `<div class="feature-box">${shown.map(([l, v], i) => `
    <div class="info-row"${i === shown.length - 1 ? ' style="border-bottom: none;"' : ""}>
      <span class="info-label">${l}</span><span class="info-value">${esc(v)}</span>
    </div>`).join("")}</div>`;
}

function block(o: { title: string; heading: string; sq: string; en: string; details: string; cta: string; ctaUrl: string; note?: string }) {
  return `
    <div class="header"><p class="header-logo">jobs<span>.al</span></p><h1>${o.title}</h1></div>
    <div class="content">
      <h2>${o.heading}</h2>
      <p>${o.sq}</p>
      <p style="color:#6b7280;font-size:14px;"><em>${o.en}</em></p>
      ${o.details}
      <p style="text-align:center;"><a href="${o.ctaUrl}" class="cta-button">${o.cta}</a></p>
      ${o.note ? `<p style="color:#737373;font-size:13px;">${o.note}</p>` : ""}
      <p style="color:#737373;font-size:13px;">Pyetje për faturimin? / Billing questions? <a href="mailto:info@jobs.al" style="color:#E8272C;">info@jobs.al</a></p>
      <p>Me respekt / Kind regards,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
}

const hi = (d: D) => `Përshëndetje / Hello, ${esc(d.name, "Punëdhënës")}!`;

export function packageTemplates(d: D, wrap: Wrap): Record<string, { subject: string; html: string }> {
  const pkg = esc(d.packageName, "Paketa");
  return {
    "package-offer-ready": {
      subject: `Oferta juaj "${d.packageName || "Paketa"}" është gati / Your package offer is ready`,
      html: wrap(block({
        title: "📦 Oferta juaj është gati", heading: hi(d),
        sq: `Kemi përgatitur paketën private <strong>${pkg}</strong> për ${esc(d.companyName, "kompaninë tuaj")}. Mund ta paguani me PayPal ose kartë nga faqja e faturimit.`,
        en: `We've prepared the private package ${pkg} for ${esc(d.companyName, "your company")}. You can pay by PayPal or card from your billing page.`,
        details: rows([["Paketa / Package", d.packageName], ["Çmimi / Price", d.amount], ["Postime pune / Job posts", d.credits], ["Kohëzgjatja / Duration", d.duration], ["Aktivizimi / Starts", d.startDate], ["Oferta vlen deri / Offer valid until", d.offerDeadline]]),
        cta: "Paguaj tani / Pay now", ctaUrl: BILLING,
      })),
    },
    "package-payment-completed": {
      subject: `Pagesa u krye — paketa "${d.packageName || "Paketa"}" është aktive ✅ / Payment received`,
      html: wrap(block({
        title: "✅ Pagesa u konfirmua", heading: `Faleminderit / Thank you, ${esc(d.name, "Punëdhënës")}!`,
        sq: `Pagesa juaj u procesua me sukses dhe paketa <strong>${pkg}</strong> është aktive. Tani mund të publikoni postimet tuaja të punës.`,
        en: `Your payment was successful and the ${pkg} package is now active. You can start publishing your job posts.`,
        details: rows([["Paketa / Package", d.packageName], ["Shuma / Amount", d.amount], ["Postime pune / Job posts", d.credits], ["Vlen deri / Valid until", d.expiryDate], ["Nr. porosisë / Order ID", d.orderId], ["Data / Date", d.paymentDate]]),
        cta: "Posto një punë / Post a job", ctaUrl: "https://jobs.al/employer-dashboard",
        note: "Ky email shërben si konfirmim pagese. / This email serves as your payment confirmation.",
      })),
    },
    "job-payment-completed": {
      subject: `Pagesa u krye — "${d.jobTitle || "Puna juaj"}" është publikuar ✅ / Job published`,
      html: wrap(block({
        title: "✅ Puna juaj u publikua", heading: `Faleminderit / Thank you, ${esc(d.name, "Punëdhënës")}!`,
        sq: `Pagesa u konfirmua dhe njoftimi <strong>${esc(d.jobTitle, "i punës")}</strong> është tani live në Jobs.al.`,
        en: `Payment confirmed — your job post ${esc(d.jobTitle, "")} is now live on Jobs.al.`,
        details: rows([["Opsioni / Option", d.packageName], ["Shuma / Amount", d.amount], ["Nr. porosisë / Order ID", d.orderId], ["Data / Date", d.paymentDate]]),
        cta: "Shiko punën / View job", ctaUrl: d.jobUrl || "https://jobs.al/employer-dashboard",
      })),
    },
    "package-subscribed": {
      subject: `Mirë se vini në paketën "${d.packageName || "Paketa"}" 🎉 / Your monthly package is active`,
      html: wrap(block({
        title: "🎉 Paketa mujore është aktive", heading: hi(d),
        sq: `Abonimi juaj <strong>${pkg}</strong> është aktiv. Do të rinovohet automatikisht çdo muaj derisa ta anuloni.`,
        en: `Your ${pkg} subscription is active and will auto-renew monthly until you cancel.`,
        details: rows([["Paketa / Package", d.packageName], ["Çmimi / Price", d.amount ? `${d.amount} / muaj · month` : undefined], ["Postime në muaj / Job posts per month", d.credits], ["Rinovimi i radhës / Next renewal", d.renewalDate]]),
        cta: "Menaxho paketën / Manage package", ctaUrl: BILLING,
      })),
    },
    "subscription-renewed": {
      subject: `Paketa "${d.packageName || "Paketa"}" u rinovua 🔄 / Package renewed`,
      html: wrap(block({
        title: "🔄 Paketa u rinovua", heading: hi(d),
        sq: `Pagesa mujore për <strong>${pkg}</strong> u krye dhe postimet tuaja u rifreskuan.`,
        en: `Your monthly payment for ${pkg} went through and your job post allowance has been refreshed.`,
        details: rows([["Shuma / Amount", d.amount], ["Rinovimi i radhës / Next renewal", d.renewalDate]]),
        cta: "Shiko faturimin / View billing", ctaUrl: BILLING,
      })),
    },
    "subscription-cancelled": {
      subject: `Rinovimi automatik u anulua / Auto-renewal cancelled`,
      html: wrap(block({
        title: "Rinovimi u anulua", heading: hi(d),
        sq: `Rinovimi automatik për <strong>${pkg}</strong> u anulua. Nuk do të tarifoheni më.`,
        en: `Auto-renewal for ${pkg} has been cancelled. You won't be charged again.`,
        details: rows([["Paketa / Package", d.packageName]]),
        cta: "Shiko paketat / View packages", ctaUrl: "https://jobs.al/pricing?view=monthly",
        note: "Ndryshuat mendje? Mund të abonoheni përsëri në çdo kohë. / Changed your mind? You can resubscribe anytime.",
      })),
    },
    "package-expiring": {
      subject: `Paketa "${d.packageName || "Paketa"}" skadon për ${d.daysLeft || "7"} ditë ⏰ / Package expiring soon`,
      html: wrap(block({
        title: "⏰ Paketa juaj po skadon", heading: hi(d),
        sq: `Paketa <strong>${pkg}</strong> skadon më <strong>${esc(d.expiryDate)}</strong> (${esc(d.daysLeft)} ditë). Postimet e papërdorura nuk transferohen.`,
        en: `Your ${pkg} package expires on ${esc(d.expiryDate)} (${esc(d.daysLeft)} days). Unused job posts do not carry over.`,
        details: rows([["Postime të mbetura / Job posts left", d.creditsLeft], ["Skadon / Expires", d.expiryDate]]),
        cta: "Rinovo paketën / Renew package", ctaUrl: "mailto:info@jobs.al?subject=Package%20renewal",
      })),
    },
    "package-expired": {
      subject: `Paketa "${d.packageName || "Paketa"}" ka skaduar ⚠️ / Package expired`,
      html: wrap(block({
        title: "⚠️ Paketa ka skaduar", heading: hi(d),
        sq: `Paketa <strong>${pkg}</strong> skadoi më ${esc(d.expiryDate)}. Mund të vazhdoni me një postim falas në muaj ose të zgjidhni një paketë të re.`,
        en: `Your ${pkg} package expired on ${esc(d.expiryDate)}. You still get one free job post per month, or choose a new package.`,
        details: "", cta: "Shiko paketat / View packages", ctaUrl: "https://jobs.al/pricing",
      })),
    },
    "package-credits-low": {
      subject: `Ju kanë mbetur ${d.creditsLeft || "pak"} postime pune / Only ${d.creditsLeft || "a few"} job posts left`,
      html: wrap(block({
        title: "📉 Postimet po mbarojnë", heading: hi(d),
        sq: `Ju kanë mbetur vetëm <strong>${esc(d.creditsLeft)}</strong> postime në paketën <strong>${pkg}</strong>.`,
        en: `You have only ${esc(d.creditsLeft)} job posts left in your ${pkg} package.`,
        details: rows([["Përdorur / Used", d.creditsUsed], ["Gjithsej / Total", d.credits], ["Skadon / Expires", d.expiryDate]]),
        cta: "Shiko faturimin / View billing", ctaUrl: BILLING,
      })),
    },
    "admin-payment-notification": {
      subject: `💶 New payment: ${d.amount || ""} — ${d.packageName || ""} (${d.companyName || d.email || ""})`,
      html: wrap(`<div class="content"><h2>New payment received</h2>
        ${rows([["Customer", d.name], ["Email", d.email], ["Company", d.companyName], ["Item", d.packageName], ["Amount", d.amount], ["Order ID", d.orderId], ["Date", d.paymentDate]])}
        <p style="text-align:center;"><a href="https://jobs.al/admin/revenue" class="cta-button">Open admin</a></p></div>`),
    },
  };
}
