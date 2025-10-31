import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModernTemplate from "./resume-templates/ModernTemplate";
import ClassicTemplate from "./resume-templates/ClassicTemplate";
import CreativeTemplate from "./resume-templates/CreativeTemplate";
import ExecutiveTemplate from "./resume-templates/ExecutiveTemplate";

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

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateName: string) => void;
  currentTemplate: string;
  resumeData: ResumeData;
}

const templates = [
  { name: "modern", label: "Modern", description: "Clean and professional with accent colors" },
  { name: "classic", label: "Classic", description: "Traditional and timeless format" },
  { name: "creative", label: "Creative", description: "Eye-catching two-column layout" },
  { name: "executive", label: "Executive", description: "Sophisticated design for senior roles" },
];

export default function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
  currentTemplate,
  resumeData,
}: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const renderTemplatePreview = (templateName: string) => {
    const sampleData = {
      ...resumeData,
      personal_info: resumeData.personal_info.full_name 
        ? resumeData.personal_info 
        : {
            full_name: "John Doe",
            email: "john@example.com",
            phone: "+355 69 123 4567",
            location: "Tirana, Albania",
            linkedin: "linkedin.com/in/johndoe",
            portfolio: "",
          },
      summary: resumeData.summary || "Experienced professional with a proven track record in delivering exceptional results.",
      experience: resumeData.experience.length > 0 ? resumeData.experience : [
        {
          company: "Tech Company",
          position: "Senior Developer",
          start_date: "2020",
          end_date: "Present",
          description: "Leading development team and architecting solutions.",
          achievements: ["Increased efficiency by 40%", "Led team of 5 developers"],
        },
      ],
      education: resumeData.education.length > 0 ? resumeData.education : [
        {
          institution: "University of Tirana",
          degree: "Bachelor of Science",
          field: "Computer Science",
          start_date: "2016",
          end_date: "2020",
          gpa: "3.8",
        },
      ],
      skills: resumeData.skills.length > 0 ? resumeData.skills : ["JavaScript", "React", "Node.js", "SQL"],
    };

    switch (templateName) {
      case "modern":
        return <ModernTemplate data={sampleData} />;
      case "classic":
        return <ClassicTemplate data={sampleData} />;
      case "creative":
        return <CreativeTemplate data={sampleData} />;
      case "executive":
        return <ExecutiveTemplate data={sampleData} />;
      default:
        return <ModernTemplate data={sampleData} />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Choose Resume Template</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.name}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    currentTemplate === template.name ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div
                    onClick={() => setPreviewTemplate(template.name)}
                    className="mb-3"
                  >
                    <div className="aspect-[3/4] bg-muted rounded overflow-hidden mb-2 border">
                      <div className="scale-[0.15] origin-top-left w-[666%] h-[666%]">
                        {renderTemplatePreview(template.name)}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">{template.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template.name)}
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectTemplate(template.name);
                        onOpenChange(false);
                      }}
                      className="flex-1"
                    >
                      {currentTemplate === template.name ? "Selected" : "Select"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-[90vw] max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>
              {templates.find((t) => t.name === previewTemplate)?.label} Template Preview
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[80vh] px-6 pb-6">
            <div className="flex justify-center">
              <div className="transform scale-75 origin-top">
                {previewTemplate && renderTemplatePreview(previewTemplate)}
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  onSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                  onOpenChange(false);
                }
              }}
            >
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
