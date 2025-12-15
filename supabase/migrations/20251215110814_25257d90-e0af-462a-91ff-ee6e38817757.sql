-- Create blog_authors table for AI-generated content authors
CREATE TABLE public.blog_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- Anyone can view blog authors
CREATE POLICY "Anyone can view blog authors" 
ON public.blog_authors 
FOR SELECT 
USING (true);

-- Admins can manage blog authors
CREATE POLICY "Admins can manage blog authors" 
ON public.blog_authors 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add blog_author_id to posts table
ALTER TABLE public.posts 
ADD COLUMN blog_author_id UUID REFERENCES public.blog_authors(id);

-- Insert 5 Albanian blogger profiles
INSERT INTO public.blog_authors (name, bio, location, specialization) VALUES
('Andi Krasniqi', 'Ekspert i tregut të punës me 10+ vite përvojë në rekrutim dhe zhvillim karriere në Shqipëri.', 'Tiranë', 'Career Development'),
('Elira Hoxha', 'Konsulente HR dhe specialiste në menaxhimin e talenteve për kompanitë shqiptare dhe ndërkombëtare.', 'Durrës', 'HR & Recruitment'),
('Dritan Shehu', 'Gazetar ekonomik dhe analist i trendeve të punësimit në Ballkanin Perëndimor.', 'Vlorë', 'Economic Analysis'),
('Anisa Berisha', 'Trajnere profesionale dhe mentore karierie për të rinjtë shqiptarë që hyjnë në tregun e punës.', 'Shkodër', 'Youth Employment'),
('Besnik Duka', 'Sipërmarrës dhe këshilltar biznesi me fokus në startup-et dhe inovacionin në Shqipëri.', 'Tiranë', 'Entrepreneurship');