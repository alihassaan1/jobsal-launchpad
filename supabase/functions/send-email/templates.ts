// Jobs.al transactional and lifecycle emails (Albanian), built on the shared branded layout.
// All values in `data` are already HTML-escaped by sanitizeEmailData.
import { badge, bullets, button, button2, details, fmtDate, h1, jobCard, link, note, p, stats, steps, wrapEmail } from "../_shared/emailLayout.ts";

type D = Record<string, string>;
type T = { subject: string; html: string };

const hello = (d: D, fallback = "") => `Përshëndetje${d.name ? `, ${d.name}` : fallback ? `, ${fallback}` : ""}!`;
const parseJobs = (raw?: string): Record<string, string>[] => {
  try { const j = JSON.parse(raw || "[]"); return Array.isArray(j) ? j : []; } catch { return []; }
};
const support = () => p(`Keni pyetje? Na shkruani në ${link("support@jobs.al", "mailto:support@jobs.al")}.`, true);
const billingHelp = (extra = "") => p(`${extra}Për pyetje rreth faturimit: ${link("info@jobs.al", "mailto:info@jobs.al")}`, true);

export function lifecycleTemplates(d: D): Record<string, T> {
  return {
    "welcome": {
      subject: "Mirë se vini në Jobs.al, karriera juaj fillon këtu",
      html: wrapEmail(
        h1(`Mirë se vini në Jobs.al${d.name ? `, ${d.name}` : ""}!`)
        + p("Faleminderit që u bashkuat me Jobs.al, portalin e punësimit për Shqipërinë. Punëdhënësit publikojnë vendet e lira dhe ju aplikoni direkt.")
        + p("Tre hapa për të filluar:")
        + steps([
          ["Krijoni ose ngarkoni CV-në", "Ndërtuesi ynë me AI ju ndihmon të krijoni një CV profesionale në pak minuta."],
          ["Kërkoni punë", "Filtroni sipas qytetit, kategorisë dhe llojit të punës."],
          ["Ndiqni kompanitë", "Merrni njoftime kur kompanitë që ju interesojnë publikojnë punë të reja."],
        ])
        + button("Krijo CV-në tënde", "https://jobs.al/resume-builder")
        + support(),
        { preheader: "Krijoni CV-në dhe aplikoni për punë në Shqipëri." },
      ),
    },

    "resume-reminder-1": {
      subject: `${d.name || "Përshëndetje"}, CV-ja juaj po pret`,
      html: wrapEmail(
        h1("CV-ja juaj po pret")
        + p(hello(d))
        + p("Ende nuk keni krijuar ose ngarkuar një CV në Jobs.al. Pa CV, punëdhënësit nuk mund t'ju shqyrtojnë kur aplikoni.")
        + p("Ndërtuesi ynë i CV-së me AI ju ndihmon të krijoni një CV profesionale në pak minuta:")
        + steps([
          ["Ndihmë nga AI", "Sugjerime për përshkrime profesionale të përvojës suaj."],
          ["Shabllone profesionale", "Zgjidhni nga shabllone moderne dhe të qarta."],
          ["Shkarkim në PDF", "Eksportoni CV-në me cilësi të lartë."],
        ])
        + button("Ndërto CV-në tani", "https://jobs.al/resume-builder")
        + p(`Keni tashmë një CV? ${link("Ngarkojeni këtu", "https://jobs.al/my-resumes")}.`, true),
        { preheader: "Krijoni CV-në në pak minuta me ndërtuesin tonë me AI." },
      ),
    },

    "resume-reminder-2": {
      subject: `${d.name || "Përshëndetje"}, a jeni ende duke kërkuar punë?`,
      html: wrapEmail(
        h1("A jeni ende duke kërkuar punë?")
        + p(hello(d))
        + p("Kanë kaluar disa ditë që kur u regjistruat, por ende nuk keni CV në profil. A mund t'ju ndihmojmë?")
        + note("<b>E dinit?</b> Punëdhënësit i shqyrtojnë aplikimet duke lexuar CV-në. Një CV e plotë rrit shanset për t'u thirrur në intervistë.", "warn")
        + p("Ndërtuesi ynë i CV-së ju udhëzon hap pas hapi:")
        + steps([
          ["Plotësoni të dhënat bazë", ""],
          ["Merrni sugjerime nga AI për përshkrimet", ""],
          ["Zgjidhni një shabllon", ""],
          ["Shkarkoni CV-në në PDF", ""],
        ])
        + button("Fillo tani, është falas", "https://jobs.al/resume-builder")
        + support(),
        { preheader: "Ju ndihmojmë të krijoni CV-në hap pas hapi." },
      ),
    },

    "resume-reminder-final": {
      subject: "Kujtesa e fundit: punëdhënësit po kërkojnë kandidatë",
      html: wrapEmail(
        h1("Kujtesa e fundit")
        + p(hello(d))
        + p("Punëdhënësit po kërkojnë kandidatë, por pa CV ata nuk mund t'ju shqyrtojnë.")
        + (d.newJobsCount ? details([["Punë të reja këtë javë", `${d.newJobsCount}+`]]) : "")
        + p("Me një CV në Jobs.al ju:")
        + bullets(["Aplikoni më shpejt për punë", "Merrni rekomandime pune sipas profilit tuaj", "Punëdhënësit shohin përvojën tuaj kur aplikoni"])
        + button("Krijo CV-në tani", "https://jobs.al/resume-builder")
        + p("Ky është emaili ynë i fundit kujtues për CV-në.", true),
        { preheader: "Krijoni CV-në falas dhe aplikoni më shpejt." },
      ),
    },

    "weekly-digest": {
      subject: `${d.jobCount || "Punë të reja"} punë të reja për ju këtë javë`,
      html: wrapEmail(
        h1("Përmbledhja javore")
        + p(hello(d))
        + p("Këto janë punët e reja që përputhen me profilin tuaj këtë javë:")
        + (parseJobs(d.jobs).map((j) => jobCard({ title: j.title, company: j.company, meta: [j.location, j.type].filter(Boolean).join(" · "), linkText: "Shiko detajet", linkUrl: `https://jobs.al/jobs/${j.slug}` })).join("")
          || note("Vizitoni Jobs.al për të parë mundësitë më të reja."))
        + button("Shiko të gjitha punët", "https://jobs.al/jobs")
        + (d.totalJobs ? p(`${d.totalJobs}+ punë aktive në Jobs.al.`, true) : ""),
        { preheader: "Punët e reja që përputhen me profilin tuaj." },
      ),
    },

    "application-confirmation": {
      subject: `Aplikimi juaj për "${d.jobTitle || "pozicionin"}" u dërgua`,
      html: wrapEmail(
        h1("Aplikimi u dërgua", d.jobTitle && d.company ? `${d.jobTitle} · ${d.company}` : undefined)
        + p(`Urime${d.name ? `, ${d.name}` : ""}! Aplikimi juaj për pozicionin <b>${d.jobTitle || "e punës"}</b>${d.company ? ` te <b>${d.company}</b>` : ""} u dërgua me sukses.`)
        + jobCard({ title: d.jobTitle || "Pozicioni", company: d.company, meta: d.location })
        + p("<b>Çfarë ndodh tani?</b>")
        + steps([
          ["Punëdhënësi shqyrton aplikimin", "Do t'ju njoftojmë kur statusi ndryshon."],
          ["Kontakti për intervistë", "Nëse përzgjidheni, punëdhënësi do t'ju kontaktojë."],
          ["Vazhdoni të aplikoni", "Sa më shumë aplikime, aq më shumë mundësi."],
        ])
        + button("Shiko aplikimet e mia", "https://jobs.al/candidate-dashboard"),
        { preheader: `Aplikimi juaj për ${d.jobTitle || "punën"} u dërgua me sukses.` },
      ),
    },

    "job-match": {
      subject: `${d.matchCount || "Disa"} punë të reja përputhen me CV-në tuaj`,
      html: wrapEmail(
        h1("Punë të reja për ju")
        + p(hello(d))
        + p(`Gjetëm <b>${d.matchCount || parseJobs(d.jobs).length || "disa"} punë të reja</b> që përputhen me aftësitë dhe përvojën tuaj:`)
        + (parseJobs(d.jobs).map((j) => jobCard({ title: j.title, company: j.company, meta: [j.location, j.type, j.matchScore ? `${j.matchScore}% përputhje` : ""].filter(Boolean).join(" · "), linkText: "Apliko tani", linkUrl: `https://jobs.al/jobs/${j.slug}` })).join("")
          || note("Vizitoni Jobs.al për rekomandime të personalizuara."))
        + button("Shiko të gjitha rekomandimet", "https://jobs.al/recommended-jobs")
        + note(`<b>Këshillë:</b> Mbani CV-në të përditësuar për rekomandime më të sakta. ${link("Përditëso CV-në", "https://jobs.al/my-resumes")}`),
        { preheader: "Punë të reja që përputhen me CV-në tuaj." },
      ),
    },

    "application-status": (() => {
      const map: Record<string, { label: string; bg: string; color: string; msg: string }> = {
        reviewed: { label: "Shqyrtuar", bg: "#E8F0FE", color: "#1D4ED8", msg: "Aplikimi juaj u shqyrtua nga punëdhënësi." },
        shortlisted: { label: "Listë e shkurtër", bg: "#E6F6EE", color: "#065F46", msg: "Urime! Jeni përzgjedhur në listën e shkurtër. Punëdhënësi mund t'ju kontaktojë së shpejti për hapin e ardhshëm." },
        rejected: { label: "Nuk u përzgjodh", bg: "#FDF1F1", color: "#A3191C", msg: "Punëdhënësi vendosi të vazhdojë me kandidatë të tjerë. Mos u dekurajoni, ka shumë mundësi të tjera në Jobs.al." },
        interview: { label: "Intervistë", bg: "#FFF8E6", color: "#7A5200", msg: "Punëdhënësi dëshiron t'ju takojë. Do t'ju kontaktojnë për caktimin e intervistës." },
      };
      const s = map[d.status || "reviewed"] || map.reviewed;
      const rejected = d.status === "rejected";
      return {
        subject: `Përditësim për aplikimin tuaj te ${d.company || "kompania"}`,
        html: wrapEmail(
          h1("Përditësim për aplikimin tuaj")
          + p(hello(d))
          + jobCard({ title: d.jobTitle || "Pozicioni", company: d.company, meta: d.location, extra: badge(s.label, s.bg, s.color) })
          + p(s.msg)
          + (d.notes ? note(`<b>Shënim nga punëdhënësi:</b> ${d.notes}`) : "")
          + (rejected ? button("Zbulo punë të reja", "https://jobs.al/jobs") : button("Shiko aplikimet e mia", "https://jobs.al/candidate-dashboard")),
          { preheader: `Statusi i aplikimit: ${s.label}.` },
        ),
      };
    })(),

    "profile-incomplete": {
      subject: `${d.name || "Përshëndetje"}, plotësoni profilin tuaj në Jobs.al`,
      html: wrapEmail(
        h1("Plotësoni profilin tuaj")
        + p(hello(d))
        + p("Profili juaj në Jobs.al nuk është plotësuar ende. Një profil i plotë ju ndihmon të dalloheni kur aplikoni.")
        + (d.completionPercent ? note(`<b>Profili juaj është ${d.completionPercent}% i plotë.</b>`, "warn") : "")
        + p("<b>Fushat që mungojnë:</b>")
        + bullets((d.missingFields || "telefon, vendndodhje, bio").split(",").map((f) => f.trim()).filter(Boolean))
        + steps([
          ["Më shumë besueshmëri", "Punëdhënësit shohin një profil të plotë kur shqyrtojnë aplikimin tuaj."],
          ["Rekomandime më të sakta", "Me më shumë informacion ju sugjerojmë punë më të përshtatshme."],
        ])
        + button("Plotëso profilin", "https://jobs.al/candidate-dashboard")
        + p("Zgjat vetëm 2 minuta.", true),
        { preheader: "Plotësoni profilin për rekomandime më të mira." },
      ),
    },

    "reactivation": {
      subject: d.newJobsCount ? `${d.newJobsCount}+ punë të reja ju presin në Jobs.al` : "Punë të reja ju presin në Jobs.al",
      html: wrapEmail(
        h1("Na keni munguar!")
        + p(hello(d))
        + p("Ka kaluar pak kohë që nga vizita juaj e fundit në Jobs.al. Ndërkohë janë shtuar mundësi të reja.")
        + (d.newJobsCount ? details([["Punë të reja që nga vizita juaj", `${d.newJobsCount}+`]]) : "")
        + p("<b>Çfarë ka të re:</b>")
        + bullets(["Kompani të reja që publikojnë punë", "Ndërtues i përmirësuar i CV-së me AI", "Rekomandime pune më të sakta"])
        + (d.topCategories ? p(`<b>Kategoritë më të kërkuara tani:</b> ${d.topCategories}`) : "")
        + button("Zbulo punë të reja", "https://jobs.al/jobs")
        + button2("Përditëso CV-në", "https://jobs.al/resume-builder"),
        { preheader: "Shikoni punët e reja në Jobs.al." },
      ),
    },

    "employer-welcome": {
      subject: "Mirë se vini në Jobs.al si punëdhënës",
      html: wrapEmail(
        h1("Mirë se vini, punëdhënës!")
        + p(hello(d))
        + p("Faleminderit që zgjodhët Jobs.al për rekrutimin tuaj. Ja si të filloni:")
        + steps([
          ["Krijoni profilin e kompanisë", "Shtoni logon, përshkrimin dhe informacionin e kompanisë."],
          ["Publikoni punën e parë", "Krijoni një njoftim pune dhe merrni aplikime direkt në panel."],
          ["Menaxhoni aplikantët", "Shqyrtoni CV-të dhe ndryshoni statusin e kandidatëve nga paneli."],
        ])
        + button("Krijo profilin e kompanisë", "https://jobs.al/setup-company")
        + note("<b>Këshillë:</b> Kompanitë me logo dhe përshkrim të plotë duken më të besueshme për kandidatët.")
        + p(`Keni pyetje? Na shkruani në ${link("info@jobs.al", "mailto:info@jobs.al")}.`, true),
        { preheader: "Krijoni profilin e kompanisë dhe publikoni punën e parë." },
      ),
    },

    "job-expiring": {
      subject: `"${d.jobTitle || "Puna"}" skadon për ${d.daysLeft || "pak"} ditë`,
      html: wrapEmail(
        h1("Një punë po skadon")
        + p(hello(d))
        + p("Një punë që keni parë ose ruajtur skadon së shpejti:")
        + jobCard({
          title: d.jobTitle || "Pozicioni", company: d.company,
          meta: [d.location, d.jobType, d.salary].filter(Boolean).join(" · "),
          extra: badge(`Skadon për ${d.daysLeft || "pak"} ditë`, "#FFF8E6", "#7A5200"),
        })
        + (d.deadline ? note(`<b>Afati i aplikimit:</b> ${d.deadline}`, "warn") : "")
        + button("Apliko tani", `https://jobs.al/jobs/${d.jobSlug || ""}`)
        + p(`Nuk jeni i interesuar? ${link("Shikoni punë të tjera", "https://jobs.al/jobs")}.`, true),
        { preheader: `${d.jobTitle || "Puna"} skadon së shpejti.` },
      ),
    },

    "new-applicant": {
      subject: `Aplikant i ri për "${d.jobTitle || "pozicionin tuaj"}"`,
      html: wrapEmail(
        h1("Keni një aplikant të ri", d.jobTitle || undefined)
        + p(`Përshëndetje${d.employerName ? ` ${d.employerName}` : ""},`)
        + p("Një kandidat sapo aplikoi për pozicionin tuaj në Jobs.al. CV-ja është bashkëngjitur në aplikim.")
        + details([
          ["Emri i aplikantit", d.applicantName || "Kandidati"],
          ["Email", d.applicantEmail],
          ["Përputhje AI", d.matchScore ? `${d.matchScore}%` : ""],
          ["Data e aplikimit", d.appliedDate || fmtDate(new Date())],
          ["Aplikime gjithsej", d.totalApplications],
        ])
        + button("Shiko CV-në dhe aplikimin", d.jobId ? `https://jobs.al/ats/jobs/${d.jobId}` : "https://jobs.al/employer-dashboard")
        + (d.applicantEmail ? p("Mund t'i përgjigjeni këtij emaili për të kontaktuar drejtpërdrejt kandidatin.", true) : ""),
        { preheader: `${d.applicantName || "Një kandidat"} aplikoi për ${d.jobTitle || "pozicionin tuaj"}.` },
      ),
    },

    "interview-scheduled": {
      subject: `Intervista juaj u konfirmua${d.interviewDate ? ` për ${d.interviewDate}` : ""}`,
      html: wrapEmail(
        h1("Intervista u konfirmua")
        + p(`Urime${d.name ? `, ${d.name}` : ""}! Intervista juaj është caktuar. Ja detajet:`)
        + details([
          ["Kompania", d.company || "Kompania"],
          ["Pozicioni", d.jobTitle || "Pozicioni"],
          ["Data", d.interviewDate || "Do të konfirmohet"],
          ["Ora", d.interviewTime || "Do të konfirmohet"],
          ["Vendndodhja", d.interviewLocation],
          ["Lloji", d.interviewType ? (d.interviewType === "online" ? "Online" : "Në person") : ""],
        ])
        + (d.meetingLink ? button("Hyr në takim", d.meetingLink) : "")
        + (d.interviewNotes ? note(`<b>Shënime nga punëdhënësi:</b> ${d.interviewNotes}`) : "")
        + p("<b>Këshilla për përgatitje:</b>")
        + bullets([`Lexoni për kompaninë${d.company ? ` ${d.company}` : ""} para intervistës`, "Rishikoni CV-në dhe përvojën tuaj", "Vishuni në mënyrë profesionale", "Mbërrini 10 minuta para orarit"])
        + button2("Shiko aplikimet e mia", "https://jobs.al/candidate-dashboard")
        + p("Suksese me intervistën!"),
        { preheader: `Intervista me ${d.company || "punëdhënësin"} u konfirmua.` },
      ),
    },

    "role-upgrade-employer": {
      subject: "Llogaria juaj u përditësua: tani jeni punëdhënës në Jobs.al",
      html: wrapEmail(
        h1("Tani jeni punëdhënës")
        + p(`Urime${d.name ? `, ${d.name}` : ""}! Llogaria juaj në Jobs.al u përditësua me sukses si <b>punëdhënës</b>.`)
        + p("<b>Çfarë mund të bëni tani:</b>")
        + steps([
          ["Publikoni punë", "Krijoni njoftime pune dhe merrni aplikime."],
          ["Krijoni profilin e kompanisë", "Ndërtoni faqen e kompanisë suaj në Jobs.al."],
          ["Ndiqni rezultatet", "Shikoni shikimet dhe aplikimet për çdo njoftim."],
        ])
        + button("Konfiguro kompaninë", "https://jobs.al/setup-company")
        + button2("Hyr në panelin e punëdhënësit", "https://jobs.al/employer-dashboard")
        + support(),
        { preheader: "Konfiguroni kompaninë dhe publikoni punën e parë." },
      ),
    },

    "resume-upload-reminder": {
      subject: `${d.name || "Përshëndetje"}, ngarkoni CV-në për të aplikuar më shpejt`,
      html: wrapEmail(
        h1("Ngarkoni CV-në tuaj")
        + p(hello(d))
        + p("Ende nuk keni ngarkuar një CV në llogarinë tuaj. Me një CV në profil, aplikimi bëhet shumë më i shpejtë.")
        + steps([
          ["Aplikoni me një klik", "Nuk keni nevojë të plotësoni formularë çdo herë."],
          ["Rekomandime pune", "Sistemi ynë analizon CV-në dhe ju sugjeron punë."],
          ["Punëdhënësit shohin përvojën tuaj", "CV-ja shfaqet në çdo aplikim që dërgoni."],
        ])
        + button("Ngarko CV-në", "https://jobs.al/my-resumes")
        + button2("Ose krijo CV me AI", "https://jobs.al/resume-builder")
        + p("Mund të ngarkoni CV në PDF ose Word.", true),
        { preheader: "Ngarkoni CV-në dhe aplikoni me një klik." },
      ),
    },

    "subscription-renewal": {
      subject: `Abonimi juaj "${d.planName || "Pro"}" rinovohet për ${d.daysLeft || "7"} ditë`,
      html: wrapEmail(
        h1("Abonimi juaj po rinovohet")
        + p(hello(d, "punëdhënës"))
        + p(`Abonimi juaj <b>"${d.planName || "Pro"}"</b> do të rinovohet automatikisht për <b>${d.daysLeft || "7"} ditë</b>.`)
        + details([
          ["Plani", d.planName || "Pro"],
          ["Data e rinovimit", d.renewalDate || "Së shpejti"],
          ["Shuma", `${d.amount || "€0"} / ${d.period || "muaj"}`],
          ["Metoda e pagesës", d.paymentMethod],
        ])
        + p("Nëse dëshironi të ndryshoni ose anuloni abonimin, mund ta bëni para datës së rinovimit.")
        + button("Menaxho abonimin", "https://jobs.al/employer-subscription")
        + billingHelp(),
        { preheader: `Abonimi rinovohet më ${d.renewalDate || "së shpejti"}.` },
      ),
    },

    "subscription-expired": {
      subject: "Abonimi juaj në Jobs.al ka skaduar",
      html: wrapEmail(
        h1("Abonimi juaj ka skaduar")
        + p(hello(d, "punëdhënës"))
        + p(`Plani juaj <b>"${d.planName || "Pro"}"</b> skadoi më <b>${d.expiredDate || "ditën e fundit"}</b>. Pa abonim aktiv nuk keni akses në:`)
        + bullets(["Publikimin e njoftimeve të reja", "Sistemin e ndjekjes së aplikimeve (ATS)", "Shikimin e CV-ve të kandidatëve", "Analitikën e avancuar"])
        + (d.activeJobsCount ? note(`<b>${d.activeJobsCount}</b> njoftime aktive do të çaktivizohen.`, "alert") : "")
        + button("Rinovo abonimin", "https://jobs.al/employer-subscription")
        + button2("Shiko planet", "https://jobs.al/pricing"),
        { preheader: "Rinovoni abonimin për të vazhduar publikimin e punëve." },
      ),
    },

    "payment-receipt": {
      subject: `Pagesa u konfirmua${d.invoiceNumber ? `, fatura #${d.invoiceNumber}` : ""}`,
      html: wrapEmail(
        h1("Pagesa u konfirmua")
        + p(`Faleminderit${d.name ? `, ${d.name}` : ""}! Pagesa juaj u procesua me sukses.`)
        + details([
          ["Nr. i faturës", d.invoiceNumber ? `#${d.invoiceNumber}` : ""],
          ["Data", d.paymentDate || fmtDate(new Date())],
          ["Përshkrimi", d.description || "Abonim Jobs.al"],
          ["Metoda", d.paymentMethod],
          ["Totali", d.amount || "€0"],
        ])
        + (d.pdfUrl ? button("Shkarko faturën PDF", d.pdfUrl) : "")
        + button2("Historia e pagesave", "https://jobs.al/employer-billing")
        + billingHelp("Kjo faturë u gjenerua automatikisht. "),
        { preheader: `Pagesa prej ${d.amount || ""} u konfirmua.` },
      ),
    },

    "payment-failed": {
      subject: `Pagesa për "${d.planName || "abonimin"}" nuk u krye`,
      html: wrapEmail(
        h1("Pagesa nuk u krye")
        + p(hello(d, "punëdhënës"))
        + p(`Provuam të procesojmë pagesën për <b>"${d.planName || "abonimin tuaj"}"</b>, por transaksioni nuk u pranua.`)
        + details([["Shuma", d.amount || "€0"], ["Arsyeja", d.failureReason || "Karta u refuzua"], ["Provat", `${d.attemptCount || "1"} / 3`]])
        + note(`Do ta provojmë pagesën automatikisht edhe <b>${d.retriesLeft || "2"} herë</b>. Për të shmangur ndërprerjen e shërbimit, përditësoni metodën e pagesës.`, "warn")
        + button("Përditëso metodën e pagesës", "https://jobs.al/employer-billing")
        + billingHelp(),
        { preheader: "Përditësoni metodën e pagesës për të shmangur ndërprerjen." },
      ),
    },

    "ad-performance-weekly": {
      subject: `Raporti javor i reklamës: ${d.impressions || "0"} shfaqje, ${d.clicks || "0"} klikime`,
      html: wrapEmail(
        h1("Raporti javor i reklamës", d.weekRange || undefined)
        + p(hello(d, "punëdhënës"))
        + p(`Ja si performoi reklama juaj <b>"${d.adTitle || "Njoftimi"}"</b> këtë javë:`)
        + stats([[d.impressions || "0", "Shfaqje"], [d.clicks || "0", "Klikime"], [d.applications || "0", "Aplikime"]])
        + details([
          ["CTR", d.ctr || "0%"],
          ["Kosto për aplikim", d.costPerApplication || "€0"],
          ["Ditë të mbetura", `${d.daysRemaining || "0"} ditë`],
          ["Buxheti i shpenzuar", `${d.budgetSpent || "€0"} / ${d.budgetTotal || "€0"}`],
        ])
        + (d.recommendation ? note(`<b>Rekomandim:</b> ${d.recommendation}`, "warn") : "")
        + button("Shiko analitikën", "https://jobs.al/employer-analytics")
        + button2("Menaxho reklamat", "https://jobs.al/employer-ads"),
        { preheader: `${d.impressions || "0"} shfaqje dhe ${d.clicks || "0"} klikime këtë javë.` },
      ),
    },

    "invoice-overdue": {
      subject: `Fatura #${d.invoiceNumber || ""} ka kaluar afatin e pagesës`,
      html: wrapEmail(
        h1("Fatura ka kaluar afatin")
        + p(hello(d, "punëdhënës"))
        + p(`Fatura <b>#${d.invoiceNumber || "-"}</b> ka kaluar afatin e pagesës prej <b>${d.daysOverdue || "0"} ditësh</b>.`)
        + details([
          ["Nr. i faturës", `#${d.invoiceNumber || "-"}`],
          ["Data e lëshimit", d.issueDate],
          ["Afati i pagesës", d.dueDate ? `${d.dueDate} (${d.daysOverdue || "0"} ditë vonesë)` : ""],
          ["Shuma e papaguar", d.amount || "€0"],
        ])
        + note(`Nëse pagesa nuk kryhet brenda <b>${d.gracePeriodDays || "7"} ditëve</b>, njoftimet aktive dhe aksesi në panel do të pezullohen.`, "alert")
        + button("Paguaj faturën", "https://jobs.al/employer-billing")
        + (d.pdfUrl ? button2("Shkarko faturën PDF", d.pdfUrl) : "")
        + billingHelp("Nëse e keni kryer pagesën, injorojeni këtë email. "),
        { preheader: `Fatura #${d.invoiceNumber || ""} është e papaguar.` },
      ),
    },
  };
}
