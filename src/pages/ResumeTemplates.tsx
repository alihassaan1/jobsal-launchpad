import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import resumeModern from "@/assets/resume-modern.jpg";
import resumeClassic from "@/assets/resume-classic.jpg";
import resumeCreative from "@/assets/resume-creative.jpg";
import resumeExecutive from "@/assets/resume-executive.jpg";

export default function ResumeTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["resume-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_templates")
        .select("*")
        .eq("is_active", true)
        .order("is_premium", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: userSubscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a resume",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Premium templates are currently free for promotional purposes
    navigate(`/resume-builder?template=${template.id}`);
  };

  // Map template categories to preview images
  const getPreviewImage = (category: string) => {
    const categoryMap: Record<string, string> = {
      professional: resumeModern,
      creative: resumeCreative,
      executive: resumeExecutive,
      tech: resumeModern,
      academic: resumeClassic,
    };
    return categoryMap[category?.toLowerCase()] || resumeModern;
  };

  const categories = Array.from(new Set(templates?.map(t => t.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Professional Resume Templates</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our collection of ATS-friendly templates designed to help you land your dream job
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat || ""}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates?.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.is_premium && (
                          <Crown className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  {template.category && (
                    <Badge variant="secondary" className="w-fit">
                      {template.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-muted rounded overflow-hidden">
                    <img 
                      src={getPreviewImage(template.category)} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Use Template
                    {template.is_premium && (
                      <Badge variant="secondary" className="ml-2">Free Preview</Badge>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {filteredTemplates?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}