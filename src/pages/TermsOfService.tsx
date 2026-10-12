import LegalPage, { LegalSection } from "@/components/LegalPage";

const en: LegalSection[] = [
  { heading: "Acceptance of terms", body: ["By creating an account or using Jobs.al you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform."] },
  { heading: "Accounts", body: [
    "You must provide accurate information and keep your login details secure. You are responsible for all activity under your account.",
    "You must be at least 16 years old to use Jobs.al. We may suspend or close accounts that break these terms.",
  ] },
  { heading: "Job seekers", body: [
    "You are responsible for the accuracy of your resume, profile and documents. Do not upload content that is false, misleading or belongs to someone else.",
    "When you apply to a job, your application is shared with that employer. Jobs.al is not a party to any employment agreement and does not guarantee interviews or job offers.",
  ] },
  { heading: "Employers", body: [
    "Job listings must describe real, currently open positions and comply with Albanian labour and anti-discrimination law.",
    "It is forbidden to post fake jobs, pyramid schemes, requests for payment from candidates, or listings that collect personal data for other purposes.",
    "Candidate data received through Jobs.al may be used only for recruitment and must be handled in line with data protection law.",
  ] },
  { heading: "Paid plans and payments", body: [
    "Some features, such as additional job posts, featured listings, Talent Pool access and advertising, require a paid plan. Prices are shown on the Pricing page before purchase.",
    "Subscriptions renew automatically unless cancelled before the renewal date. Fees already paid are non-refundable except where required by law or stated otherwise.",
  ] },
  { heading: "Acceptable use", body: ["You may not scrape the site, send spam, attempt to access other accounts, upload malware, or use the platform for any unlawful purpose."] },
  { heading: "Content and intellectual property", body: [
    "You keep ownership of content you upload, and grant Jobs.al a licence to host and display it to provide the service.",
    "The Jobs.al name, logo, design, resume templates and software belong to Jobs.al and may not be copied without permission.",
  ] },
  { heading: "AI features", body: ["AI-generated suggestions (resumes, cover letters, job matches) are provided as help only. Please review them before use; we do not guarantee their accuracy."] },
  { heading: "Moderation", body: ["We may review, edit or remove listings and content that break these terms, and report illegal activity to the authorities."] },
  { heading: "Limitation of liability", body: ["Jobs.al is provided \"as is\". To the extent permitted by law, we are not liable for indirect losses, for the conduct of employers or candidates, or for decisions made based on content on the platform."] },
  { heading: "Governing law", body: ["These terms are governed by the laws of the Republic of Albania. Disputes fall under the competent courts of Tirana."] },
  { heading: "Changes and contact", body: ["We may update these terms. Continued use after changes means you accept them. Questions: info@jobs.al"] },
];

const sq: LegalSection[] = [
  { heading: "Pranimi i kushteve", body: ["Duke krijuar një llogari ose duke përdorur Jobs.al, ju pranoni këto Kushte Shërbimi dhe Politikën tonë të Privatësisë. Nëse nuk jeni dakord, mos e përdorni platformën."] },
  { heading: "Llogaritë", body: [
    "Duhet të jepni informacion të saktë dhe të mbani të sigurta të dhënat e hyrjes. Jeni përgjegjës për çdo veprim në llogarinë tuaj.",
    "Duhet të jeni të paktën 16 vjeç. Mund të pezullojmë ose mbyllim llogaritë që shkelin këto kushte.",
  ] },
  { heading: "Punëkërkuesit", body: [
    "Jeni përgjegjës për saktësinë e CV-së, profilit dhe dokumenteve. Mos ngarkoni përmbajtje të rreme ose që i përket dikujt tjetër.",
    "Kur aplikoni, aplikimi ndahet me punëdhënësin. Jobs.al nuk është palë në marrëveshjen e punës dhe nuk garanton intervista apo oferta.",
  ] },
  { heading: "Punëdhënësit", body: [
    "Njoftimet duhet të përshkruajnë pozicione reale dhe të hapura, në përputhje me legjislacionin shqiptar të punës dhe kundër diskriminimit.",
    "Ndalohen punët e rreme, skemat piramidale, kërkesat për pagesë nga kandidatët ose njoftimet që mbledhin të dhëna për qëllime të tjera.",
    "Të dhënat e kandidatëve mund të përdoren vetëm për rekrutim dhe sipas ligjit për mbrojtjen e të dhënave.",
  ] },
  { heading: "Planet me pagesë", body: [
    "Disa funksione kërkojnë plan me pagesë. Çmimet shfaqen në faqen e Çmimeve para blerjes.",
    "Abonimet rinovohen automatikisht nëse nuk anulohen para datës së rinovimit. Pagesat e kryera nuk rimbursohen, përveç kur e kërkon ligji.",
  ] },
  { heading: "Përdorimi i lejuar", body: ["Nuk lejohet scraping, spam, aksesi në llogari të tjera, ngarkimi i malware ose përdorimi për qëllime të paligjshme."] },
  { heading: "Përmbajtja dhe pronësia intelektuale", body: [
    "Ju mbetet pronësia e përmbajtjes që ngarkoni dhe i jepni Jobs.al licencë për ta shfaqur për të ofruar shërbimin.",
    "Emri, logoja, dizajni, shabllonet e CV-ve dhe softueri i Jobs.al nuk mund të kopjohen pa leje.",
  ] },
  { heading: "Funksionet me AI", body: ["Sugjerimet e gjeneruara nga AI ofrohen vetëm si ndihmë. Ju lutemi rishikojini para përdorimit."] },
  { heading: "Moderimi", body: ["Mund të rishikojmë, ndryshojmë ose heqim përmbajtje që shkel këto kushte dhe të raportojmë veprimtari të paligjshme."] },
  { heading: "Kufizimi i përgjegjësisë", body: ["Jobs.al ofrohet \"siç është\". Për aq sa lejon ligji, nuk mbajmë përgjegjësi për humbje indirekte apo për sjelljen e punëdhënësve ose kandidatëve."] },
  { heading: "Ligji i zbatueshëm", body: ["Këto kushte rregullohen nga ligjet e Republikës së Shqipërisë. Mosmarrëveshjet i nënshtrohen gjykatave kompetente të Tiranës."] },
  { heading: "Ndryshimet dhe kontakti", body: ["Mund t'i përditësojmë këto kushte. Përdorimi i vazhdueshëm nënkupton pranimin e tyre. Pyetje: info@jobs.al"] },
];

export default function TermsOfService() {
  return (
    <LegalPage
      path="/terms"
      title={{ sq: "Kushtet e Shërbimit", en: "Terms of Service" }}
      seoTitle={{ sq: "Kushtet e Shërbimit | Jobs.al", en: "Terms of Service | Jobs.al Albania Job Portal" }}
      description={{
        sq: "Rregullat për përdorimin e Jobs.al nga punëkërkuesit dhe punëdhënësit, planet me pagesë dhe përgjegjësitë.",
        en: "Rules for using Jobs.al as a job seeker or employer, including job posting rules, paid plans and liability.",
      }}
      updated="12 October 2026"
      sections={{ sq, en }}
    />
  );
}
