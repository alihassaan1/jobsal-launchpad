import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ShieldCheck, Award } from "lucide-react";
import { Helmet } from "react-helmet";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LISTING_OPTIONS, MONTHLY_PACKAGES, CORPORATE_PACKAGES, eur, approxLek, VAT_NOTE, PAYPAL_NOTE } from "@/lib/pricingConfig";

const copy = {
  title: { sq: "Zgjidh planin e duhur për ty", en: "Choose the right plan for you" },
  subtitle: {
    sq: "Paguaj për çdo punë, kurse me një paketë mujore, ose kërko një paketë korporative me faturë dhe kontratë.",
    en: "Pay per job, save with a monthly package, or request a corporate package with invoice and contract.",
  },
  perJob: { sq: "Për punë", en: "Per job" },
  monthly: { sq: "Paketa mujore", en: "Monthly packages" },
  postJob: { sq: "Publiko një punë", en: "Post a job" },
  subscribe: { sq: "Abonohu", en: "Subscribe" },
  getStarted: { sq: "Fillo tani", en: "Get started" },
  recommended: { sq: "Rekomandohet", en: "Recommended" },
  daysLive: { sq: "30 ditë aktiv", en: "30 days live" },
  daysFeatured: (d: number, sq: boolean) => (sq ? `${d} ditë i veçuar` : `${d} days featured`),
  activeListings: (n: number, sq: boolean) => (sq ? `${n} publikime pune në muaj` : `${n} job postings per month`),
  renews: { sq: "Rinovohet automatikisht çdo muaj, anulo kur të duash", en: "Renews automatically every month, cancel anytime" },
  perMonth: { sq: "/muaj", en: "/month" },
  enterpriseTitle: { sq: "Enterprise", en: "Enterprise" },
  enterpriseDesc: {
    sq: "Për kompani me vëllime të mëdha rekrutimi: profile të shumta kompanish, koordinim i dedikuar dhe promovim i personalizuar.",
    en: "For high-volume hiring: multiple company profiles, dedicated coordination and custom promotion.",
  },
  customQuote: { sq: "Ofertë e personalizuar", en: "Custom quote" },
  corpTitle: { sq: "Paketa korporative", en: "Corporate packages" },
  corpSubtitle: {
    sq: "Publikime të veçuara të parapaguara me faturë dhe kontratë. Për kompani që kanë nevojë për prokurim formal.",
    en: "Prepaid Featured job postings with invoice and contract. For companies that need formal procurement.",
  },
  bestValue: { sq: "Vlera më e mirë", en: "Best value" },
  value: (v: string, pct: number, sq: boolean) => pct ? (sq ? `vlerë ${v}, kurseni ${pct}%` : `${v} value, save ${pct}%`) : (sq ? `vlerë ${v}` : `${v} value`),
  validMonths: (n: number, sq: boolean) => (sq ? `E vlefshme ${n} muaj` : `Valid ${n} months`),
  corpItems: {
    sq: (n: number) => [`${n} publikime të veçuara`, "30 ditë aktiv për çdo publikim", "Faturë dhe kontratë shërbimi", "Profil i verifikuar kompanie", "Mbështetje me email"],
    en: (n: number) => [`${n} Featured postings`, "30 days live per posting", "Invoice and service contract", "Verified company profile", "Email support"],
  },
  requestQuote: { sq: "Kërko ofertë", en: "Request a quote" },
  firstFree: { sq: "Njoftimi juaj i parë standard çdo muaj është falas.", en: "Your first standard listing each month is free." },
};

export default function Pricing() {
  const { user, userRole } = useAuth();
  const { language } = useLanguage();
  const sq = language === "sq";
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"perjob" | "monthly">(params.get("view") === "monthly" ? "monthly" : "perjob");

  const postJobHref = user && userRole === "employer" ? "/dashboard" : "/auth?type=employer";
  const quoteMailto = `mailto:info@jobs.al?subject=${encodeURIComponent("Enterprise plan inquiry / Kërkesë për planin Enterprise")}`;

  return (
    <>
      <Helmet>
        <title>{sq ? "Çmimet për punëdhënës | Jobs.al" : "Employer Pricing | Jobs.al"}</title>
        <meta name="description" content={sq
          ? "Publiko pune në Jobs.al: njoftimi i parë falas çdo muaj, opsione të veçuara dhe paketa mujore për rekrutim në Shqipëri."
          : "Post jobs on Jobs.al: first listing free each month, featured options and monthly recruitment packages in Albania."} />
        <link rel="canonical" href="https://jobs.al/pricing" />
        <meta property="og:title" content={sq ? "Çmimet për punëdhënës | Jobs.al" : "Employer Pricing | Jobs.al"} />
        <meta property="og:description" content={sq ? "Zgjidh planin e duhur për rekrutimin tënd." : "Affordable recruitment solutions for businesses of all sizes."} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{sq ? copy.title.sq : copy.title.en}</h1>
            <p className="text-xl text-muted-foreground mb-3 max-w-2xl mx-auto">{sq ? copy.subtitle.sq : copy.subtitle.en}</p>
            <p className="text-sm text-muted-foreground mb-8">{sq ? copy.firstFree.sq : copy.firstFree.en}</p>

            <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
              <Button variant="ghost"
                onClick={() => setTab("perjob")}
                className={`px-6 py-2 rounded-md transition-colors ${tab === "perjob" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
              >
                {sq ? copy.perJob.sq : copy.perJob.en}
              </Button>
              <Button variant="ghost"
                onClick={() => setTab("monthly")}
                className={`px-6 py-2 rounded-md transition-colors ${tab === "monthly" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
              >
                {sq ? copy.monthly.sq : copy.monthly.en}
              </Button>
            </div>
          </div>

          {tab === "perjob" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
              {LISTING_OPTIONS.map((o) => (
                <Card key={o.key} className={`relative flex flex-col ${o.recommended ? "border-primary shadow-lg" : ""}`}>
                  {o.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-md">
                        <Star className="h-3 w-3 mr-1" />{sq ? copy.recommended.sq : copy.recommended.en}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{o.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">{eur(o.amount_cents)}</span>
                      <p className="text-sm text-muted-foreground mt-1">{approxLek(o.amount_cents)}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-3 text-sm flex-1">
                      <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{sq ? copy.daysLive.sq : copy.daysLive.en}</span></li>
                      {o.featured_days > 0 && (
                        <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{copy.daysFeatured(o.featured_days, sq)}</span></li>
                      )}
                    </ul>
                    <Link to={postJobHref} className="block mt-6">
                      <Button className="w-full" variant={o.recommended ? "default" : "outline"}>
                        {sq ? copy.postJob.sq : copy.postJob.en}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                {MONTHLY_PACKAGES.map((p) => (
                  <Card key={p.key} className={`relative flex flex-col ${p.recommended ? "border-primary shadow-lg" : ""}`}>
                    {p.recommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-md">
                          <Star className="h-3 w-3 mr-1" />{sq ? copy.recommended.sq : copy.recommended.en}
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{p.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-bold">{eur(p.amount_cents)}</span>
                        <span className="text-base font-normal text-muted-foreground">{sq ? copy.perMonth.sq : copy.perMonth.en}</span>
                        <p className="text-sm text-muted-foreground mt-1">{approxLek(p.amount_cents)}{sq ? copy.perMonth.sq : copy.perMonth.en}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      <ul className="space-y-3 text-sm flex-1">
                        <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{copy.activeListings(p.listing_credits, sq)}</span></li>
                        <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{sq ? copy.daysLive.sq : copy.daysLive.en}</span></li>
                        <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{sq ? copy.renews.sq : copy.renews.en}</span></li>
                      </ul>
                      <Link to={user && userRole === "employer" ? `/subscribe/${p.key}` : postJobHref} className="block mt-6">
                        <Button className="w-full" variant={p.recommended ? "default" : "outline"}>
                          {user && userRole === "employer" ? (sq ? copy.subscribe.sq : copy.subscribe.en) : (sq ? copy.getStarted.sq : copy.getStarted.en)}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <section className="pt-10 space-y-6" aria-labelledby="corporate-packages">
                <div className="text-center">
                  <h2 id="corporate-packages" className="text-3xl font-bold">{sq ? copy.corpTitle.sq : copy.corpTitle.en}</h2>
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{sq ? copy.corpSubtitle.sq : copy.corpSubtitle.en}</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {CORPORATE_PACKAGES.map((p) => (
                    <Card key={p.key} className={`relative flex flex-col ${p.bestValue ? "border-primary shadow-lg" : ""}`}>
                      {p.bestValue && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground shadow-md"><Award className="h-3 w-3 mr-1" />{sq ? copy.bestValue.sq : copy.bestValue.en}</Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-2xl">{sq ? p.label.sq : p.label.en}</CardTitle>
                        <div className="mt-2">
                          <span className="text-4xl font-bold">{eur(p.amount_cents)}</span>
                          <p className="text-sm text-muted-foreground mt-1">{approxLek(p.amount_cents)}</p>
                          <p className="text-sm font-medium text-primary mt-1">{copy.value(eur(p.value_cents).replace(".00", ""), p.savePct, sq)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{copy.validMonths(p.duration_months ?? 0, sq)}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        <ul className="space-y-3 text-sm flex-1">
                          {(sq ? copy.corpItems.sq : copy.corpItems.en)(p.listing_credits).map((item) => (
                            <li key={item} className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /><span>{item}</span></li>
                          ))}
                        </ul>
                        <Button className="w-full mt-6" variant={p.bestValue ? "default" : "outline"} asChild>
                          <a href={`mailto:info@jobs.al?subject=${encodeURIComponent(`Corporate package quote: ${p.label.en} (${eur(p.amount_cents)}) / Kërkesë për paketën korporative ${p.label.sq}`)}`}>
                            {sq ? copy.requestQuote.sq : copy.requestQuote.en}
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <Card>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
                  <div>
                    <CardTitle className="text-xl">{sq ? copy.enterpriseTitle.sq : copy.enterpriseTitle.en}</CardTitle>
                    <CardDescription className="mt-1 max-w-xl">{sq ? copy.enterpriseDesc.sq : copy.enterpriseDesc.en}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      {sq ? copy.customQuote.sq : copy.customQuote.en}
                    </p>
                  </div>
                  <Button variant="outline" asChild className="shrink-0">
                    <a href={quoteMailto}>{sq ? copy.requestQuote.sq : copy.requestQuote.en}</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="text-center mt-12 space-y-2">
            <p className="text-sm text-muted-foreground">{sq ? VAT_NOTE.sq : VAT_NOTE.en}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="h-4 w-4" />{sq ? PAYPAL_NOTE.sq : PAYPAL_NOTE.en}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
