import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Upload, Eye, Users, CheckCircle, Star, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const EmployerCompanyProfile = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  if (userRole !== "employer" && userRole !== "admin") {
    navigate("/");
    return null;
  }

  const { data: company, isLoading } = useQuery({
    queryKey: ["employerCompany", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    banner_url: "",
    location: "",
    industry: "",
    company_size: "",
    website: "",
    email: "",
    phone: "",
    founded_year: "",
    social_links: {
      linkedin: "",
      facebook: "",
      instagram: "",
      website: "",
    },
  });

  // Populate form when company data loads
  useState(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        description: company.description || "",
        logo_url: company.logo_url || "",
        banner_url: company.banner_url || "",
        location: company.location || "",
        industry: company.industry || "",
        company_size: company.company_size || "",
        website: company.website || "",
        email: company.email || "",
        phone: company.phone || "",
        founded_year: company.founded_year?.toString() || "",
        social_links: (company.social_links as any) || {
          linkedin: "",
          facebook: "",
          instagram: "",
          website: "",
        },
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("companies")
        .update({
          ...data,
          founded_year: data.founded_year ? parseInt(data.founded_year) : null,
        })
        .eq("id", company!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employerCompany"] });
      toast({ title: "Company profile updated successfully" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const getSponsorshipBadge = (plan: string) => {
    const badges = {
      platinum: <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Star className="w-3 h-3 mr-1" />Platinum</Badge>,
      gold: <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500"><Star className="w-3 h-3 mr-1" />Gold</Badge>,
      silver: <Badge className="bg-gradient-to-r from-gray-300 to-gray-500"><Star className="w-3 h-3 mr-1" />Silver</Badge>,
    };
    return badges[plan as keyof typeof badges] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Company profile not found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Jobs.al</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/employer/analytics">
              <Button variant="ghost">Analytics</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
              <p className="text-muted-foreground">
                Manage your company's public profile and visibility
              </p>
            </div>
            <div className="flex gap-2">
              {company.slug && (
                <Button variant="outline" asChild>
                  <Link to={`/companies/${company.slug}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Link>
                </Button>
              )}
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Profile Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{company.views_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Followers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{company.followers_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {company.is_verified ? <CheckCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-muted-foreground" />}
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {company.is_verified ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm">Request Verification</Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Sponsorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {company.sponsorship_plan !== 'none' ? (
                    getSponsorshipBadge(company.sponsorship_plan)
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Public information about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell job seekers about your company..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Technology, Finance"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_size">Company Size</Label>
                    <Input
                      id="company_size"
                      value={formData.company_size}
                      onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. 50-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Tirana, Albania"
                    />
                  </div>

                  <div>
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input
                      id="founded_year"
                      type="number"
                      value={formData.founded_year}
                      onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. 2020"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Logo and banner images for your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logo_url && (
                    <div className="mt-2 w-20 h-20 border rounded overflow-hidden">
                      <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="banner_url">Banner URL</Label>
                  <Input
                    id="banner_url"
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://example.com/banner.png"
                  />
                  {formData.banner_url && (
                    <div className="mt-2 w-full h-32 border rounded overflow-hidden">
                      <img src={formData.banner_url} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How job seekers can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+355 XX XXX XXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Connect your social profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.social_links.linkedin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, linkedin: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>

                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.social_links.facebook}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, facebook: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.social_links.instagram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        social_links: { ...formData.social_links, instagram: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original data
                    if (company) {
                      setFormData({
                        name: company.name || "",
                        description: company.description || "",
                        logo_url: company.logo_url || "",
                        banner_url: company.banner_url || "",
                        location: company.location || "",
                        industry: company.industry || "",
                        company_size: company.company_size || "",
                        website: company.website || "",
                        email: company.email || "",
                        phone: company.phone || "",
                        founded_year: company.founded_year?.toString() || "",
                        social_links: (company.social_links as any) || {
                          linkedin: "",
                          facebook: "",
                          instagram: "",
                          website: "",
                        },
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployerCompanyProfile;