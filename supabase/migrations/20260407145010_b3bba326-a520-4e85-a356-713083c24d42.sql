-- Backfill meta_keywords for all published blog posts missing them

-- Top performer: interview mistakes (67 views)
UPDATE posts SET meta_keywords = ARRAY['interview mistakes Albania', 'job interview tips', 'interview preparation Albania', 'common interview errors', 'albania job seekers'] WHERE slug = 'interview-mistakes-albanian-job-seekers-2026' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Resume tips (19 views)
UPDATE posts SET meta_keywords = ARRAY['resume tips', 'CV writing tips Albania', 'ATS friendly resume', 'resume format 2025', 'how to write resume', 'job application tips'] WHERE slug = '10-essential-resume-tips-2025' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Albanian job market (5 views)
UPDATE posts SET meta_keywords = ARRAY['Albanian job market', 'job market trends Albania', 'salary trends Albania 2025', 'jobs in Albania', 'employment trends', 'career opportunities Albania'] WHERE slug = 'albanian-job-market-2025-trends' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Career transition (4 views)
UPDATE posts SET meta_keywords = ARRAY['career change Albania', 'career transition tips', 'switching careers', 'job change advice', 'professional development Albania'] WHERE slug = 'career-transition-tips-for-albanian-professionals-1768024859753' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Elbasan guide (3 views)
UPDATE posts SET meta_keywords = ARRAY['jobs in Elbasan', 'Elbasan employment', 'job market Elbasan Albania', 'work in Elbasan', 'Elbasan companies'] WHERE slug = 'employment-guide-elbasan-1765778571733' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- CV shqip (3 views)
UPDATE posts SET meta_keywords = ARRAY['CV shqip', 'si te shkruash CV', 'CV profesionale', 'krijo CV', 'CV format shqip', 'pune shqiperi'] WHERE slug = 'si-te-shkruani-cv-ne-shqip' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- IT job market Tirana (2 views)
UPDATE posts SET meta_keywords = ARRAY['IT jobs Tirana', 'tech jobs Albania', 'software developer Tirana', 'IT salary Albania', 'technology careers Tirana'] WHERE slug = 'it-job-market-trends-in-tirana-1768111266916' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Technology career guide (2 views)
UPDATE posts SET meta_keywords = ARRAY['tech career Albania', 'technology jobs Albania', 'software developer Albania', 'IT career guide', 'tech companies Albania'] WHERE slug = 'career-guide-technology-1767074580943' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Korçë guide
UPDATE posts SET meta_keywords = ARRAY['jobs in Korçë', 'Korçë employment', 'job market Korçë Albania', 'work in Korçë', 'Korçë top employers'] WHERE slug = 'employment-guide-kor-1766383393012' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Salary negotiation
UPDATE posts SET meta_keywords = ARRAY['salary negotiation Albania', 'how to negotiate salary', 'salary tips', 'albania salary guide', 'compensation negotiation'] WHERE slug = 'how-to-negotiate-your-salary-in-albania-1767852077851' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Interview tips
UPDATE posts SET meta_keywords = ARRAY['job interview tips Albania', 'interview preparation', 'common interview questions', 'ace job interview', 'Albanian recruiters tips'] WHERE slug = 'ace-job-interview-tips-albania' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Top 10 skills
UPDATE posts SET meta_keywords = ARRAY['in-demand skills Albania', 'top skills 2025', 'job skills Albania', 'most wanted skills', 'career skills Albania'] WHERE slug = 'top-10-in-demand-skills-in-albania-s-job-market-2025-1767765672735' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Vlorë guide
UPDATE posts SET meta_keywords = ARRAY['jobs in Vlorë', 'Vlorë employment', 'job market Vlorë Albania', 'work in Vlorë', 'vlore albania jobs'] WHERE slug = 'employment-guide-vlor-1767852200391' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Hybrid work
UPDATE posts SET meta_keywords = ARRAY['hybrid work Albania', 'remote work Tirana', 'flexible working Albania', 'work from home Albania', 'remote jobs Albania'] WHERE slug = 'hybrid-work-albania-guide-2026' AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);

-- Catch-all: any remaining posts with empty keywords get generic career keywords
UPDATE posts SET meta_keywords = ARRAY['jobs in Albania', 'career advice Albania', 'employment Albania', 'job search tips'] WHERE is_published = true AND (meta_keywords IS NULL OR array_length(meta_keywords, 1) IS NULL);