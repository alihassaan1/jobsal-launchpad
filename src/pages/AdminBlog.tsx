import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Eye, Calendar, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { EditPostDialog } from "@/components/EditPostDialog";

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
  views_count: number;
  created_at: string;
  profiles?: { full_name: string | null };
}

const AdminBlog = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState<string | null>(null);

  useEffect(() => {
    const allowedRoles = ['admin', 'editor'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      navigate('/');
      toast.error("Access denied");
      return;
    }
    fetchPosts();
  }, [userRole]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      toast.error("Failed to load posts");
    } else if (data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  };

  const togglePublish = async (post: Post) => {
    setTogglingPublish(post.id);
    
    const newPublishedState = !post.is_published;
    const updateData: any = {
      is_published: newPublishedState,
      updated_at: new Date().toISOString()
    };

    // Set published_at when publishing for first time
    if (newPublishedState && !post.is_published) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post.id);

    if (error) {
      toast.error("Failed to update post status");
    } else {
      toast.success(newPublishedState ? "Post published!" : "Post unpublished");
      fetchPosts();
    }
    setTogglingPublish(null);
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted successfully");
      fetchPosts();
    }
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const seedSamplePosts = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-blog-posts');
      if (error) throw error;
      toast.success('Sample blog posts created successfully!');
      await fetchPosts();
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error(error.message || 'Failed to seed sample posts');
    } finally {
      setIsSeeding(false);
    }
  };

  const runScheduledGenerator = async () => {
    toast.info("Starting content generation...");
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-content-generator');
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Generated: ${data.result?.title || 'New content'}`);
        fetchPosts();
      } else {
        toast.info(data?.message || 'Content generation completed');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage blog posts</p>
        </div>
        <div className="flex gap-2">
          {posts.length === 0 && (
            <Button 
              variant="outline" 
              onClick={seedSamplePosts}
              disabled={isSeeding}
            >
              {isSeeding ? 'Creating...' : 'Create Sample Posts'}
            </Button>
          )}
          <Button variant="outline" onClick={runScheduledGenerator}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Content
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchPosts}
        userId={user?.id || ''}
      />

      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchPosts}
        post={selectedPost}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Posts ({posts.length})</CardTitle>
          <CardDescription>Manage your blog posts - edit content, toggle publish status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts yet. Create your first post!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Lang</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-md">
                        <p className="truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground truncate">/blog/{post.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg">{post.language === 'en' ? '🇬🇧' : '🇦🇱'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={post.is_published}
                          onCheckedChange={() => togglePublish(post)}
                          disabled={togglingPublish === post.id}
                        />
                        {togglingPublish === post.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(post)}
                          title="Edit post"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {post.is_published && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            title="View post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePost(post.id)}
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlog;
