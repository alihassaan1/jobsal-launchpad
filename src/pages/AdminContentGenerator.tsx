import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Sparkles, FileText, MapPin, Briefcase, Loader2, Check, AlertCircle, Lightbulb } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";

const CITIES = ['Tirana', 'Durres', 'Vlore', 'Shkoder', 'Elbasan', 'Korce', 'Fier', 'Berat'];
const CATEGORIES = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Sales', 'Engineering', 'Design', 'Hospitality', 'Construction'];

export default function AdminContentGenerator() {
  const queryClient = useQueryClient();
  const [blogTopic, setBlogTopic] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [batchTypes, setBatchTypes] = useState<string[]>(['city_guides', 'career_guides', 'long_tail_blogs']);

  // Fetch content suggestions
  const { data: suggestions, isLoading: loadingSuggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ["content-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { action: 'get_content_suggestions' }
      });
      if (error) throw error;
      return data?.suggestions || [];
    },
    enabled: false
  });

  // Generate single blog post
  const generateBlog = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: {
          action: 'generate_blog',
          topic: blogTopic,
          keywords: blogKeywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Blog post created!",
        description: `"${data.post?.title}" has been saved as a draft.`
      });
      setBlogTopic("");
      setBlogKeywords("");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Generate city guide
  const generateCityGuide = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { action: 'generate_city_guide', city: selectedCity }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "City guide created!",
        description: `Guide for ${selectedCity} has been saved as a draft.`
      });
      setSelectedCity("");
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    }
  });

  // Generate career guide
  const generateCareerGuide = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { action: 'generate_career_guide', category: selectedCategory }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Career guide created!",
        description: `Guide for ${selectedCategory} careers has been saved as a draft.`
      });
      setSelectedCategory("");
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    }
  });

  // Batch generate content
  const batchGenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { action: 'batch_generate', types: batchTypes }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Batch generation complete!",
        description: `Created ${data.generated?.length || 0} items. ${data.errors?.length || 0} errors.`
      });
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (error: any) => {
      toast({ title: "Batch generation failed", description: error.message, variant: "destructive" });
    }
  });

  const handleBatchTypeToggle = (type: string) => {
    setBatchTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SEO Content Generator</h1>
          <p className="text-muted-foreground">AI-powered content creation for SEO optimization</p>
        </div>

        <Tabs defaultValue="blog" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="blog">
              <FileText className="h-4 w-4 mr-2" />
              Blog Posts
            </TabsTrigger>
            <TabsTrigger value="city">
              <MapPin className="h-4 w-4 mr-2" />
              City Guides
            </TabsTrigger>
            <TabsTrigger value="career">
              <Briefcase className="h-4 w-4 mr-2" />
              Career Guides
            </TabsTrigger>
            <TabsTrigger value="batch">
              <Sparkles className="h-4 w-4 mr-2" />
              Batch Generate
            </TabsTrigger>
          </TabsList>

          {/* Blog Posts Tab */}
          <TabsContent value="blog" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Blog Post</CardTitle>
                  <CardDescription>Create SEO-optimized blog content with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Topic / Title</Label>
                    <Input
                      placeholder="e.g., How to Write a CV in Albania"
                      value={blogTopic}
                      onChange={(e) => setBlogTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Keywords (comma-separated)</Label>
                    <Input
                      placeholder="e.g., cv albania, resume tips, job application"
                      value={blogKeywords}
                      onChange={(e) => setBlogKeywords(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => generateBlog.mutate()}
                    disabled={!blogTopic || generateBlog.isPending}
                    className="w-full"
                  >
                    {generateBlog.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Generate Blog Post</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Content Suggestions
                  </CardTitle>
                  <CardDescription>Get AI-recommended blog topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    onClick={() => refetchSuggestions()}
                    disabled={loadingSuggestions}
                    className="w-full mb-4"
                  >
                    {loadingSuggestions ? "Loading..." : "Get Suggestions"}
                  </Button>
                  
                  {suggestions && suggestions.length > 0 && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {suggestions.map((s: any, i: number) => (
                        <div 
                          key={i} 
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setBlogTopic(s.topic);
                            setBlogKeywords(s.keywords?.join(', ') || '');
                          }}
                        >
                          <p className="font-medium text-sm">{s.topic}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.keywords?.slice(0, 3).map((kw: string, j: number) => (
                              <Badge key={j} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>Priority: {s.priority}/10</span>
                            <span>•</span>
                            <span>Volume: {s.estimated_search_volume}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* City Guides Tab */}
          <TabsContent value="city">
            <Card>
              <CardHeader>
                <CardTitle>Generate City Guide</CardTitle>
                <CardDescription>Create "Working in [City]" guides for Albanian cities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => generateCityGuide.mutate()}
                  disabled={!selectedCity || generateCityGuide.isPending}
                >
                  {generateCityGuide.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><MapPin className="mr-2 h-4 w-4" /> Generate City Guide</>
                  )}
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                  {CITIES.map(city => (
                    <Badge 
                      key={city} 
                      variant="outline" 
                      className="justify-center py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSelectedCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Guides Tab */}
          <TabsContent value="career">
            <Card>
              <CardHeader>
                <CardTitle>Generate Career Guide</CardTitle>
                <CardDescription>Create industry-specific career guides for Albania</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Industry</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => generateCareerGuide.mutate()}
                  disabled={!selectedCategory || generateCareerGuide.isPending}
                >
                  {generateCareerGuide.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Briefcase className="mr-2 h-4 w-4" /> Generate Career Guide</>
                  )}
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
                  {CATEGORIES.map(cat => (
                    <Badge 
                      key={cat} 
                      variant="outline" 
                      className="justify-center py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Generate Tab */}
          <TabsContent value="batch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Batch Content Generation
                </CardTitle>
                <CardDescription>
                  Generate multiple content pieces at once. This will create sample content for each selected type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Content Types to Generate</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="city_guides" 
                        checked={batchTypes.includes('city_guides')}
                        onCheckedChange={() => handleBatchTypeToggle('city_guides')}
                      />
                      <label htmlFor="city_guides" className="text-sm font-medium leading-none">
                        City Guides (Tirana, Durres, Vlore)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="career_guides" 
                        checked={batchTypes.includes('career_guides')}
                        onCheckedChange={() => handleBatchTypeToggle('career_guides')}
                      />
                      <label htmlFor="career_guides" className="text-sm font-medium leading-none">
                        Career Guides (Technology, Marketing, Finance)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="long_tail_blogs" 
                        checked={batchTypes.includes('long_tail_blogs')}
                        onCheckedChange={() => handleBatchTypeToggle('long_tail_blogs')}
                      />
                      <label htmlFor="long_tail_blogs" className="text-sm font-medium leading-none">
                        Long-tail Keyword Blog Posts (3 posts)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Note:</p>
                      <p className="text-muted-foreground">
                        Batch generation may take several minutes. Content will be saved as drafts for review before publishing.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => batchGenerate.mutate()}
                  disabled={batchTypes.length === 0 || batchGenerate.isPending}
                  size="lg"
                  className="w-full"
                >
                  {batchGenerate.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Content (this may take a few minutes)...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Start Batch Generation</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
}
