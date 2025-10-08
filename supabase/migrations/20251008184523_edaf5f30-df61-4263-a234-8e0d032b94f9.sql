-- Mark duplicate resumes as inactive, keeping only the most recent one
-- This keeps the resume created at 2025-10-08 18:29:49 and marks the older two as inactive

UPDATE resumes
SET is_active = false
WHERE id IN ('63bc23ea-5f1e-4bb4-b10f-4b01a82c5663', '994464f3-c40a-495a-94a0-89b796de7f6c')
AND user_id = '2ae25656-f7bd-499f-a945-71f8fb277710';