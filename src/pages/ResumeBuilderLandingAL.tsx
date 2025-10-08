import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Sparkles, 
  Download, 
  Eye, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Users,
  Zap,
  Shield,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet";

const ResumeBuilderLandingAL = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      await supabase.from('analytics').insert({
        event_type: 'resume_builder_al_page_view',
        event_data: { page: '/resume-builder-al', language: 'sq' }
      });
    };
    trackPageView();
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "Sugjerime të fuqizuara nga AI",
      description: "Merr rekomandime inteligjente për të përmirësuar përvojën tuaj të punës dhe përmbledhjen profesionale me një klikim."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Modele moderne dhe profesionale",
      description: "Zgjidh nga modele të dizajnuara nga ekspertë dhe të optimizuara për sistemet e gjurmimit të aplikimeve (ATS)."
    },
    {
      icon: <Eye className="h-10 w-10 text-primary" />,
      title: "Dukshmëri e menjëhershme nga punëdhënësit",
      description: "CV-ja juaj bëhet e zbulueshme nga kompanitë që marrin në punë përmes platformës sonë të integruar ATS."
    },
    {
      icon: <Download className="h-10 w-10 text-primary" />,
      title: "Eksport me një klikim",
      description: "Shkarko CV-në tënde profesionale si PDF ose Word menjëherë."
    }
  ];

  const testimonials = [
    {
      name: "Elira Hoxha",
      role: "Specialiste Marketingu",
      quote: "Sugjerimet e AI më ndihmuan të krijoj një përmbledhje më të mirë! Ndërtova CV-në dhe mora ftesa për intervista brenda ditësh.",
      avatar: "EH"
    },
    {
      name: "Denis Kelmendi",
      role: "Zhvillues Softueresh",
      quote: "Ndërtimi i CV-së në Jobs.al e bëri procesin aq të thjeshtë. Modelet janë moderne dhe profesionale!",
      avatar: "DK"
    },
    {
      name: "Sara Meta",
      role: "Menaxhere HR",
      quote: "Gjeta kandidatin e përsosur përmes Jobs.al. Integrimi me ATS e bën punësimin shumë më të lehtë.",
      avatar: "SM"
    }
  ];

  const faqs = [
    {
      question: "A është falas ndërtimi i CV-së në Jobs.al?",
      answer: "Po! Ndërtuesi ynë bazë i CV-ve është plotësisht falas për t'u përdorur. Mund të krijoni, editoni dhe shkarkoni CV-në tuaj pa kosto. Modelet premium dhe veçoritë e avancuara të AI janë të disponueshme me planet tona me pagesë."
    },
    {
      question: "A mund ta shkarkoj CV-në time si PDF?",
      answer: "Absolutisht! Mund ta shkarkoni CV-në tuaj si në format PDF ashtu edhe në Word (DOC) me vetëm një klikim. Formatimi mbetet profesional dhe i përputhshëm me ATS."
    },
    {
      question: "A e shohin punëdhënësit CV-në time?",
      answer: "Kur krijoni një CV në Jobs.al, ajo bëhet e zbulueshme nga punëdhënësit që përdorin sistemin tonë të gjurmimit të aplikimeve. Ju kontrolloni cilësimet e privatësisë dhe mund të zgjidhni se cilat informacione të ndani."
    },
    {
      question: "Çfarë i bën modelet tuaja të përputhshme me ATS?",
      answer: "Modelet tona janë dizajnuar specifikisht për t'u analizuar saktë nga sistemet e gjurmimit të aplikimeve. Ato përdorin formatim standard, tituj të qartë seksionesh dhe shmangen grafikët që mund të ngatërrojnë softuerin ATS."
    },
    {
      question: "A mund ta editoj CV-në time pas krijimit?",
      answer: "Po! Mund të hyni dhe të editoni CV-në tuaj në çdo kohë nga paneli juaj. Të gjitha ndryshimet ruhen automatikisht dhe mund të shkarkoni versione të përditësuara sa herë që keni nevojë."
    }
  ];

  const handleCTAClick = (destination: string) => {
    // Track conversion
    supabase.from('analytics').insert({
      event_type: 'resume_builder_al_cta_click',
      event_data: { 
        destination,
        utm_source: 'resume_builder_al',
        language: 'sq'
      }
    });
    navigate(destination);
  };

  return (
    <>
      <Helmet>
        <html lang="sq" />
        <title>Ndërtues CV Online në Shqip – Krijo CV Profesionale Falas | Jobs.al</title>
        <meta name="description" content="Krijo një CV profesionale falas me ndërtuesin inteligjent të CV-ve nga Jobs.al. Modele moderne, sugjerime automatike dhe eksport i lehtë në PDF." />
        <meta name="keywords" content="krijo CV online, model CV, CV profesionale, ndërtues CV falas, shkarko CV PDF, CV Shqipëri, punë Shqipëri" />
        <meta property="og:title" content="Ndërtues CV Online në Shqip – Krijo CV Profesionale Falas | Jobs.al" />
        <meta property="og:description" content="Krijo një CV profesionale falas me ndërtuesin inteligjent të CV-ve nga Jobs.al. Modele moderne, sugjerime automatike dhe eksport i lehtë në PDF." />
        <meta property="og:type" content="website" />
        <link rel="alternate" hrefLang="en" href="/ai-resume-builder" />
        <link rel="alternate" hrefLang="sq" href="/resume-builder-al" />
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Jobs.al Ndërtues CV",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "operatingSystem": "Web",
            "description": "Ndërtues CV online falas me AI për të krijuar CV profesionale në shqip",
            "inLanguage": "sq",
            "featureList": "AI-powered suggestions, ATS-friendly templates, PDF export, Employer visibility"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Language Toggle Bar */}
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-end gap-4 text-sm">
              <span className="text-muted-foreground">Gjuha:</span>
              <a 
                href="/ai-resume-builder" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
              </a>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="text-lg">🇦🇱</span>
                <span>Shqip</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-hero overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
            }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Ndërtues CV me AI
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Krijo CV-në të përsosur online në pak minuta! ✨
              </h1>
              
              <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                Përdor ndërtuesin tonë inteligjent të CV-ve për të krijuar një CV profesionale që të ndihmon të dallohet në tregun e punës në Shqipëri dhe jashtë saj.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => handleCTAClick('/resume-builder')}
                  className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 group"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Fillo tani falas
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => handleCTAClick('/resume-templates')}
                  className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur text-lg px-8 py-6"
                >
                  <Star className="mr-2 h-5 w-5" />
                  Shiko modelet
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-white">
                <div className="animate-fade-up">
                  <div className="text-3xl md:text-4xl font-bold">10,000+</div>
                  <div className="text-white/80 text-sm">CV të krijuara</div>
                </div>
                <div className="animate-fade-up" style={{animationDelay: '0.1s'}}>
                  <div className="text-3xl md:text-4xl font-bold">500+</div>
                  <div className="text-white/80 text-sm">Punëdhënës</div>
                </div>
                <div className="animate-fade-up" style={{animationDelay: '0.2s'}}>
                  <div className="text-3xl md:text-4xl font-bold">50+</div>
                  <div className="text-white/80 text-sm">Modele</div>
                </div>
                <div className="animate-fade-up" style={{animationDelay: '0.3s'}}>
                  <div className="text-3xl md:text-4xl font-bold">95%</div>
                  <div className="text-white/80 text-sm">Sukses</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Pse të zgjedhësh ndërtuesin tonë të CV-ve?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Gjithçka që të nevojitet për të krijuar një CV që tërheq vëmendjen e punëdhënësve
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card animate-fade-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <article className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Si të krijosh një CV profesionale online
                </h2>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Krijimi i një CV profesionale nuk ka qenë kurrë më i lehtë me <strong>ndërtuesin e CV-ve online</strong> të Jobs.al. Platforma jonë kombinon teknologjinë më të fundit të AI me modele moderne dhe profesionale për t'ju ndihmuar të krijoni CV-në e përsosur në pak minuta. Qoftë student i sapodiplomuar apo profesionist me përvojë, <strong>ndërtuesi ynë falas i CV-ve</strong> ofron të gjitha mjetet që ju nevojiten për të treguar në mënyrë efektive aftësitë dhe përvojën tuaj.
                </p>

                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  Përfitimet e përdorimit të një ndërtuesi CV me AI në Shqipëri
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Tregu i punës në Shqipëri është konkurrues dhe të kesh një CV të hartuar profesionalisht është thelbësore. <strong>Ndërtuesi ynë i CV-ve me AI</strong> analizon përvojën tuaj të punës dhe ofron sugjerime inteligjente për të përmirësuar përmbajtjen. Nga optimizimi i përmbledhjes tuaj profesionale deri tek theksimi i arritjeve kryesore, AI jonë siguron që CV-ja juaj të dallohet si para rekrutuesve ashtu edhe para sistemeve të gjurmimit të aplikimeve (ATS).
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  Ajo që e bën Jobs.al unike është lidhja e drejtpërdrejtë me punëdhënësit. Kur krijoni një CV në platformën tonë, ajo bëhet automatikisht e zbulueshme nga qindra <a href="/jobs" className="text-primary hover:underline">kompani që marrin në punë aktivisht</a> në Shqipëri. Kjo ju jep një avantazh të konsiderueshëm mbi ndërtuesit tradicionalë të CV-ve që thjesht ju lejojnë të shkarkoni një dokument.
                </p>

                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  Pse Jobs.al është ndërtuesi më i mirë i CV-ve për kërkuesit e punës
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Jobs.al nuk është vetëm një ndërtues CV-sh—është një platformë e plotë karriere. Qasja jonë e integruar do të thotë që CV-ja juaj punon për ju 24/7. Punëdhënësit që përdorin ATS tonë mund të zbulojnë profilin tuaj, të përputhin aftësitë tuaja me pozicionet e hapura dhe t'ju kontaktojnë drejtpërdrejt. E kombinuar me <a href="/jobs" className="text-primary hover:underline">tabelën tonë të gjerë të vendeve të punës</a> që ofron mundësi nga <a href="/companies" className="text-primary hover:underline">kompanitë kryesore në Shqipëri</a>, Jobs.al ofron gjithçka që ju nevojitet për të përshpejtuar karrierën tuaj.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Filloni të ndërtoni CV-në tuaj profesionale sot me <strong>ndërtuesin falas online të CV-ve</strong> të Jobs.al dhe bëni hapin e parë drejt punës së ëndrrave tuaja në Shqipëri.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Interactive Preview Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Shiko si funksionon
                </h2>
                <p className="text-muted-foreground text-lg">
                  Shiko sa e lehtë është të krijosh një CV profesionale
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">Zgjidh modelin tënd</h3>
                      <p className="text-muted-foreground">Zgjidh nga mbi 50 modele profesionale të dizajnuara nga ekspertë</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">Plotëso detajet</h3>
                      <p className="text-muted-foreground">Shto përvojën, arsimin dhe aftësitë me ndihmën e AI</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">Shkarko dhe apliko</h3>
                      <p className="text-muted-foreground">Eksporto si PDF/Word dhe fillo të aplikosh për punë menjëherë</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-2xl border border-primary/20 shadow-2xl">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <div className="space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted/70 rounded w-full"></div>
                        <div className="h-3 bg-muted/70 rounded w-5/6"></div>
                        <div className="pt-4 space-y-2">
                          <div className="h-3 bg-primary/20 rounded w-2/3"></div>
                          <div className="h-3 bg-primary/20 rounded w-3/4"></div>
                          <div className="h-3 bg-primary/20 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-4 -right-4 bg-primary text-white p-3 rounded-full shadow-lg animate-pulse">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Çfarë thonë përdoruesit tanë
              </h2>
              <p className="text-muted-foreground text-lg">
                Bashkohu me mijëra kërkues pune të suksesshëm në Shqipëri
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">{testimonial.avatar}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 md:py-20 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <Users className="h-16 w-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Krijo CV-në tënde dhe zbulohu nga punëdhënësit
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Mijëra rekrutues përdorin ATS-në e Jobs.al për të gjetur kandidatë çdo ditë. Puna juaj e përsosur është vetëm një CV larg.
              </p>
              <Button 
                size="lg"
                onClick={() => handleCTAClick('/resume-builder')}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl text-lg px-10 py-6 group"
              >
                <FileText className="mr-2 h-5 w-5" />
                Fillo tani – është falas!
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="mt-8 flex items-center justify-center gap-8 text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>100% Falas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Pa kartë krediti</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>5 minuta instalim</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Pyetje të shpeshta
                </h2>
                <p className="text-muted-foreground text-lg">
                  Gjithçka që duhet të dini për ndërtuesin tonë të CV-ve
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6 bg-card shadow-sm">
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ResumeBuilderLandingAL;
