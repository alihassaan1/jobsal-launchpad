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

const ResumeBuilderLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      await supabase.from('analytics').insert({
        event_type: 'resume_builder_en_page_view',
        event_data: { page: '/ai-resume-builder', language: 'en' }
      });
    };
    trackPageView();
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "AI-Powered Suggestions",
      description: "Get intelligent recommendations to improve your work experience and professional summary with one click."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Modern, ATS-Friendly Templates",
      description: "Choose from professionally designed templates optimized for Applicant Tracking Systems."
    },
    {
      icon: <Eye className="h-10 w-10 text-primary" />,
      title: "Instant Employer Visibility",
      description: "Your resume becomes discoverable to hiring companies through our integrated ATS platform."
    },
    {
      icon: <Download className="h-10 w-10 text-primary" />,
      title: "One-Click Export",
      description: "Download your professional resume as PDF or Word document instantly."
    }
  ];

  const testimonials = [
    {
      name: "Elira Hoxha",
      role: "Marketing Specialist",
      quote: "The AI suggestions helped me craft a better summary! I built my resume and got interview calls within days.",
      avatar: "EH"
    },
    {
      name: "Denis Kelmendi",
      role: "Software Developer",
      quote: "Jobs.al's resume builder made the process so simple. The templates are modern and professional!",
      avatar: "DK"
    },
    {
      name: "Sara Meta",
      role: "HR Manager",
      quote: "I found my perfect candidate through Jobs.al. The ATS integration makes hiring so much easier.",
      avatar: "SM"
    }
  ];

  const faqs = [
    {
      question: "Is Jobs.al's resume builder free?",
      answer: "Yes! Our basic resume builder is completely free to use. You can create, edit, and download your resume at no cost. Premium templates and advanced AI features are available with our paid plans."
    },
    {
      question: "Can I download my resume as a PDF?",
      answer: "Absolutely! You can download your resume in both PDF and Word (DOC) formats with just one click. The formatting stays professional and ATS-compatible."
    },
    {
      question: "Do employers see my resume?",
      answer: "When you create a resume on Jobs.al, it becomes discoverable by employers using our Applicant Tracking System. You control your privacy settings and can choose which information to share."
    },
    {
      question: "What makes your templates ATS-friendly?",
      answer: "Our templates are specifically designed to be parsed correctly by Applicant Tracking Systems. They use standard formatting, clear section headers, and avoid graphics that might confuse ATS software."
    },
    {
      question: "Can I edit my resume after creating it?",
      answer: "Yes! You can access and edit your resume anytime from your dashboard. All changes are saved automatically, and you can download updated versions whenever needed."
    }
  ];

  const handleCTAClick = (destination: string) => {
    // Track conversion
    supabase.from('analytics').insert({
      event_type: 'resume_builder_en_cta_click',
      event_data: { 
        destination,
        utm_source: 'resume_builder_en',
        language: 'en'
      }
    });
    navigate(destination);
  };

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Free AI Resume Builder — Create Professional CV Online | Jobs.al</title>
        <meta name="description" content="Build your professional resume online for free with Jobs.al's AI-powered CV builder. ATS-friendly templates, instant PDF export & direct employer visibility in Albania." />
        <meta name="keywords" content="resume builder, AI CV maker, free resume builder, online CV builder, professional resume templates, ATS resume, build resume albania, krijo cv" />
        <meta property="og:title" content="Free AI Resume Builder — Create Professional CV Online | Jobs.al" />
        <meta property="og:description" content="Build your professional resume for free with AI. ATS-friendly templates & instant PDF export." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jobs.al/ai-resume-builder" />
        <meta property="og:image" content="https://jobs.al/og-image.jpg" />
        <link rel="alternate" hrefLang="en" href="https://jobs.al/ai-resume-builder" />
        <link rel="alternate" hrefLang="sq" href="https://jobs.al/resume-builder-al" />
        <link rel="canonical" href="https://jobs.al/ai-resume-builder" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Jobs.al AI Resume Builder",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "operatingSystem": "Web",
            "url": "https://jobs.al/ai-resume-builder",
            "description": "Free online AI-powered resume builder for creating professional, ATS-friendly resumes",
            "inLanguage": ["en", "sq"],
            "featureList": "AI-powered suggestions, ATS-friendly templates, PDF export, Employer visibility"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Language Toggle Bar */}
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-end gap-4 text-sm">
              <span className="text-muted-foreground">Language:</span>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
              </div>
              <a 
                href="/resume-builder-al" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-lg">🇦🇱</span>
                <span>Shqip</span>
              </a>
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
              AI-Powered Resume Builder
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Create a Professional Resume in Minutes with AI ✨
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Free online resume builder with modern templates and instant ATS optimization. Stand out and get hired faster on Jobs.al.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => handleCTAClick('/resume-builder')}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 group"
              >
                <FileText className="mr-2 h-5 w-5" />
                Start Building My Resume
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleCTAClick('/resume-templates')}
                className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur text-lg px-8 py-6"
              >
                <Star className="mr-2 h-5 w-5" />
                Explore Templates
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-white">
              <div className="animate-fade-up">
                <div className="text-3xl md:text-4xl font-bold">10,000+</div>
                <div className="text-white/80 text-sm">Resumes Created</div>
              </div>
              <div className="animate-fade-up" style={{animationDelay: '0.1s'}}>
                <div className="text-3xl md:text-4xl font-bold">500+</div>
                <div className="text-white/80 text-sm">Employers</div>
              </div>
              <div className="animate-fade-up" style={{animationDelay: '0.2s'}}>
                <div className="text-3xl md:text-4xl font-bold">50+</div>
                <div className="text-white/80 text-sm">Templates</div>
              </div>
              <div className="animate-fade-up" style={{animationDelay: '0.3s'}}>
                <div className="text-3xl md:text-4xl font-bold">95%</div>
                <div className="text-white/80 text-sm">Success Rate</div>
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
              Why Choose Our Resume Builder?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to create a standout resume that gets noticed by employers
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
                How to Create a Professional Resume Online
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                Creating a professional resume has never been easier with Jobs.al's <strong>online resume builder</strong>. Our platform combines cutting-edge AI technology with modern, ATS-friendly templates to help you craft the perfect CV in minutes. Whether you're a recent graduate or an experienced professional, our <strong>free CV builder</strong> provides all the tools you need to showcase your skills and experience effectively.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                Benefits of Using an AI Resume Builder in Albania
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                The Albanian job market is competitive, and having a professionally crafted resume is essential. Our <strong>AI resume maker</strong> analyzes your work experience and provides intelligent suggestions to improve your content. From optimizing your professional summary to highlighting key achievements, our AI ensures your resume stands out to both recruiters and Applicant Tracking Systems (ATS).
              </p>

              <p className="text-muted-foreground leading-relaxed mb-6">
                What makes Jobs.al unique is the direct connection to employers. When you create a resume on our platform, it automatically becomes discoverable by hundreds of <a href="/jobs" className="text-primary hover:underline">companies actively hiring</a> in Albania. This gives you a significant advantage over traditional resume builders that simply let you download a document.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-foreground">
                Why Jobs.al is the Best Resume Builder for Job Seekers
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                Jobs.al isn't just a resume builder—it's a complete career platform. Our integrated approach means your resume works for you 24/7. Employers using our ATS can discover your profile, match your skills to open positions, and reach out directly. Combined with our extensive <a href="/jobs" className="text-primary hover:underline">job board</a> featuring opportunities from <a href="/companies" className="text-primary hover:underline">top companies in Albania</a>, Jobs.al provides everything you need to accelerate your career.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Start building your professional resume today with Jobs.al's <strong>free online resume builder</strong> and take the first step toward landing your dream job in Albania.
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
                See It In Action
              </h2>
              <p className="text-muted-foreground text-lg">
                Watch how easy it is to create a professional resume
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Choose Your Template</h3>
                    <p className="text-muted-foreground">Select from 50+ professional templates designed by experts</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Fill In Your Details</h3>
                    <p className="text-muted-foreground">Add your experience, education, and skills with AI assistance</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Download & Apply</h3>
                    <p className="text-muted-foreground">Export as PDF/Word and start applying to jobs immediately</p>
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
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of successful job seekers in Albania
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
              Build Your Resume and Get Discovered by Employers
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Thousands of recruiters use Jobs.al's ATS to find candidates daily. Your perfect job is just one resume away.
            </p>
            <Button 
              size="lg"
              onClick={() => handleCTAClick('/resume-builder')}
              className="bg-white text-primary hover:bg-white/90 shadow-2xl text-lg px-10 py-6 group"
            >
              <FileText className="mr-2 h-5 w-5" />
              Start Now – It's Free!
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span>5 Minutes Setup</span>
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
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to know about our resume builder
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

      {/* Related Blog Articles - SEO linking */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Learn More About Resume Writing</h2>
            <p className="text-muted-foreground mb-8">Check out our expert guides on the Jobs.al blog</p>
            <Button variant="outline" onClick={() => navigate('/blog?category=Resume Tips')}>
              View Resume Tips & Guides
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default ResumeBuilderLanding;
