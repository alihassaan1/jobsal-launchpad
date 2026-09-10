import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import ResumeThumbnail from "./resume-templates/ResumeThumbnail";
import {
  RESUME_TEMPLATES,
  withPreviewFallback,
  type ResumeTemplateData,
} from "./resume-templates/registry";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateName: string) => void;
  currentTemplate: string;
  resumeData: ResumeTemplateData;
}

export default function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
  currentTemplate,
  resumeData,
}: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const previewData = withPreviewFallback(resumeData);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Choose Resume Template</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RESUME_TEMPLATES.map((template) => (
                <Card
                  key={template.slug}
                  className={`p-4 transition-all hover:shadow-lg ${
                    currentTemplate === template.slug ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template.slug)}
                    className="mb-3 block w-full overflow-hidden rounded border bg-muted"
                    aria-label={`Preview ${template.label} template`}
                  >
                    <ResumeThumbnail slug={template.slug} data={previewData} />
                  </button>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{template.label}</h3>
                    {template.isPremium && (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3 text-primary" /> Premium · Free now
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template.slug)}
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectTemplate(template.slug);
                        onOpenChange(false);
                      }}
                      className="flex-1"
                    >
                      {currentTemplate === template.slug ? "Selected" : "Select"}
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
        <DialogContent className="max-w-[min(900px,95vw)] max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>
              {RESUME_TEMPLATES.find((t) => t.slug === previewTemplate)?.label} Template Preview
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[75vh] px-6 pb-6">
            <div className="mx-auto w-full max-w-[640px] border rounded-lg overflow-hidden">
              {previewTemplate && (
                <ResumeThumbnail slug={previewTemplate} data={previewData} fullPage />
              )}
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
