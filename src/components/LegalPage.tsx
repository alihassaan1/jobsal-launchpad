import { Helmet } from "react-helmet";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  path: string;
  title: { sq: string; en: string };
  seoTitle: { sq: string; en: string };
  description: { sq: string; en: string };
  updated: string;
  sections: { sq: LegalSection[]; en: LegalSection[] };
}

export default function LegalPage({ path, title, seoTitle, description, updated, sections }: LegalPageProps) {
  const { language } = useLanguage();
  const lang = language === "sq" ? "sq" : "en";
  const url = `https://jobs.al${path}`;

  return (
    <>
      <Helmet>
        <title>{seoTitle[lang]}</title>
        <meta name="description" content={description[lang]} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={seoTitle[lang]} />
        <meta property="og:description" content={description[lang]} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title[lang]}</h1>
          <p className="text-sm text-muted-foreground mb-10">
            {lang === "sq" ? "Përditësuar më: " : "Last updated: "}
            {updated}
          </p>
          <div className="space-y-8">
            {sections[lang].map((s, i) => (
              <section key={i}>
                <h2 className="text-xl font-semibold mb-3">
                  {i + 1}. {s.heading}
                </h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  {s.body.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
