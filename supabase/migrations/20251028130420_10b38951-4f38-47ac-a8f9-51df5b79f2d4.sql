-- Add new columns to resumes table only
-- Add resume_file_url to resumes table for uploaded files
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS resume_file_url text;

-- Add is_uploaded column to distinguish uploaded vs builder-generated
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS is_uploaded boolean DEFAULT false;

-- Add resume_type to categorize resumes (e.g., "Software Engineer", "Marketing Manager")
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS resume_type text;