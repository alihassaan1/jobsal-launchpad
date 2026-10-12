import LegalPage, { LegalSection } from "@/components/LegalPage";

const en: LegalSection[] = [
  { heading: "Who we are", body: ["Jobs.al is an online job portal that connects job seekers and employers in Albania. This policy explains what personal data we collect, why we collect it, and the choices you have. For any question about your data, write to info@jobs.al."] },
  { heading: "Information we collect", body: [
    "Account data: your name, email address, password (stored encrypted) and account type (job seeker or employer).",
    "Profile and career data: resumes, work experience, education, skills, cover letters and documents you choose to upload.",
    "Employer data: company name, logo, description, contact details, job listings and billing information.",
    "Usage data: pages visited, searches, device and browser type, IP address and approximate location, collected through cookies and similar technologies.",
  ] },
  { heading: "How we use your information", body: [
    "To create and manage your account, publish job listings and process applications.",
    "To share your application and resume with the employer you apply to. If you turn on Talent Pool visibility, employers with an active plan may find your anonymised profile and request to view it.",
    "To send job alerts, account notices and, where you agreed, marketing emails. You can unsubscribe at any time.",
    "To improve our services, including AI features such as resume building, resume parsing and job matching.",
    "To prevent fraud, spam and abuse, and to meet our legal obligations.",
  ] },
  { heading: "Cookies and analytics", body: [
    "We use essential cookies to keep you signed in and remember your language. We use Google Analytics to understand how visitors use the site. These tools may set cookies and process your IP address.",
  ] },
  { heading: "Advertising (Google AdSense)", body: [
    "We may show advertisements served by Google and other third-party vendors. These vendors use cookies to serve ads based on your previous visits to this and other websites.",
    "Google's use of advertising cookies enables it and its partners to serve ads based on your visits to Jobs.al and/or other sites on the internet.",
    "You can opt out of personalised advertising by visiting Google Ads Settings (https://adssettings.google.com) or www.aboutads.info.",
  ] },
  { heading: "Sharing your information", body: [
    "We do not sell your personal data. We share it only with employers you apply to, with service providers that help us run the platform (hosting, email delivery, payments, analytics), and with authorities when required by law.",
  ] },
  { heading: "Data retention and security", body: [
    "We keep your data while your account is active and for as long as needed to provide the service or meet legal obligations. We use encryption, access controls and private file storage to protect your information.",
  ] },
  { heading: "Your rights", body: [
    "Under Albanian Law No. 9887 \"On the Protection of Personal Data\" and, where applicable, the GDPR, you have the right to access, correct, delete or export your data, and to object to or restrict its processing. You can also withdraw consent at any time.",
    "To exercise these rights, email info@jobs.al. You may also file a complaint with the Information and Data Protection Commissioner of Albania (IDP).",
  ] },
  { heading: "Children", body: ["Jobs.al is not intended for anyone under 16. We do not knowingly collect data from children."] },
  { heading: "Changes to this policy", body: ["We may update this policy from time to time. The date at the top shows the latest version. Significant changes will be announced on the site or by email."] },
  { heading: "Contact", body: ["Jobs.al, Tirana, Albania. Email: info@jobs.al"] },
];

const sq: LegalSection[] = [
  { heading: "Kush jemi ne", body: ["Jobs.al është një portal pune online që lidh punëkërkuesit dhe punëdhënësit në Shqipëri. Kjo politikë shpjegon cilat të dhëna personale mbledhim, pse i mbledhim dhe zgjedhjet që keni. Për çdo pyetje shkruani në info@jobs.al."] },
  { heading: "Të dhënat që mbledhim", body: [
    "Të dhëna llogarie: emri, email-i, fjalëkalimi (i ruajtur i enkriptuar) dhe lloji i llogarisë (punëkërkues ose punëdhënës).",
    "Të dhëna profili dhe karriere: CV, përvoja, arsimimi, aftësitë, letrat e motivimit dhe dokumentet që ngarkoni.",
    "Të dhëna punëdhënësi: emri i kompanisë, logo, përshkrimi, kontaktet, njoftimet për punë dhe të dhënat e faturimit.",
    "Të dhëna përdorimi: faqet e vizituara, kërkimet, pajisja dhe shfletuesi, adresa IP dhe vendndodhja e përafërt, të mbledhura përmes cookies.",
  ] },
  { heading: "Si i përdorim të dhënat", body: [
    "Për të krijuar dhe menaxhuar llogarinë tuaj, për të publikuar njoftime pune dhe për të përpunuar aplikimet.",
    "Për të ndarë aplikimin dhe CV-në tuaj me punëdhënësin ku aplikoni. Nëse aktivizoni dukshmërinë në Talent Pool, punëdhënësit me plan aktiv mund të gjejnë profilin tuaj anonim.",
    "Për të dërguar njoftime pune, njoftime llogarie dhe, me pëlqimin tuaj, email-e marketingu. Mund të çregjistroheni në çdo kohë.",
    "Për të përmirësuar shërbimet, përfshirë funksionet me AI si krijimi i CV-së dhe përputhja me punët.",
    "Për të parandaluar mashtrimin, spam-in dhe abuzimin, dhe për të përmbushur detyrimet ligjore.",
  ] },
  { heading: "Cookies dhe analitika", body: ["Përdorim cookies thelbësore për t'ju mbajtur të identifikuar dhe për të ruajtur gjuhën. Përdorim Google Analytics për të kuptuar si përdoret faqja."] },
  { heading: "Reklamat (Google AdSense)", body: [
    "Mund të shfaqim reklama nga Google dhe palë të treta. Këta ofrues përdorin cookies për të shfaqur reklama bazuar në vizitat tuaja të mëparshme në këtë dhe faqe të tjera.",
    "Mund të çaktivizoni reklamat e personalizuara te Google Ads Settings (https://adssettings.google.com) ose www.aboutads.info.",
  ] },
  { heading: "Ndarja e të dhënave", body: ["Ne nuk i shesim të dhënat tuaja. I ndajmë vetëm me punëdhënësit ku aplikoni, me ofruesit që na ndihmojnë të funksionojmë (hostim, email, pagesa, analitikë) dhe me autoritetet kur kërkohet me ligj."] },
  { heading: "Ruajtja dhe siguria", body: ["I ruajmë të dhënat për sa kohë llogaria është aktive ose sa nevojitet për shërbimin dhe detyrimet ligjore. Përdorim enkriptim, kontroll aksesi dhe ruajtje private të skedarëve."] },
  { heading: "Të drejtat tuaja", body: [
    "Sipas Ligjit Nr. 9887 \"Për Mbrojtjen e të Dhënave Personale\" dhe, kur zbatohet, GDPR, keni të drejtë të aksesoni, korrigjoni, fshini ose eksportoni të dhënat, si dhe të kundërshtoni ose kufizoni përpunimin.",
    "Për t'i ushtruar këto të drejta shkruani në info@jobs.al. Mund të ankoheni edhe te Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave Personale (IDP).",
  ] },
  { heading: "Fëmijët", body: ["Jobs.al nuk është për persona nën 16 vjeç. Nuk mbledhim me dijeni të dhëna nga fëmijët."] },
  { heading: "Ndryshimet", body: ["Mund ta përditësojmë këtë politikë herë pas here. Data në krye tregon versionin e fundit."] },
  { heading: "Kontakti", body: ["Jobs.al, Tiranë, Shqipëri. Email: info@jobs.al"] },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      path="/privacy"
      title={{ sq: "Politika e Privatësisë", en: "Privacy Policy" }}
      seoTitle={{ sq: "Politika e Privatësisë | Jobs.al", en: "Privacy Policy | Jobs.al Albania Job Portal" }}
      description={{
        sq: "Si Jobs.al mbledh, përdor dhe mbron të dhënat tuaja personale, cookies dhe reklamat.",
        en: "How Jobs.al collects, uses and protects your personal data, including cookies, analytics and advertising.",
      }}
      updated="12 October 2026"
      sections={{ sq, en }}
    />
  );
}
