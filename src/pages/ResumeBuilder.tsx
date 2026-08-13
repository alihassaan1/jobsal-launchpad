import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, Sparkles, Download, Save, Palette, Trash2, Plus } from "lucide-react";
import html2pdf from "html2pdf.js";
import TemplateSelector from "@/components/TemplateSelector";
import ModernTemplate from "@/components/resume-templates/ModernTemplate";
import ClassicTemplate from "@/components/resume-templates/ClassicTemplate";
import CreativeTemplate from "@/components/resume-templates/CreativeTemplate";
import ExecutiveTemplate from "@/components/resume-templates/ExecutiveTemplate";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useResumeAISettings, isOn } from "@/hooks/useResumeAISettings";

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
  template?: string;
}

export default function ResumeBuilder() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const resumeId = searchParams.get("id");
  const queryClient = useQueryClient();
  const { data: aiSettings } = useResumeAISettings();
  const aiEnabled = isOn(aiSettings, "resume_ai_enabled");

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

  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Require sign-in: saving is impossible for anonymous visitors
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/resume-builder", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Warn before losing unsaved edits
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const updateResume = (updater: (prev: ResumeData) => ResumeData) => {
    setIsDirty(true);
    setResumeData(updater);
  };

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
      const loaded = existingResume.data as unknown as ResumeData;
      setResumeData({
        personal_info: {
          full_name: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          portfolio: "",
          ...(loaded.personal_info || {}),
        },
        summary: loaded.summary || "",
        experience: loaded.experience || [],
        education: loaded.education || [],
        skills: loaded.skills || [],
        certifications: loaded.certifications || [],
        languages: loaded.languages || [],
        template: loaded.template,
      });
      if (loaded.template) setSelectedTemplate(loaded.template);
      setIsDirty(false);
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
            data: { ...resumeData, template: selectedTemplate } as any,
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
              data: { ...resumeData, template: selectedTemplate } as any,
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
            data: { ...resumeData, template: selectedTemplate } as any,
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
      setIsDirty(false);
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

  const enhanceWithAI = async (text: string, type: string, loadingKey: string) => {
    setAiLoadingKey(loadingKey);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-resume", {
        body: { text, type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.enhancedText) throw new Error("The AI did not return any content. Please try again.");

      toast({
        title: "AI Enhancement Complete",
        description: "Content has been enhanced with AI suggestions",
      });

      setIsDirty(true);
      return data.enhancedText as string;
    } catch (error: any) {
      toast({
        title: "AI Enhancement Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setAiLoadingKey(null);
    }
  };

  const addExperience = () => {
    updateResume(prev => ({
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

  const removeExperience = (index: number) => {
    updateResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducation = () => {
    updateResume(prev => ({
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

  const removeEducation = (index: number) => {
    updateResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    updateResume(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "", date: "" }],
    }));
  };

  const removeCertification = (index: number) => {
    updateResume(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const exportToPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) {
      toast({
        title: "Error",
        description: "Resume preview not found",
        variant: "destructive",
      });
      return;
    }

    if (!resumeData.personal_info.full_name.trim()) {
      toast({
        title: "Add your name first",
        description: "Please enter your full name before exporting the PDF",
        variant: "destructive",
      });
      return;
    }

    // The on-screen preview is scaled down (transform: scale) — render an
    // off-screen, unscaled clone so the PDF is captured at full A4 size.
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-10000px';
    wrapper.style.width = '210mm';
    wrapper.style.backgroundColor = '#ffffff';

    const clone = element.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id');
    clone.style.transform = 'none';
    clone.style.marginBottom = '0';
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.maxWidth = '210mm';
    clone.style.display = 'block';
    clone.style.boxSizing = 'border-box';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const opt = {
      margin: 0,
      filename: `${resumeData.personal_info.full_name || 'Resume'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    setExporting(true);
    toast({
      title: "Generating PDF",
      description: "Please wait while we create your high-quality resume...",
    });

    try {
      await html2pdf().set(opt).from(wrapper).save();
      toast({
        title: "PDF Export Complete",
        description: "Your resume has been downloaded successfully",
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      wrapper.remove();
      setExporting(false);
    }
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/my-resumes')}>
              View All Resumes
            </Button>
            <Button variant="outline" onClick={() => setTemplateSelectorOpen(true)}>
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
            <Button variant="outline" onClick={exportToPDF} disabled={resumeLoading || exporting}>
              {exporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Export PDF</>
              )}
            </Button>
          </div>
        </div>

        {isDirty && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            You have unsaved changes. Click <strong>{resumeId ? "Update Resume" : "Save Resume"}</strong> to keep them.
          </div>
        )}

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
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={resumeData.personal_info.full_name}
                        onChange={(e) => updateResume(prev => ({
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
                        onChange={(e) => updateResume(prev => ({
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
                        onChange={(e) => updateResume(prev => ({
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
                        onChange={(e) => updateResume(prev => ({
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
                        onChange={(e) => updateResume(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, linkedin: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio / Website</Label>
                      <Input
                        id="portfolio"
                        value={resumeData.personal_info.portfolio}
                        onChange={(e) => updateResume(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, portfolio: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        rows={4}
                        value={resumeData.summary}
                        onChange={(e) => updateResume(prev => ({ ...prev, summary: e.target.value }))}
                      />
                      {aiEnabled && isOn(aiSettings, "resume_ai_summary_enabled") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={aiLoadingKey !== null}
                          onClick={async () => {
                            const enhanced = await enhanceWithAI(
                              `${resumeData.personal_info.full_name}, ${resumeData.experience[0]?.position || "Professional"}${resumeData.skills.length ? `, skills: ${resumeData.skills.join(", ")}` : ""}`,
                              "summary",
                              "summary"
                            );
                            if (enhanced) {
                              updateResume(prev => ({ ...prev, summary: enhanced }));
                            }
                          }}
                        >
                          {aiLoadingKey === "summary" ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                          ) : (
                            <><Sparkles className="mr-2 h-4 w-4" /> Enhance with AI</>
                          )}
                        </Button>
                      )}
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
                    {resumeData.experience.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No experience added yet. Add your most recent role first.
                      </p>
                    )}
                    {resumeData.experience.map((exp, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Position {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove experience"
                            onClick={() => removeExperience(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = resumeData.experience.map((item, i) =>
                              i === index ? { ...item, company: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        <Input
                          placeholder="Position"
                          value={exp.position}
                          onChange={(e) => {
                            const newExp = resumeData.experience.map((item, i) =>
                              i === index ? { ...item, position: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Start date</Label>
                            <Input
                              type="month"
                              value={exp.start_date}
                              onChange={(e) => {
                                const newExp = resumeData.experience.map((item, i) =>
                                  i === index ? { ...item, start_date: e.target.value } : item
                                );
                                updateResume(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">End date</Label>
                            <Input
                              type="month"
                              value={exp.end_date}
                              onChange={(e) => {
                                const newExp = resumeData.experience.map((item, i) =>
                                  i === index ? { ...item, end_date: e.target.value } : item
                                );
                                updateResume(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </div>
                        </div>
                        <Textarea
                          placeholder="Description"
                          rows={3}
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = resumeData.experience.map((item, i) =>
                              i === index ? { ...item, description: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, experience: newExp }));
                          }}
                        />
                        {aiEnabled && isOn(aiSettings, "resume_ai_experience_enabled") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={aiLoadingKey !== null || (!exp.position && !exp.company)}
                            onClick={async () => {
                              const enhanced = await enhanceWithAI(
                                `${exp.position} at ${exp.company}. ${exp.description}`,
                                "work_experience",
                                `experience-${index}`
                              );
                              if (enhanced) {
                                const newExp = resumeData.experience.map((item, i) =>
                                  i === index ? { ...item, description: enhanced } : item
                                );
                                updateResume(prev => ({ ...prev, experience: newExp }));
                              }
                            }}
                          >
                            {aiLoadingKey === `experience-${index}` ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                            ) : (
                              <><Sparkles className="mr-2 h-4 w-4" /> Enhance with AI</>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button onClick={addExperience} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Experience
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Education {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove education"
                            onClick={() => removeEducation(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = resumeData.education.map((item, i) =>
                              i === index ? { ...item, institution: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <Input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdu = resumeData.education.map((item, i) =>
                              i === index ? { ...item, degree: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <Input
                          placeholder="Field of Study"
                          value={edu.field}
                          onChange={(e) => {
                            const newEdu = resumeData.education.map((item, i) =>
                              i === index ? { ...item, field: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, education: newEdu }));
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Start date</Label>
                            <Input
                              type="month"
                              value={edu.start_date}
                              onChange={(e) => {
                                const newEdu = resumeData.education.map((item, i) =>
                                  i === index ? { ...item, start_date: e.target.value } : item
                                );
                                updateResume(prev => ({ ...prev, education: newEdu }));
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">End date</Label>
                            <Input
                              type="month"
                              value={edu.end_date}
                              onChange={(e) => {
                                const newEdu = resumeData.education.map((item, i) =>
                                  i === index ? { ...item, end_date: e.target.value } : item
                                );
                                updateResume(prev => ({ ...prev, education: newEdu }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button onClick={addEducation} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Education
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.certifications.map((cert, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Certification {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove certification"
                            onClick={() => removeCertification(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Certification name"
                          value={cert.name}
                          onChange={(e) => {
                            const next = resumeData.certifications.map((item, i) =>
                              i === index ? { ...item, name: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, certifications: next }));
                          }}
                        />
                        <Input
                          placeholder="Issuer"
                          value={cert.issuer}
                          onChange={(e) => {
                            const next = resumeData.certifications.map((item, i) =>
                              i === index ? { ...item, issuer: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, certifications: next }));
                          }}
                        />
                        <Input
                          type="month"
                          value={cert.date}
                          onChange={(e) => {
                            const next = resumeData.certifications.map((item, i) =>
                              i === index ? { ...item, date: e.target.value } : item
                            );
                            updateResume(prev => ({ ...prev, certifications: next }));
                          }}
                        />
                      </div>
                    ))}
                    <Button onClick={addCertification} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Certification
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills &amp; Languages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Skills (comma separated)</Label>
                      <Textarea
                        placeholder="React, TypeScript, Node.js, etc."
                        value={resumeData.skills.join(", ")}
                        onChange={(e) => updateResume(prev => ({
                          ...prev,
                          skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }))}
                      />
                      {aiEnabled && isOn(aiSettings, "resume_ai_skills_enabled") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={aiLoadingKey !== null}
                          onClick={async () => {
                            const enhanced = await enhanceWithAI(
                              resumeData.experience[0]?.position || "Professional",
                              "skills",
                              "skills"
                            );
                            if (enhanced) {
                              const skills = enhanced
                                .split(/[,\n]/)
                                .map((s: string) => s.replace(/^[-•\d.\s]+/, "").trim())
                                .filter(Boolean);
                              updateResume(prev => ({ ...prev, skills }));
                            }
                          }}
                        >
                          {aiLoadingKey === "skills" ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suggesting...</>
                          ) : (
                            <><Sparkles className="mr-2 h-4 w-4" /> Suggest Skills</>
                          )}
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Languages (comma separated)</Label>
                      <Input
                        placeholder="English, Albanian, etc."
                        value={resumeData.languages.join(", ")}
                        onChange={(e) => updateResume(prev => ({
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
                <CardTitle className="text-base sm:text-lg">
                  Live Preview - {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setTemplateSelectorOpen(true)}>
                  <Palette className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[800px] bg-muted p-4 flex justify-center">
                  <div
                    id="resume-preview"
                    className="bg-white shadow-2xl shrink-0"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      transform: 'scale(0.7)',
                      transformOrigin: 'top center',
                      marginBottom: '-30%',
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
          setIsDirty(true);
          setTemplateSelectorOpen(false);
          toast({
            title: "Template Changed",
            description: `Switched to ${template.charAt(0).toUpperCase() + template.slice(1)} template. Save to keep it.`,
          });
        }}
        currentTemplate={selectedTemplate}
        resumeData={resumeData}
      />

      <Footer />
    </div>
  );
}