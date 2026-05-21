import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Download, Save, LogOut, User, Palette } from "lucide-react";
import html2pdf from "html2pdf.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TemplateSelector from "@/components/TemplateSelector";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import ClassicTemplate from "@/components/resume-templates/ClassicTemplate";
import CreativeTemplate from "@/components/resume-templates/CreativeTemplate";
import ExecutiveTemplate from "@/components/resume-templates/ExecutiveTemplate";
import Navigation from "@/components/Navigation";

interface ResumeData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    gpa: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: string[];
}

export default function ResumeBuilder() {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const resumeId = searchParams.get("id");
  const queryClient = useQueryClient();

  const [resumeData, setResumeData] = useState<ResumeData>({
    personal_info: {
      full_name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  const { data: template } = useQuery({
    queryKey: ["resume-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from("resume_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  // Load existing resume if editing
  const { data: existingResume, isLoading: resumeLoading } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      if (!resumeId || !user) return null;
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!resumeId && !!user,
  });

  // Load resume data when existingResume is fetched
  useEffect(() => {
    if (existingResume?.data) {
      setResumeData(existingResume.data as unknown as ResumeData);
      if (existingResume.template_id) {
        // best-effort: template name is resolved separately via templates table
      }
    }
  }, [existingResume]);

  // Auto-trigger PDF export when arriving with ?export=1 (e.g. Download from MyResumes)
  const shouldAutoExport = searchParams.get("export") === "1";
  useEffect(() => {
    if (!shouldAutoExport || resumeLoading || !existingResume) return;
    const t = setTimeout(() => {
      exportToPDF();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoExport, resumeLoading, existingResume]);

  const saveResumeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!resumeData.personal_info.full_name.trim()) {
        throw new Error("Please enter your full name before saving");
      }

      if (resumeId) {
        // Update existing resume
        const { data, error } = await supabase
          .from("resumes")
          .update({
            title: `${resumeData.personal_info.full_name || "My"} Resume`,
            data: resumeData as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resumeId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Check if a resume with same title already exists in last 5 minutes (likely duplicate click)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existingResumes } = await supabase
          .from("resumes")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", `${resumeData.personal_info.full_name || "My"} Resume`)
          .gte("created_at", fiveMinutesAgo)
          .eq("is_active", true)
          .limit(1);

        if (existingResumes && existingResumes.length > 0) {
          // Update the existing one instead of creating duplicate
          const { data, error } = await supabase
            .from("resumes")
            .update({
              data: resumeData as any,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingResumes[0].id)
            .select()
            .single();

          if (error) throw error;
          return data;
        }

        // Insert new resume
        const { data, error } = await supabase
          .from("resumes")
          .insert([{
            user_id: user.id,
            template_id: templateId || null,
            title: `${resumeData.personal_info.full_name || "My"} Resume`,
            data: resumeData as any,
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast({
        title: resumeId ? "Resume updated" : "Resume saved",
        description: resumeId ? "Your resume has been updated successfully" : "Your resume has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["user-resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
      
      // If creating new resume, redirect to edit mode
      if (!resumeId && data) {
        navigate(`/resume-builder?id=${data.id}`, { replace: true });
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving resume",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const enhanceWithAI = async (text: string, type: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-resume", {
        body: { text, type },
      });

      if (error) throw error;
      
      toast({
        title: "AI Enhancement Complete",
        description: "Content has been enhanced with AI suggestions",
      });

      return data.enhancedText;
    } catch (error: any) {
      toast({
        title: "AI Enhancement Failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
        achievements: [],
      }],
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: "",
        degree: "",
        field: "",
        start_date: "",
        end_date: "",
        gpa: "",
      }],
    }));
  };

  const exportToPDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) {
      toast({
        title: "Error",
        description: "Resume preview not found",
        variant: "destructive",
      });
      return;
    }

    // Create a wrapper to ensure proper sizing
    const wrapper = document.createElement('div');
    wrapper.style.width = '210mm';
    wrapper.style.minHeight = '297mm';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.style.position = 'relative';
    wrapper.appendChild(element.cloneNode(true));

    const opt = {
      margin: 0,
      filename: `${resumeData.personal_info.full_name || 'Resume'}.pdf`,
      image: { type: 'jpeg' as const, quality: 1.0 },
      html2canvas: { 
        scale: 3,
        useCORS: true,
        letterRendering: true,
        logging: false,
        dpi: 300,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        allowTaint: false,
        removeContainer: true,
        imageTimeout: 0,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById('resume-preview');
          if (clonedElement) {
            // Force exact dimensions
            clonedElement.style.width = '210mm';
            clonedElement.style.minHeight = '297mm';
            clonedElement.style.maxWidth = '210mm';
            clonedElement.style.margin = '0 auto';
            clonedElement.style.display = 'block';
            clonedElement.style.boxSizing = 'border-box';
          }
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        compress: false,
        precision: 16
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    toast({
      title: "Generating PDF",
      description: "Please wait while we create your high-quality resume...",
    });

    html2pdf().set(opt).from(element).save().then(() => {
      toast({
        title: "PDF Export Complete",
        description: "Your resume has been downloaded successfully",
      });
    }).catch((error) => {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    });
  };

  const renderTemplate = () => {
    const templateProps = { data: resumeData };
    
    switch (selectedTemplate) {
      case "modern":
        return <ModernTemplate {...templateProps} />;
      case "classic":
        return <ClassicTemplate {...templateProps} />;
      case "creative":
        return <CreativeTemplate {...templateProps} />;
      case "executive":
        return <ExecutiveTemplate {...templateProps} />;
      default:
        return <ModernTemplate {...templateProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {resumeId ? "Edit Resume" : "AI Resume Builder"}
            </h1>
            <p className="text-muted-foreground">
              {resumeLoading ? "Loading..." : template ? `Using ${template.name} template` : resumeId ? "Update your professional resume" : "Build your professional resume"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/my-resumes')}
            >
              View All Resumes
            </Button>
            <Button
              variant="outline"
              onClick={() => setTemplateSelectorOpen(true)}
            >
              <Palette className="mr-2 h-4 w-4" /> Change Template
            </Button>
            <Button
              onClick={() => saveResumeMutation.mutate()}
              disabled={saveResumeMutation.isPending || resumeLoading}
            >
              {saveResumeMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {resumeId ? "Update Resume" : "Save Resume"}</>
              )}
            </Button>
            <Button variant="outline" onClick={exportToPDF} disabled={resumeLoading}>
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={resumeData.personal_info.full_name}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, full_name: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personal_info.email}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personal_info.phone}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personal_info.location}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, location: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={resumeData.personal_info.linkedin}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, linkedin: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        rows={4}
                        value={resumeData.summary}
                        onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        disabled={aiLoading}
                        onClick={async () => {
                          const enhanced = await enhanceWithAI(
                            `${resumeData.personal_info.full_name}, ${resumeData.experience[0]?.position || "Professional"}`,
                            "summary"
                          );
                          if (enhanced) {
                            setResumeData(prev => ({ ...prev, summary: enhanced }));
                          }
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {aiLoading ? "Enhancing..." : "Enhance with AI"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[index].company = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        <Input
                          placeholder="Position"
                          value={exp.position}
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[index].position = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="month"
                            placeholder="Start Date"
                            value={exp.start_date}
                            onChange={(e) => {
                              const newExp = [...resumeData.experience];
                              newExp[index].start_date = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                          />
                          <Input
                            type="month"
                            placeholder="End Date"
                            value={exp.end_date}
                            onChange={(e) => {
                              const newExp = [...resumeData.experience];
                              newExp[index].end_date = e.target.value;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }}
                          />
                        </div>
                        <Textarea
                          placeholder="Description"
                          rows={3}
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = [...resumeData.experience];
                            newExp[index].description = e.target.value;
                            setResumeData(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={aiLoading}
                          onClick={async () => {
                            const enhanced = await enhanceWithAI(
                              `${exp.position} at ${exp.company}`,
                              "work_experience"
                            );
                            if (enhanced) {
                              const newExp = [...resumeData.experience];
                              newExp[index].description = enhanced;
                              setResumeData(prev => ({ ...prev, experience: newExp }));
                            }
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Enhance with AI
                        </Button>
                      </div>
                    ))}
                    <Button onClick={addExperience} variant="outline" className="w-full">
                      Add Experience
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <Input
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[index].institution = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <Input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[index].degree = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <Input
                          placeholder="Field of Study"
                          value={edu.field}
                          onChange={(e) => {
                            const newEdu = [...resumeData.education];
                            newEdu[index].field = e.target.value;
                            setResumeData(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="month"
                            placeholder="Start Date"
                            value={edu.start_date}
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[index].start_date = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEdu }));
                            }}
                          />
                          <Input
                            type="month"
                            placeholder="End Date"
                            value={edu.end_date}
                            onChange={(e) => {
                              const newEdu = [...resumeData.education];
                              newEdu[index].end_date = e.target.value;
                              setResumeData(prev => ({ ...prev, education: newEdu }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <Button onClick={addEducation} variant="outline" className="w-full">
                      Add Education
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Languages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Skills (comma separated)</Label>
                      <Textarea
                        placeholder="React, TypeScript, Node.js, etc."
                        value={resumeData.skills.join(", ")}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }))}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        disabled={aiLoading}
                        onClick={async () => {
                          const enhanced = await enhanceWithAI(
                            resumeData.experience[0]?.position || "Professional",
                            "skills"
                          );
                          if (enhanced) {
                            const skills = enhanced.split(",").map((s: string) => s.trim()).filter(Boolean);
                            setResumeData(prev => ({ ...prev, skills }));
                          }
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Suggest Skills
                      </Button>
                    </div>
                    <div>
                      <Label>Languages (comma separated)</Label>
                      <Input
                        placeholder="English, Albanian, etc."
                        value={resumeData.languages.join(", ")}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Live Preview - {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateSelectorOpen(true)}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Change Template
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[800px] bg-gray-100 p-4 flex justify-center">
                  <div 
                    id="resume-preview" 
                    className="bg-white shadow-2xl"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      transform: 'scale(0.7)',
                      transformOrigin: 'top center',
                      marginBottom: '-30%',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {renderTemplate()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>

      {/* Template Selector Dialog */}
      <TemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelectTemplate={(template) => {
          setSelectedTemplate(template);
          setTemplateSelectorOpen(false);
          toast({
            title: "Template Changed",
            description: `Switched to ${template.charAt(0).toUpperCase() + template.slice(1)} template`,
          });
        }}
        currentTemplate={selectedTemplate}
        resumeData={resumeData}
      />

      {/* Footer */}
      <footer className="bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                jobs.al
              </div>
              <p className="text-muted-foreground mb-4">
                Albania's leading job portal connecting talents with opportunities.
              </p>
              <div className="text-sm text-muted-foreground">
                © 2024 jobs.al. All rights reserved.
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/jobs" className="hover:text-primary">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-primary">Career Advice</a></li>
                <li><a href="/resume-templates" className="hover:text-primary">Resume Templates</a></li>
                <li><a href="/resume-builder" className="hover:text-primary">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Post a Job</a></li>
                <li><a href="#" className="hover:text-primary">Browse Resumes</a></li>
                <li><a href="/pricing" className="hover:text-primary">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-primary">ATS Integration</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}