INSERT INTO public.email_templates (name, slug, subject, html_content, category, description)
VALUES
  ('Role Upgrade - Employer', 'role-upgrade-employer', 'Llogaria juaj u përditësua – Tani jeni Punëdhënës në Jobs.al! 🏢', '<p>Dynamic template</p>', 'transactional', 'Sent when admin upgrades a user from candidate to employer role'),
  ('Resume Upload Reminder', 'resume-upload-reminder', '{{name}}, ngarkoni CV-në tuaj për të aplikuar më shpejt! 📎', '<p>Dynamic template</p>', 'automation', 'Sent 3 days after signup if user has not uploaded a resume')
ON CONFLICT (slug) DO NOTHING;