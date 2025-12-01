import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  tags: string[] | null;
  meta_keywords: string[] | null;
  language: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  post: Post | null;
}

const CATEGORIES = [
  "Career Advice",
  "Job Market Trends",
  "Interview Tips",
  "Resume Building",
  "Employer Insights",
  "Salary Guide",
  "Industry Analysis",
  "City Guide",
  "Career Guide"
];

export function EditPostDialog({ open, onOpenChange, onSuccess, post }: EditPostDialogProps) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        category: post.category || '',
        tags: post.tags?.join(', ') || '',
        meta_keywords: post.meta_keywords?.join(', ') || '',
        language: post.language || 'en',
        is_published: post.is_published || false,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || ''
      });
    }
  }, [post]);

  const handleSave = async () => {
    if (!post) return;
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const keywordsArray = formData.meta_keywords ? formData.meta_keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

      const updateData: any = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        featured_image: formData.featured_image || null,
        category: formData.category,
        tags: tagsArray,
        meta_keywords: keywordsArray,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
        language: formData.language,
        is_published: formData.is_published,
        updated_at: new Date().toISOString()
      };

      // Set published_at when publishing for the first time
      if (formData.is_published && !post.is_published) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id);

      if (error) throw error;

      toast.success("Blog post updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating blog post:', error);
      toast.error(error.message || "Failed to update blog post");
    } finally {
      setIsSaving(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
          <DialogDescription>
            Update your blog post content and SEO settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "content" | "seo")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter blog post title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
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
                  <Label htmlFor="edit-language">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English 🇬🇧</SelectItem>
                      <SelectItem value="al">Albanian 🇦🇱</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-excerpt">Excerpt</Label>
                <Textarea
                  id="edit-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-content">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div>
                <Label htmlFor="edit-image">Featured Image URL</Label>
                <Input
                  id="edit-image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featured_image && (
                  <img 
                    src={formData.featured_image} 
                    alt="Featured" 
                    className="mt-2 max-h-32 rounded border"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="edit-meta-title">Meta Title</Label>
                <Input
                  id="edit-meta-title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO-optimized title (60 chars max)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="edit-meta-description">Meta Description</Label>
                <Textarea
                  id="edit-meta-description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO-optimized description (155 chars max)"
                  maxLength={155}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_description.length}/155 characters
                </p>
              </div>

              <div>
                <Label htmlFor="edit-meta-keywords">Meta Keywords (comma-separated)</Label>
                <Input
                  id="edit-meta-keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">SEO Preview</h4>
                <div className="space-y-1">
                  <p className="text-primary text-lg hover:underline cursor-pointer">
                    {formData.meta_title || formData.title || "Page Title"}
                  </p>
                  <p className="text-green-600 text-sm">
                    jobs.al/blog/{formData.slug || "post-slug"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formData.meta_description || formData.excerpt || "Page description will appear here..."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-publish"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
            />
            <Label htmlFor="edit-publish" className="font-medium">
              {formData.is_published ? "Published" : "Draft"}
            </Label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
