import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wand2, Briefcase, Building2, Megaphone, Share2, Mail, Copy, Check } from "lucide-react";

interface GeneratedContent {
  type: string;
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const AdminAIAgent = () => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  // Job Description State
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("Tirana");
  const [jobType, setJobType] = useState("full_time");
  const [jobExperience, setJobExperience] = useState("mid");
  const [jobSkills, setJobSkills] = useState("");

  // Company Profile State
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyValues, setCompanyValues] = useState("");

  // Marketing Content State
  const [marketingPurpose, setMarketingPurpose] = useState("");
  const [marketingAudience, setMarketingAudience] = useState("job_seekers");
  const [marketingMessage, setMarketingMessage] = useState("");
  const [marketingCta, setMarketingCta] = useState("");

  // Social Post State
  const [socialPlatform, setSocialPlatform] = useState("linkedin");
  const [socialTopic, setSocialTopic] = useState("");
  const [socialMessage, setSocialMessage] = useState("");

  // Email Template State
  const [emailPurpose, setEmailPurpose] = useState("");
  const [emailTarget, setEmailTarget] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailCta, setEmailCta] = useState("");

  const generateMutation = useMutation({
    mutationFn: async ({ type, context }: { type: string; context: Record<string, any> }) => {
      const { data, error } = await supabase.functions.invoke('deepseek-agent', {
        body: { type, context }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast.success(`${data.type.replace('_', ' ')} generated successfully!`);
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
    }
  });

  const handleCopy = async () => {
    if (generatedContent?.content) {
      await navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      toast.success("Content copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateJobDescription = () => {
    generateMutation.mutate({
      type: 'job_description',
      context: {
        title: jobTitle,
        company: jobCompany,
        location: jobLocation,
        jobType,
        experienceLevel: jobExperience,
        skills: jobSkills.split(',').map(s => s.trim()).filter(Boolean),
      }
    });
  };

  const generateCompanyProfile = () => {
    generateMutation.mutate({
      type: 'company_profile',
      context: {
        companyName,
        industry: companyIndustry,
        size: companySize,
        values: companyValues.split(',').map(s => s.trim()).filter(Boolean),
      }
    });
  };

  const generateMarketingContent = () => {
    generateMutation.mutate({
      type: 'marketing_content',
      context: {
        purpose: marketingPurpose,
        audience: marketingAudience,
        message: marketingMessage,
        cta: marketingCta,
      }
    });
  };

  const generateSocialPost = () => {
    generateMutation.mutate({
      type: 'social_post',
      context: {
        platform: socialPlatform,
        topic: socialTopic,
        message: socialMessage,
      }
    });
  };

  const generateEmailTemplate = () => {
    generateMutation.mutate({
      type: 'email_template',
      context: {
        purpose: emailPurpose,
        target: emailTarget,
        message: emailMessage,
        cta: emailCta,
      }
    });
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Content Agent</h1>
          <p className="text-muted-foreground mt-1">
            Generate professional content using DeepSeek AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Content Generator
              </CardTitle>
              <CardDescription>
                Select content type and provide details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="job_description" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="job_description" className="text-xs">
                    <Briefcase className="h-4 w-4 mr-1" />
                    Jobs
                  </TabsTrigger>
                  <TabsTrigger value="company_profile" className="text-xs">
                    <Building2 className="h-4 w-4 mr-1" />
                    Company
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="text-xs">
                    <Megaphone className="h-4 w-4 mr-1" />
                    Marketing
                  </TabsTrigger>
                  <TabsTrigger value="social" className="text-xs">
                    <Share2 className="h-4 w-4 mr-1" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="email" className="text-xs">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="job_description" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input 
                        placeholder="e.g., Software Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input 
                        placeholder="e.g., Tech Albania"
                        value={jobCompany}
                        onChange={(e) => setJobCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g., Tirana"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <Select value={jobType} onValueChange={setJobType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full-time</SelectItem>
                          <SelectItem value="part_time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <Select value={jobExperience} onValueChange={setJobExperience}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Required Skills (comma-separated)</Label>
                    <Textarea 
                      placeholder="React, TypeScript, Node.js, PostgreSQL"
                      value={jobSkills}
                      onChange={(e) => setJobSkills(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateJobDescription} 
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Job Description</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="company_profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input 
                        placeholder="e.g., Tech Albania"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input 
                        placeholder="e.g., Technology"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Size</Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Values (comma-separated)</Label>
                    <Textarea 
                      placeholder="Innovation, Integrity, Excellence, Teamwork"
                      value={companyValues}
                      onChange={(e) => setCompanyValues(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateCompanyProfile} 
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Company Profile</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Input 
                      placeholder="e.g., Promote new features"
                      value={marketingPurpose}
                      onChange={(e) => setMarketingPurpose(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={marketingAudience} onValueChange={setMarketingAudience}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job_seekers">Job Seekers</SelectItem>
                        <SelectItem value="employers">Employers</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Message</Label>
                    <Textarea 
                      placeholder="Main message to convey..."
                      value={marketingMessage}
                      onChange={(e) => setMarketingMessage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Call to Action</Label>
                    <Input 
                      placeholder="e.g., Sign up today"
                      value={marketingCta}
                      onChange={(e) => setMarketingCta(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateMarketingContent} 
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Marketing Content</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="all">All Platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input 
                      placeholder="e.g., Albanian job market trends"
                      value={socialTopic}
                      onChange={(e) => setSocialTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Key Message</Label>
                    <Textarea 
                      placeholder="Main point to share..."
                      value={socialMessage}
                      onChange={(e) => setSocialMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateSocialPost} 
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Social Post</>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purpose</Label>
                      <Input 
                        placeholder="e.g., Weekly newsletter"
                        value={emailPurpose}
                        onChange={(e) => setEmailPurpose(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Input 
                        placeholder="e.g., Active job seekers"
                        value={emailTarget}
                        onChange={(e) => setEmailTarget(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Message</Label>
                    <Textarea 
                      placeholder="Main content of the email..."
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Call to Action</Label>
                    <Input 
                      placeholder="e.g., View Latest Jobs"
                      value={emailCta}
                      onChange={(e) => setEmailCta(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={generateEmailTemplate} 
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-4 w-4 mr-2" /> Generate Email Template</>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    AI-generated content will appear here
                  </CardDescription>
                </div>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {generatedContent.usage?.total_tokens || 0} tokens
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <><Check className="h-4 w-4 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generateMutation.isPending ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Generating content with DeepSeek AI...</p>
                  </div>
                </div>
              ) : generatedContent ? (
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                  />
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a content type and fill in the details</p>
                    <p className="text-sm">Generated content will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminAIAgent;
