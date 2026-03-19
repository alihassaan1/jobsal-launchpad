INSERT INTO public.email_templates (name, slug, subject, html_content, category, description)
VALUES
  ('Subscription Renewal Reminder', 'subscription-renewal', 'Abonimi juaj po rinovohet 🔄', '<p>Dynamic template</p>', 'billing', 'Sent before subscription auto-renewal to remind employer'),
  ('Subscription Expired', 'subscription-expired', 'Abonimi juaj ka skaduar ⚠️', '<p>Dynamic template</p>', 'billing', 'Sent when employer subscription expires'),
  ('Payment Receipt', 'payment-receipt', 'Pagesa u konfirmua ✅', '<p>Dynamic template</p>', 'billing', 'Sent after successful payment with invoice details'),
  ('Payment Failed', 'payment-failed', 'Pagesa nuk u krye ❌', '<p>Dynamic template</p>', 'billing', 'Sent when payment fails with retry info'),
  ('Ad Performance Weekly', 'ad-performance-weekly', 'Raporti javor i reklamës 📊', '<p>Dynamic template</p>', 'analytics', 'Weekly ad performance summary with impressions, clicks, applications'),
  ('Invoice Overdue', 'invoice-overdue', 'Fatura ka kaluar afatin 🔴', '<p>Dynamic template</p>', 'billing', 'Sent when invoice is past due date')
ON CONFLICT (slug) DO NOTHING;