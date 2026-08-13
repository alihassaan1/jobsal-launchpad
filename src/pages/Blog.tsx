import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, ChevronDown, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import Navigation from "@/components/Navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POSTS_PER_PAGE = 9;

const formatCategory = (cat: string) =>
  (cat || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const BlogCardMedia = ({ post, className }: { post: any; className?: string }) => (
  <div className={`overflow-hidden rounded-2xl bg-muted ${className || "relative h-full w-full"}`}>
    {post.featured_image ? (
      <img
        src={post.featured_image}
        alt={post.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/50" />
    )}
  </div>
);

const Blog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  const buildQuery = useCallback(
    (from: number) => {
      let query = supabase
        .from("posts_public")
        .select("*, profiles!posts_author_id_fkey(full_name)")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range(from, from + POSTS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }
      return query;
    },
    [searchQuery, selectedCategory]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { data, error } = await buildQuery(0);
      if (cancelled) return;
      if (error) console.error("Error fetching posts:", error);
      setPosts(data || []);
      setHasMore((data?.length || 0) === POSTS_PER_PAGE);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [buildQuery]);

  useEffect(() => {
    const fetchSidebar = async () => {
      const [popular, cats] = await Promise.all([
        supabase
          .from("posts_public")
          .select("id, title, slug, views_count, featured_image")
          .eq("is_published", true)
          .order("views_count", { ascending: false })
          .limit(5),
        supabase.from("posts_public").select("category").eq("is_published", true),
      ]);
      if (popular.data) setPopularPosts(popular.data);
      if (cats.data) setCategories([...new Set(cats.data.map((p: any) => p.category))].filter(Boolean));
    };
    fetchSidebar();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const { data, error } = await buildQuery(posts.length);
    if (error) console.error("Error loading more posts:", error);
    if (data) {
      setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === POSTS_PER_PAGE);
    }
    setLoadingMore(false);
  };

  const updateParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all") newParams.set(key, value);
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateParams({ search: value });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    updateParams({ category: value });
  };

  const [featured, ...rest] = posts;

  return (
    <>
      <Helmet>
        <title>Albania Jobs Blog | Career Advice & Job Market Insights</title>
        <meta name="description" content="Expert career advice, resume tips & Albanian job market trends. Discover salary guides, interview tips, career opportunities & employment insights for professionals and expats in Albania." />
        <meta name="keywords" content="career advice albania, job market albania, resume tips, interview tips, salary guide albania, employment trends, career blog" />
        <meta property="og:title" content="Albania Jobs Blog | Career Advice & Job Market Insights" />
        <meta property="og:description" content="Expert career advice, resume tips & Albanian job market trends for professionals and expats." />
        <meta property="og:url" content="https://jobs.al/blog" />
        <meta property="og:image" content="https://jobs.al/og-image.jpg" />
        <link rel="canonical" href="https://jobs.al/blog" />
      </Helmet>

      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Albania Jobs Blog</h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">
              Career insights, job market trends, and expert advice
            </p>
          </header>

          {/* Search + Category filter */}
          <div className="mb-10 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {formatCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_230px]">
            {/* Posts */}
            <div>
              {loading ? (
                <div className="space-y-4">
                  <div className="aspect-[21/9] w-full animate-pulse rounded-2xl bg-muted" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-[3/2] animate-pulse rounded-2xl bg-muted" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No articles found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  {/* Featured post */}
                  <button
                    type="button"
                    onClick={() => navigate(`/blog/${featured.slug}`)}
                    className="group block w-full text-left"
                  >
                    <div className="relative aspect-[21/9] w-full">
                      <BlogCardMedia post={featured} className="absolute inset-0" />
                      <h2
                        className="absolute bottom-5 left-5 right-5 line-clamp-2 text-xl md:text-2xl font-medium text-white group-hover:font-bold"
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                      >
                        {featured.title}
                      </h2>
                    </div>
                  </button>

                  {/* Card grid */}
                  {rest.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {rest.map((post) => (
                        <article key={post.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            className="group block w-full text-left"
                          >
                            <div className="relative aspect-[3/2] w-full">
                              <BlogCardMedia post={post} className="absolute inset-0" />
                              <h3
                                className="absolute bottom-3 left-3 right-3 line-clamp-2 text-[15px] font-medium text-white group-hover:font-bold"
                                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                              >
                                {post.title}
                              </h3>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {formatCategory(post.category)} · {formatDate(post.published_at)}
                            </p>
                          </button>
                        </article>
                      ))}
                    </div>
                  )}

                  {hasMore && (
                    <div className="mt-10 flex justify-center">
                      <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-lg">
                        {loadingMore ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        )}
                        Load more articles
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                  Popular Articles
                </h2>
                <ol className="space-y-3">
                  {popularPosts.map((post, index) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="group flex w-full items-start gap-2 text-left"
                      >
                        <span className="w-3 shrink-0 pt-0.5 text-xs font-semibold text-primary/50">
                          {index + 1}
                        </span>
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-primary to-primary/50" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
                            {post.title}
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {post.views_count} views
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
                  Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(selectedCategory === cat ? "all" : cat)}
                      className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                        selectedCategory === cat
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {formatCategory(cat)}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
