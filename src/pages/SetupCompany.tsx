import { R2ImageUpload } from "@/components/R2ImageUpload";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet";

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Retail & E-commerce",
  "Manufacturing",
  "Construction",
  "Tourism & Hospitality",
  "Telecommunications",
  "Real Estate",
  "Marketing & Advertising",
  "Legal",
  "Consulting",
  "Energy",
  "Transportation & Logistics",
  "Other"
];

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees"
];

export default function SetupCompany() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    company_size: "",
    location: "",
    website: "",
    email: "",
    phone: "",
    logo_url: ""
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/auth?type=employer" replace />;
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsLoading(true);

    try {
      if (userRole !== 'employer' && userRole !== 'admin') {
        const { error: roleError } = await supabase.rpc('become_employer' as any);
        if (roleError) throw roleError;
      }

      const slug = generateSlug(formData.name);

      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const companyPayload = {
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        company_size: formData.company_size,
        location: formData.location,
        website: formData.website,
        email: formData.email || user.email,
        phone: formData.phone,
        logo_url: formData.logo_url,
        owner_id: user.id
      };

      if (existingCompany?.id) {
        const { error } = await supabase
          .from("companies")
          .update(companyPayload)
          .eq("id", existingCompany.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("companies")
          .insert({
            ...companyPayload,
            slug,
          });

        if (error) throw error;
      }

      toast.success("Company profile created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Failed to create company profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Set Up Your Company Profile | Jobs.al</title>
        <meta name="description" content="Create your company profile on Jobs.al and start posting jobs to reach Albania's top talent." />
      </Helmet>

      <Navigation />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span className="hidden sm:inline text-sm font-medium">Basic Info</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
              <span className="hidden sm:inline text-sm font-medium">Details</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="hidden sm:inline text-sm font-medium">Contact</span>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set Up Your Company Profile</CardTitle>
              <CardDescription>
                Create your company profile to start posting jobs and attract top talent
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your company name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tell job seekers about your company, culture, and what makes you unique..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo_url">Logo URL (optional)</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                      <div className="mt-2">
                        <R2ImageUpload folder="logos" label="Upload logo" onUploaded={(url) => setFormData((f) => ({ ...f, logo_url: url }))} />
                      </div>

                      {formData.logo_url && (
                        <div className="mt-2 w-16 h-16 border rounded-lg overflow-hidden">
                          <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <Button 
                      type="button" 
                      className="w-full" 
                      onClick={() => setStep(2)}
                      disabled={!formData.name.trim()}
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select value={formData.company_size} onValueChange={(value) => setFormData({ ...formData, company_size: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Tirana, Albania"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Back
                      </Button>
                      <Button type="button" onClick={() => setStep(3)} className="flex-1">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Contact */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={user.email || "contact@yourcompany.com"}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+355 XX XXX XXXX"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create Company
                            <CheckCircle className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Benefits section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Company Profile</h3>
              <p className="text-sm text-muted-foreground">Showcase your brand to candidates</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Post Jobs</h3>
              <p className="text-sm text-muted-foreground">Reach thousands of qualified candidates</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Track Applications</h3>
              <p className="text-sm text-muted-foreground">Manage candidates with our ATS</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
