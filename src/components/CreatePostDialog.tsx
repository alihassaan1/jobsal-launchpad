import { R2ImageUpload } from "@/components/R2ImageUpload";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

const CATEGORIES = [
  "Career Advice",
  "Job Market Trends",
  "Interview Tips",
  "Resume Building",
  "Employer Insights",
  "Salary Guide",
  "Industry Analysis"
];

export function CreatePostDialog({ open, onOpenChange, onSuccess, userId }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("manual");
  
  // Manual Creation State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category: '',
    tags: '',
    meta_keywords: '',
    language: 'en',
    is_published: false,
    meta_title: '',
    meta_description: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleManualCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsCreating(true);
    try {
      const slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
      const keywordsArray = formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()) : [];

      const { error } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          slug: slug,
          content: formData.content,
          excerpt: formData.excerpt,
          featured_image: formData.featured_image,
          category: formData.category,
          tags: tagsArray,
          meta_keywords: keywordsArray,
          meta_title: formData.meta_title || formData.title,
          meta_description: formData.meta_description || formData.excerpt,
          language: formData.language,
          is_published: formData.is_published,
          author_id: userId,
          published_at: formData.is_published ? new Date().toISOString() : null
        });

      if (error) throw error;

      toast.success("Blog post created successfully!");
      
      // Reset form
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        category: '',
        tags: '',
        meta_keywords: '',
        language: 'en',
        is_published: false,
        meta_title: '',
        meta_description: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      toast.error(error.message || "Failed to create blog post");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
          <DialogDescription>
            Write and publish a blog post
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "manual")} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="manual" className="gap-2">
              <FileText className="h-4 w-4" />
              Manual Create
            </TabsTrigger>
          </TabsList>

          {/* Manual Creation Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="manual-title">Title *</Label>
                <Input
                  id="manual-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog post title"
                />
              </div>

              <div>
                <Label htmlFor="manual-slug">Slug</Label>
                <Input
                  id="manual-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <Label htmlFor="manual-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manual-excerpt">Excerpt</Label>
                <Textarea
                  id="manual-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="manual-content">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div>
                <Label htmlFor="manual-image">Featured Image URL (recommended)</Label>
                <Input
                  id="manual-image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="mt-2">
                  <R2ImageUpload folder="blog" onUploaded={(url) => setFormData({ ...formData, featured_image: url })} />
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 800x530px (3:2 ratio). Prefer images with darker tones or open space at the bottom so the white title stays readable.
                </p>
              </div>


              <div>
                <Label htmlFor="manual-tags">Tags (comma-separated)</Label>
                <Input
                  id="manual-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                />
                <Label htmlFor="publish">Publish immediately</Label>
              </div>

              <Button
                onClick={handleManualCreate}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Blog Post"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
