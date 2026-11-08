import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { packageTemplates } from "./packageTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template HTML generator
function getEmailTemplate(templateSlug: string, data: Record<string, string>): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    "welcome": {
      subject: `Mirë se vini në Jobs.al – Karriera juaj fillon këtu! 🎉`,
      html: generateWelcomeEmail(data)
    },
    "resume-reminder-1": {
      subject: `${data.name || 'Përdoruesi'}, puna juaj e ëndrrave po pret – por së pari, CV-ja juaj! 📄`,
      html: generateResumeReminder1(data)
    },
    "resume-reminder-2": {
      subject: `Pyetje e shpejtë, ${data.name || 'Përdoruesi'} – a jeni ende duke kërkuar punë? 🤔`,
      html: generateResumeReminder2(data)
    },
    "resume-reminder-final": {
      subject: `Mundësi e fundit! Punëdhënësit po kërkojnë kandidatë si ju 🔍`,
      html: generateFinalReminder(data)
    },
    "weekly-digest": {
      subject: `${data.jobCount || '5'} punë të reja përputhen me profilin tuaj këtë javë! 💼`,
      html: generateWeeklyDigest(data)
    },
    "application-confirmation": {
      subject: `Aplikimi juaj u dërgua me sukses! ✅`,
      html: generateApplicationConfirmation(data)
    },
    "job-match": {
      subject: `${data.matchCount || '3'} punë të reja përputhen me CV-në tuaj! 🎯`,
      html: generateJobMatchEmail(data)
    },
    "application-status": {
      subject: `Përditësim për aplikimin tuaj tek ${data.company || 'Kompania'} 📋`,
      html: generateApplicationStatusEmail(data)
    },
    "profile-incomplete": {
      subject: `${data.name || 'Përdoruesi'}, plotësoni profilin tuaj për rezultate më të mira! ✏️`,
      html: generateProfileIncompleteEmail(data)
    },
    "reactivation": {
      subject: `Na keni munguar! ${data.newJobsCount || '50'}+ punë të reja ju presin 🚀`,
      html: generateReactivationEmail(data)
    },
    "employer-welcome": {
      subject: `Mirë se vini në Jobs.al si Punëdhënës! 🏢`,
      html: generateEmployerWelcomeEmail(data)
    },
    "job-expiring": {
      subject: `Puna "${data.jobTitle || 'Punë'}" po skadon për ${data.daysLeft || '3'} ditë! ⏰`,
      html: generateJobExpiringEmail(data)
    },
    "new-applicant": {
      subject: `Aplikant i ri për "${data.jobTitle || 'Punë'}" 📨`,
      html: generateNewApplicantEmail(data)
    },
    "interview-scheduled": {
      subject: `Intervista juaj është konfirmuar për ${data.interviewDate || 'së shpejti'}! 🗓️`,
      html: generateInterviewScheduledEmail(data)
    },
    "role-upgrade-employer": {
      subject: `Llogaria juaj u përditësua – Tani jeni Punëdhënës në Jobs.al! 🏢`,
      html: generateRoleUpgradeEmployerEmail(data)
    },
    "resume-upload-reminder": {
      subject: `${data.name || 'Përdoruesi'}, ngarkoni CV-në tuaj për të aplikuar më shpejt! 📎`,
      html: generateResumeUploadReminderEmail(data)
    },
    "subscription-renewal": {
      subject: `Abonimi juaj "${data.planName || 'Pro'}" po rinovohet për ${data.daysLeft || '7'} ditë 🔄`,
      html: generateSubscriptionRenewalEmail(data)
    },
    "subscription-expired": {
      subject: `Abonimi juaj në Jobs.al ka skaduar ⚠️`,
      html: generateSubscriptionExpiredEmail(data)
    },
    "payment-receipt": {
      subject: `Fatura #${data.invoiceNumber || ''} — Pagesa u konfirmua ✅`,
      html: generatePaymentReceiptEmail(data)
    },
    "payment-failed": {
      subject: `Pagesa për "${data.planName || 'abonim'}" nuk u krye — Veproni tani ❌`,
      html: generatePaymentFailedEmail(data)
    },
    "ad-performance-weekly": {
      subject: `Raporti javor i reklamës: ${data.impressions || '0'} shfaqje, ${data.clicks || '0'} klikime 📊`,
      html: generateAdPerformanceWeeklyEmail(data)
    },
    "invoice-overdue": {
      subject: `Fatura #${data.invoiceNumber || ''} ka kaluar afatin e pagesës 🔴`,
      html: generateInvoiceOverdueEmail(data)
    }
  };

  Object.assign(templates, packageTemplates(data, (c) => wrapEmail(c)));
  return templates[templateSlug] || templates["welcome"];
}

// Base email wrapper — Albanian Red theme matching jobs.al website
function wrapEmail(content: string, unsubscribeUrl: string = "https://jobs.al/settings"): string {
  return `
<!DOCTYPE html>
<html lang="sq" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <title>Jobs.al</title>
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; color: #262626; }
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #E8272C; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #E8272C 0%, #F04E53 50%, #F47275 100%); padding: 36px 32px; text-align: center; }
    .header-logo { font-size: 32px; font-weight: 800; color: #ffffff !important; letter-spacing: -0.5px; margin: 0; }
    .header-logo span { font-weight: 400; opacity: 0.9; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 12px 0 0 0; font-weight: 600; letter-spacing: -0.2px; }
    .content { padding: 40px 32px; }
    .content h2 { color: #1a1a1a; font-size: 22px; margin: 0 0 16px 0; font-weight: 700; letter-spacing: -0.3px; }
    .content p { color: #525252; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
    .cta-button { display: inline-block; background: #E8272C; color: #ffffff !important; text-decoration: none !important; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; mso-padding-alt: 0; text-align: center; }
    /*[if mso]><style>.cta-button { background: #E8272C !important; padding: 14px 32px !important; }</style><![endif]*/
    .cta-secondary { display: inline-block; background: #ffffff; color: #E8272C !important; text-decoration: none !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 10px 0; border: 2px solid #E8272C; }
    .feature-box { background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .feature-item { display: flex; align-items: flex-start; margin: 16px 0; }
    .feature-icon { width: 44px; height: 44px; background: #E8272C; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0; }
    .feature-icon span { color: #ffffff; font-size: 22px; }
    .feature-text h4 { color: #1a1a1a; font-size: 15px; margin: 0 0 4px 0; font-weight: 600; }
    .feature-text p { color: #737373; font-size: 13px; margin: 0; }
    .stats-box { background: linear-gradient(135deg, #E8272C 0%, #F04E53 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .stats-box h3 { color: #ffffff; font-size: 36px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
    .stats-box p { color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0 0; font-weight: 500; }
    .job-card { border: 1px solid #e5e5e5; border-radius: 10px; padding: 20px; margin: 14px 0; transition: border-color 0.2s; }
    .job-card h4 { color: #1a1a1a; font-size: 17px; margin: 0 0 6px 0; font-weight: 600; }
    .job-card .company { color: #E8272C; font-size: 14px; margin: 0 0 6px 0; font-weight: 500; }
    .job-card .details { color: #737373; font-size: 13px; margin: 0; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .status-reviewed { background: #DBEAFE; color: #1D4ED8; }
    .status-shortlisted { background: #D1FAE5; color: #065F46; }
    .status-rejected { background: #FEE2E2; color: #991B1B; }
    .status-interview { background: #FEF3C7; color: #92400E; }
    .divider { height: 1px; background: #f0f0f0; margin: 28px 0; border: none; }
    .footer { background-color: #1a1a1a; padding: 32px; text-align: center; }
    .footer p { color: #a3a3a3; font-size: 13px; margin: 0 0 14px 0; line-height: 1.5; }
    .footer a { color: #F47275; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .social-links { margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #a3a3a3 !important; text-decoration: none; font-size: 13px; }
    .unsubscribe { color: #737373 !important; font-size: 11px; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
    .info-label { color: #737373; font-size: 13px; }
    .info-value { color: #1a1a1a; font-size: 13px; font-weight: 600; }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 28px 20px !important; }
      .header { padding: 28px 20px !important; }
      .footer { padding: 28px 20px !important; }
      .cta-button { display: block !important; text-align: center !important; }
      .cta-secondary { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa;">
  <!--[if mso]>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
  <tr><td>
  <![endif]-->
  <div class="container" style="max-width: 600px; margin: 0 auto;">
    ${content}
    <div class="footer">
      <p style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">jobs.al</p>
      <p style="margin-bottom: 20px;">Platforma #1 e punësimit në Shqipëri</p>
      <div class="social-links">
        <a href="https://facebook.com/jobs.al">Facebook</a> ·
        <a href="https://instagram.com/jobs.al">Instagram</a> ·
        <a href="https://linkedin.com/company/jobs-al">LinkedIn</a>
      </div>
      <p style="font-size: 11px; color: #737373; margin-top: 20px;">
        © ${new Date().getFullYear()} Jobs.al — Tiranë, Shqipëri<br>
        Të gjitha të drejtat e rezervuara.
      </p>
      <p style="margin-top: 12px;">
        <a href="${unsubscribeUrl}" class="unsubscribe">Çregjistrohu nga emailet</a>
      </p>
    </div>
  </div>
  <!--[if mso]>
  </td></tr></table>
  </td></tr></table>
  <![endif]-->
</body>
</html>`;
}

// ==================== EXISTING TEMPLATES ====================

function generateWelcomeEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🎉 Mirë se vini në Jobs.al!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Ju falënderojmë që u bashkuat me komunitetin tonë të punëkërkuesve! Jobs.al është platforma më e madhe e punësimit në Shqipëri, dhe jemi të lumtur t'ju kemi si anëtar.</p>
      
      <div class="stats-box">
        <h3>1,000+</h3>
        <p>Punëkërkues të suksesshëm na kanë besuar</p>
      </div>

      <div class="feature-box">
        <div class="feature-item">
          <div class="feature-icon"><span>🔍</span></div>
          <div class="feature-text">
            <h4>Kërko Punë</h4>
            <p>Zbulo qindra mundësi punësimi nga kompanitë më të mira në Shqipëri</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>📄</span></div>
          <div class="feature-text">
            <h4>Ndërto CV-në Tënde</h4>
            <p>Përdor ndërtuesin tonë të CV-së me AI për të krijuar një CV profesionale në minuta</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>🏢</span></div>
          <div class="feature-text">
            <h4>Ndiq Kompanitë</h4>
            <p>Qëndro i informuar për mundësitë e reja nga kompanitë që të interesojnë</p>
          </div>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/resume-builder" class="cta-button">Krijo CV-në Tënde Tani</a>
      </p>

      <p>Nëse keni pyetje, na kontaktoni në <a href="mailto:support@jobs.al">support@jobs.al</a></p>
      
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

function generateResumeReminder1(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>📄 CV-ja Juaj Po Pret!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Kemi vënë re që ende nuk keni ngarkuar apo krijuar CV-në tuaj në Jobs.al. Punëdhënësit janë duke kërkuar kandidatë si ju!</p>
      
      <div class="stats-box">
        <h3>3x</h3>
        <p>Më shumë përgjigje marrin përdoruesit me CV të plotësuar</p>
      </div>

      <p>Ndërtuesi ynë i CV-së me AI ju ndihmon të krijoni një CV profesionale në vetëm 5 minuta:</p>
      
      <div class="feature-box">
        <div class="feature-item">
          <div class="feature-icon"><span>✨</span></div>
          <div class="feature-text">
            <h4>Mbështetje nga AI</h4>
            <p>AI-ja jonë ju ndihmon të shkruani përshkrime profesionale</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>🎨</span></div>
          <div class="feature-text">
            <h4>Shabllone Profesionale</h4>
            <p>Zgjidhni nga shabllone moderne dhe elegante</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>📥</span></div>
          <div class="feature-text">
            <h4>Shkarko PDF</h4>
            <p>Eksportoni CV-në tuaj në formatin PDF me cilësi të lartë</p>
          </div>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/resume-builder" class="cta-button">Ndërto CV-në Tani</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">Ose nëse keni tashmë një CV, <a href="https://jobs.al/my-resumes">ngarkojeni këtu</a>.</p>
    </div>`;
  return wrapEmail(content);
}

function generateResumeReminder2(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🤔 A Jeni Ende Duke Kërkuar?</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Kemi vënë re që kaluan disa ditë që kur u regjistruat, por ende nuk keni CV në profilin tuaj. A mund t'ju ndihmojmë?</p>
      
      <div class="feature-box" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B;">
        <p style="margin: 0; color: #92400E; font-size: 16px;">
          💡 <strong>E dinit?</strong> Kandidatët me CV të plotësuar kanë 5x më shumë shanse të thirren në intervistë!
        </p>
      </div>

      <p>Nëse nuk dini nga të filloni, ndërtuesi ynë i CV-së me AI do t'ju udhëzojë hap pas hapi:</p>

      <ol style="color: #4b5563; line-height: 2;">
        <li>Plotësoni informacionet tuaja bazë</li>
        <li>AI-ja jonë ju sugjeron përshkrime profesionale</li>
        <li>Zgjidhni një shabllon elegant</li>
        <li>Shkarkoni CV-në në PDF</li>
      </ol>

      <p style="text-align: center;">
        <a href="https://jobs.al/resume-builder" class="cta-button">Fillo Tani - Është Falas!</a>
      </p>

      <p>Keni pyetje? Na shkruani në <a href="mailto:support@jobs.al">support@jobs.al</a></p>
    </div>`;
  return wrapEmail(content);
}

function generateFinalReminder(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🔍 Mundësi e Fundit!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Punëdhënësit po kërkojnë aktivisht kandidatë si ju, por pa një CV, ata nuk mund t'ju gjejnë!</p>
      
      <div class="stats-box">
        <h3>${data.newJobsCount || '50'}+</h3>
        <p>Punë të reja u postuan këtë javë në zonën tuaj</p>
      </div>

      <div class="feature-box" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border: 1px solid #EF4444;">
        <p style="margin: 0; color: #991B1B; font-size: 16px;">
          ⚠️ <strong>Mos humbni mundësitë!</strong> Krijimi i CV-së zgjat vetëm 5 minuta dhe është plotësisht falas.
        </p>
      </div>

      <p>Kjo është ajo çfarë marrin përdoruesit me CV:</p>
      
      <ul style="color: #4b5563; line-height: 2;">
        <li>✅ Shikohen nga punëdhënësit</li>
        <li>✅ Marrin rekomandime pune të personalizuara</li>
        <li>✅ Aplikojnë më shpejt për punë</li>
        <li>✅ Thirren në intervistë</li>
      </ul>

      <p style="text-align: center;">
        <a href="https://jobs.al/resume-builder" class="cta-button">Krijo CV-në në 5 Minuta</a>
      </p>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">Ky është emaili ynë i fundit kujtues. Shpresojmë t'ju shohim në platformë!</p>
    </div>`;
  return wrapEmail(content);
}

function generateWeeklyDigest(data: Record<string, string>): string {
  const jobs = data.jobs ? JSON.parse(data.jobs) : [];
  const jobCards = jobs.length > 0 ? jobs.map((job: any) => `
    <div class="job-card">
      <h4>${job.title}</h4>
      <p class="company">${job.company}</p>
      <p class="details">📍 ${job.location} • 💼 ${job.type}</p>
      <a href="https://jobs.al/jobs/${job.slug}" style="color: #E8272C; font-size: 14px;">Shiko Detajet →</a>
    </div>
  `).join('') : `
    <div class="job-card">
      <p>Vizitoni platformën për të parë mundësitë më të reja!</p>
    </div>
  `;

  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>💼 Përmbledhja Javore</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Këtu janë punët e reja që përputhen me profilin tuaj këtë javë:</p>
      
      ${jobCards}

      <p style="text-align: center;">
        <a href="https://jobs.al/jobs" class="cta-button">Shiko Të Gjitha Punët</a>
      </p>

      <div class="stats-box">
        <h3>${data.totalJobs || '100'}+</h3>
        <p>Punë aktive në platformë</p>
      </div>
    </div>`;
  return wrapEmail(content);
}

function generateApplicationConfirmation(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>✅ Aplikimi u Dërgua!</h1>
    </div>
    <div class="content">
      <h2>Urime${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Aplikimi juaj për pozicionin <strong>${data.jobTitle || 'Punë'}</strong> tek <strong>${data.company || 'Kompania'}</strong> u dërgua me sukses!</p>
      
      <div class="job-card">
        <h4>${data.jobTitle || 'Pozicioni'}</h4>
        <p class="company">${data.company || 'Kompania'}</p>
        <p class="details">📍 ${data.location || 'Tiranë'}</p>
      </div>

      <p><strong>Çfarë ndodh tani?</strong></p>
      <ol style="color: #4b5563; line-height: 2;">
        <li>Punëdhënësi do të shqyrtojë aplikimin tuaj</li>
        <li>Nëse jeni të përzgjedhur, do të kontaktoheni për intervistë</li>
        <li>Ndërkohë, vazhdoni të aplikoni për punë të tjera!</li>
      </ol>

      <p style="text-align: center;">
        <a href="https://jobs.al/candidate-dashboard" class="cta-button">Shiko Aplikimet e Mia</a>
      </p>

      <p>Suksese!</p>
    </div>`;
  return wrapEmail(content);
}

// ==================== NEW TEMPLATES ====================

function generateJobMatchEmail(data: Record<string, string>): string {
  const jobs = data.jobs ? JSON.parse(data.jobs) : [];
  const jobCards = jobs.map((job: any) => `
    <div class="job-card">
      <h4>${job.title}</h4>
      <p class="company">${job.company}</p>
      <p class="details">📍 ${job.location} • 💼 ${job.type}${job.matchScore ? ` • 🎯 ${job.matchScore}% përputhje` : ''}</p>
      <a href="https://jobs.al/jobs/${job.slug}" style="color: #E8272C; font-size: 14px;">Apliko Tani →</a>
    </div>
  `).join('');

  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🎯 Punë të Reja për Ju!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Kemi gjetur <strong>${data.matchCount || jobs.length} punë të reja</strong> që përputhen me aftësitë dhe përvojën tuaj. Shikoni mundësitë më poshtë:</p>
      
      ${jobCards || `
        <div class="job-card">
          <p>Vizitoni platformën për rekomandime të personalizuara!</p>
        </div>
      `}

      <p style="text-align: center;">
        <a href="https://jobs.al/recommended-jobs" class="cta-button">Shiko Të Gjitha Rekomandimet</a>
      </p>

      <div class="feature-box">
        <p style="margin: 0; color: #4b5563; font-size: 14px;">
          💡 <strong>Këshillë:</strong> Mbani CV-në tuaj të përditësuar për rekomandime më të sakta. <a href="https://jobs.al/my-resumes" style="color: #E8272C;">Përditëso CV-në →</a>
        </p>
      </div>
    </div>`;
  return wrapEmail(content);
}

function generateApplicationStatusEmail(data: Record<string, string>): string {
  const statusMap: Record<string, { label: string; class: string; emoji: string; message: string }> = {
    "reviewed": {
      label: "Shqyrtuar",
      class: "status-reviewed",
      emoji: "👀",
      message: "Aplikimi juaj është shqyrtuar nga punëdhënësi. Kjo do të thotë që CV-ja juaj ka tërhequr vëmendjen e tyre!"
    },
    "shortlisted": {
      label: "Listë e Shkurtër",
      class: "status-shortlisted",
      emoji: "⭐",
      message: "Urime! Jeni përzgjedhur në listën e shkurtër! Punëdhënësi mund t'ju kontaktojë së shpejti për hapin e ardhshëm."
    },
    "rejected": {
      label: "Refuzuar",
      class: "status-rejected",
      emoji: "📝",
      message: "Na vjen keq, por punëdhënësi ka vendosur të ecë përpara me kandidatë të tjerë. Mos u dekurajoni — ka shumë mundësi të tjera!"
    },
    "interview": {
      label: "Intervistë",
      class: "status-interview",
      emoji: "🗓️",
      message: "Punëdhënësi dëshiron t'ju takojë! Prisni kontakt për caktimin e intervistës."
    }
  };

  const status = statusMap[data.status || "reviewed"] || statusMap["reviewed"];

  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>${status.emoji} Përditësim Aplikimi</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      
      <div class="job-card" style="border-left: 4px solid #E8272C;">
        <h4>${data.jobTitle || 'Pozicioni'}</h4>
        <p class="company">${data.company || 'Kompania'}</p>
        <p class="details">📍 ${data.location || 'Tiranë'}</p>
        <div style="margin-top: 12px;">
          <span class="status-badge ${status.class}">${status.label}</span>
        </div>
      </div>

      <p>${status.message}</p>

      ${data.status === 'rejected' ? `
        <div class="stats-box">
          <h3>${data.newJobsCount || '50'}+</h3>
          <p>Punë aktive që përputhen me profilin tuaj</p>
        </div>
        <p style="text-align: center;">
          <a href="https://jobs.al/jobs" class="cta-button">Zbulo Punë të Reja</a>
        </p>
      ` : `
        <p style="text-align: center;">
          <a href="https://jobs.al/candidate-dashboard" class="cta-button">Shiko Aplikimet e Mia</a>
        </p>
      `}

      ${data.notes ? `
        <div class="feature-box">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">
            📝 <strong>Shënim nga punëdhënësi:</strong> ${data.notes}
          </p>
        </div>
      ` : ''}
    </div>`;
  return wrapEmail(content);
}

function generateProfileIncompleteEmail(data: Record<string, string>): string {
  const missingFields = (data.missingFields || 'telefon, vendndodhje, bio').split(',').map(f => f.trim());
  
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>✏️ Plotësoni Profilin Tuaj</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Kemi vënë re që profili juaj në Jobs.al nuk është plotësuar ende. Një profil i plotë ju ndihmon të dalloheni ndaj kandidatëve të tjerë!</p>
      
      <div class="feature-box" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B;">
        <p style="margin: 0; color: #92400E; font-size: 16px;">
          ⚡ <strong>Profili juaj është ${data.completionPercent || '40'}% i plotë.</strong> Plotësoni fushat e mbetura për përfitim maksimal!
        </p>
      </div>

      <p><strong>Fushat që mungojnë:</strong></p>
      <ul style="color: #4b5563; line-height: 2;">
        ${missingFields.map(f => `<li>❌ ${f}</li>`).join('')}
      </ul>

      <div class="feature-box">
        <div class="feature-item">
          <div class="feature-icon"><span>👁️</span></div>
          <div class="feature-text">
            <h4>Dukshmëri më e Lartë</h4>
            <p>Punëdhënësit preferojnë profile të plotësuara kur kërkojnë kandidatë</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>🎯</span></div>
          <div class="feature-text">
            <h4>Rekomandime më të Sakta</h4>
            <p>Ne mund t'ju sugjerojmë punë më të përshtatshme me informacion më të plotë</p>
          </div>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/candidate-dashboard" class="cta-button">Plotëso Profilin Tani</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">Zgjat vetëm 2 minuta!</p>
    </div>`;
  return wrapEmail(content);
}

function generateReactivationEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🚀 Na Keni Munguar!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Ka kaluar pak kohë që kur vizituat Jobs.al për herë të fundit. Shumë gjëra kanë ndryshuar dhe kemi mundësi të reja emocionuese për ju!</p>
      
      <div class="stats-box">
        <h3>${data.newJobsCount || '50'}+</h3>
        <p>Punë të reja u shtuan që nga vizita juaj e fundit</p>
      </div>

      <div class="feature-box">
        <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">🆕 Çfarë ka të re:</p>
        <ul style="color: #4b5563; line-height: 2; margin-top: 12px;">
          <li>📊 Kompani të reja kanë filluar të punësojnë</li>
          <li>🤖 Ndërtues i përmirësuar i CV-së me AI</li>
          <li>🎯 Rekomandime pune më të sakta</li>
          <li>💼 Kategori të reja punësh</li>
        </ul>
      </div>

      ${data.topCategories ? `
        <p><strong>Kategoritë më të kërkuara tani:</strong></p>
        <p style="color: #4b5563;">${data.topCategories}</p>
      ` : ''}

      <p style="text-align: center;">
        <a href="https://jobs.al/jobs" class="cta-button">Zbulo Punë të Reja</a>
      </p>

      <p style="text-align: center;">
        <a href="https://jobs.al/resume-builder" class="cta-secondary">Përditëso CV-në Tënde</a>
      </p>

      <p>Na kanë munguar! Shpresojmë t'ju shohim përsëri së shpejti.</p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

function generateEmployerWelcomeEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🏢 Mirë se Vini, Punëdhënës!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Ju falënderojmë që zgjodhët Jobs.al për rekrutimin tuaj! Platforma jonë ju lidh me mijëra punëkërkues të kualifikuar në Shqipëri.</p>
      
      <div class="stats-box">
        <h3>5,000+</h3>
        <p>Punëkërkues aktivë në platformë</p>
      </div>

      <p><strong>Hapat e ardhshëm për të filluar:</strong></p>

      <div class="feature-box">
        <div class="feature-item">
          <div class="feature-icon"><span>1️⃣</span></div>
          <div class="feature-text">
            <h4>Krijoni Profilin e Kompanisë</h4>
            <p>Shtoni logon, përshkrimin, dhe informacionin e kompanisë suaj</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>2️⃣</span></div>
          <div class="feature-text">
            <h4>Postoni Punën e Parë</h4>
            <p>Krijoni një shpallje pune dhe arrini mijëra kandidatë</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><span>3️⃣</span></div>
          <div class="feature-text">
            <h4>Menaxhoni Aplikanët</h4>
            <p>Përdorni panelin tonë ATS për të shqyrtuar dhe menaxhuar aplikimet</p>
          </div>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/setup-company" class="cta-button">Krijo Profilin e Kompanisë</a>
      </p>

      <div class="feature-box" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border: 1px solid #3B82F6;">
        <p style="margin: 0; color: #1E40AF; font-size: 14px;">
          💎 <strong>Këshillë Pro:</strong> Kompanitë me profil të plotë marrin 4x më shumë aplikime. Mos harroni të shtoni logon dhe përshkrimin!
        </p>
      </div>

      <p>Keni pyetje? Na kontaktoni në <a href="mailto:employers@jobs.al">employers@jobs.al</a></p>
      
      <p>Suksese me rekrutimin!<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

function generateJobExpiringEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>⏰ Puna Po Skadon!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Një punë që keni parë/ruajtur po skadon së shpejti. Mos e humbni mundësinë!</p>
      
      <div class="job-card" style="border-left: 4px solid #F59E0B; background: #FFFBEB;">
        <h4>${data.jobTitle || 'Pozicioni'}</h4>
        <p class="company">${data.company || 'Kompania'}</p>
        <p class="details">📍 ${data.location || 'Tiranë'} • 💼 ${data.jobType || 'Kohë e Plotë'}</p>
        ${data.salary ? `<p class="details">💰 ${data.salary}</p>` : ''}
        <div style="margin-top: 12px;">
          <span class="status-badge" style="background: #FEF3C7; color: #92400E;">⏰ Skadon për ${data.daysLeft || '3'} ditë</span>
        </div>
      </div>

      <div class="feature-box" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border: 1px solid #EF4444;">
        <p style="margin: 0; color: #991B1B; font-size: 16px;">
          ⚠️ <strong>Afati i aplikimit:</strong> ${data.deadline || 'Së shpejti'}. Aplikoni para se të jetë vonë!
        </p>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/jobs/${data.jobSlug || ''}" class="cta-button">Apliko Tani</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">Nuk jeni i interesuar? <a href="https://jobs.al/jobs" style="color: #E8272C;">Shikoni punë të tjera →</a></p>
    </div>`;
  return wrapEmail(content);
}

function generateNewApplicantEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>📨 Aplikant i Ri!</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje${data.employerName ? `, ${data.employerName}` : ''}!</h2>
      <p>Keni marrë një aplikim të ri për pozicionin tuaj në Jobs.al!</p>
      
      <div class="job-card" style="border-left: 4px solid #10B981;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">POZICIONI</p>
        <h4>${data.jobTitle || 'Pozicioni'}</h4>
        <p class="details">📍 ${data.location || 'Tiranë'}</p>
      </div>

      <div class="feature-box">
        <p style="margin: 0 0 12px 0; color: #1f2937; font-weight: 600;">👤 Detajet e Aplikantit:</p>
        <div class="info-row">
          <span class="info-label">Emri</span>
          <span class="info-value">${data.applicantName || 'Kandidati'}</span>
        </div>
        ${data.applicantEmail ? `
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${data.applicantEmail}</span>
        </div>
        ` : ''}
        ${data.matchScore ? `
        <div class="info-row">
          <span class="info-label">Përputhje AI</span>
          <span class="info-value">🎯 ${data.matchScore}%</span>
        </div>
        ` : ''}
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Data e Aplikimit</span>
          <span class="info-value">${data.appliedDate || new Date().toLocaleDateString('sq-AL')}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-dashboard" class="cta-button">Shqyrto Aplikimin</a>
      </p>

      <div class="stats-box">
        <h3>${data.totalApplications || '1'}</h3>
        <p>Aplikime gjithsej për këtë pozicion</p>
      </div>
    </div>`;
  return wrapEmail(content);
}

function generateInterviewScheduledEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🗓️ Intervistë e Konfirmuar!</h1>
    </div>
    <div class="content">
      <h2>Urime${data.name ? `, ${data.name}` : ''}!</h2>
      <p>Intervista juaj është caktuar! Ja detajet:</p>
      
      <div class="feature-box" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border: 2px solid #3B82F6;">
        <div class="info-row">
          <span class="info-label">Kompania</span>
          <span class="info-value">${data.company || 'Kompania'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Pozicioni</span>
          <span class="info-value">${data.jobTitle || 'Pozicioni'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Data</span>
          <span class="info-value">${data.interviewDate || 'Do të konfirmohet'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🕐 Ora</span>
          <span class="info-value">${data.interviewTime || 'Do të konfirmohet'}</span>
        </div>
        ${data.interviewLocation ? `
        <div class="info-row">
          <span class="info-label">📍 Vendndodhja</span>
          <span class="info-value">${data.interviewLocation}</span>
        </div>
        ` : ''}
        ${data.interviewType ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Tipi</span>
          <span class="info-value">${data.interviewType === 'online' ? '💻 Online' : '🏢 Në Person'}</span>
        </div>
        ` : ''}
        ${data.meetingLink ? `
        <div style="margin-top: 16px; text-align: center;">
          <a href="${data.meetingLink}" class="cta-button" style="margin: 0;">Hyr në Meeting</a>
        </div>
        ` : ''}
      </div>

      ${data.interviewNotes ? `
        <div class="feature-box">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">
            📝 <strong>Shënime nga punëdhënësi:</strong> ${data.interviewNotes}
          </p>
        </div>
      ` : ''}

      <p><strong>Këshilla për përgatitje:</strong></p>
      <ul style="color: #4b5563; line-height: 2;">
        <li>🔍 Hulumtoni kompaninë ${data.company || ''} para intervistës</li>
        <li>📄 Rishikoni CV-në tuaj dhe përvojën tuaj</li>
        <li>👔 Vishuni profesionalisht</li>
        <li>⏰ Shkoni 10 minuta para kohës</li>
      </ul>

      <p style="text-align: center;">
        <a href="https://jobs.al/candidate-dashboard" class="cta-button">Shiko Aplikimet e Mia</a>
      </p>

      <p>Suksese me intervistën!</p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== ROLE UPGRADE EMPLOYER TEMPLATE ====================

function generateRoleUpgradeEmployerEmail(data: Record<string, string>): string {
  const content = `
    <div class="content">
      <h2>Urime, ${data.name || 'Përdoruesi'}! 🎉</h2>
      <p>Llogaria juaj në Jobs.al u përditësua me sukses. Tani jeni regjistruar si <strong>Punëdhënës</strong>!</p>
      
      <div class="feature-box">
        <p style="margin: 0 0 16px 0; font-weight: 600; color: #1f2937; font-size: 18px;">🏢 Çfarë mund të bëni tani:</p>
        <ul style="color: #4b5563; line-height: 2.2; padding-left: 20px; margin: 0;">
          <li>📝 <strong>Postoni punë</strong> – Krijoni njoftim pune dhe gjeni kandidatët idealë</li>
          <li>🏗️ <strong>Krijoni profilin e kompanisë</strong> – Ndërtoni faqen tuaj të kompanisë</li>
          <li>📊 <strong>Shikoni analitikë</strong> – Ndiqni performancën e njoftimeve tuaja</li>
          <li>🤖 <strong>AI Matching</strong> – Sistemi ynë do t'ju rekomandojë kandidatët më të mirë</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/setup-company" class="cta-button">Konfiguro Kompaninë</a>
      </p>

      <p style="text-align: center; margin-top: 8px;">
        <a href="https://jobs.al/employer-dashboard" class="cta-secondary">Hyr në Panelin e Punëdhënësit</a>
      </p>

      <p>Nëse keni pyetje ose keni nevojë për ndihmë, na shkruani në <a href="mailto:support@jobs.al" style="color: #E8272C;">support@jobs.al</a>.</p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== RESUME UPLOAD REMINDER TEMPLATE ====================

function generateResumeUploadReminderEmail(data: Record<string, string>): string {
  const content = `
    <div class="content">
      <h2>Përshëndetje, ${data.name || 'Përdoruesi'}! 👋</h2>
      <p>Kemi vëne re që nuk keni ngarkuar ende një CV në llogarinë tuaj në Jobs.al. Ngarkimi i CV-së bën procesin e aplikimit shumë më të shpejtë!</p>
      
      <div class="feature-box">
        <p style="margin: 0 0 16px 0; font-weight: 600; color: #1f2937; font-size: 18px;">📎 Pse duhet të ngarkoni CV-në?</p>
        <ul style="color: #4b5563; line-height: 2.2; padding-left: 20px; margin: 0;">
          <li>⚡ <strong>Aplikoni me 1 klik</strong> – Nuk ju duhet të plotësoni formularë çdo herë</li>
          <li>🎯 <strong>AI Matching</strong> – Sistemi ynë analizon CV-në dhe ju rekomandon punë</li>
          <li>👀 <strong>Punëdhënësit ju shohin</strong> – CV juaj bëhet e dukshme për punëdhënësit</li>
          <li>📊 <strong>Match Score</strong> – Merrni vlerësim automatik për çdo punë</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/my-resumes" class="cta-button">Ngarko CV-në Tani</a>
      </p>

      <p style="text-align: center; margin-top: 8px;">
        <a href="https://jobs.al/resume-builder" class="cta-secondary">Ose Krijo CV me AI 🤖</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">💡 <strong>Këshillë:</strong> Mund të ngarkoni CV në format PDF ose Word, ose të përdorni Resume Builder-in tonë me AI për të krijuar një CV profesionale.</p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== SUBSCRIPTION RENEWAL TEMPLATE ====================

function generateSubscriptionRenewalEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🔄 Abonimi juaj po rinovohet</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje, ${data.name || 'Punëdhënës'}!</h2>
      <p>Dëshirojmë t'ju njoftojmë që abonimi juaj <strong>"${data.planName || 'Pro'}"</strong> do të rinovohet automatikisht për <strong>${data.daysLeft || '7'} ditë</strong>.</p>

      <div class="feature-box">
        <div class="info-row">
          <span class="info-label">Plani</span>
          <span class="info-value">${data.planName || 'Pro'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data e rinovimit</span>
          <span class="info-value">${data.renewalDate || 'Së shpejti'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Shuma</span>
          <span class="info-value">${data.amount || '€0'} / ${data.period || 'muaj'}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Metoda e pagesës</span>
          <span class="info-value">${data.paymentMethod || 'Kartë krediti'}</span>
        </div>
      </div>

      <p>Nëse dëshironi të ndryshoni ose anuloni abonimin, mund ta bëni para datës së rinovimit.</p>

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-subscription" class="cta-button">Menaxho Abonimin</a>
      </p>

      <p style="color: #737373; font-size: 13px;">💡 Keni pyetje rreth faturimit? Na kontaktoni në <a href="mailto:billing@jobs.al" style="color: #E8272C;">billing@jobs.al</a></p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== SUBSCRIPTION EXPIRED TEMPLATE ====================

function generateSubscriptionExpiredEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>⚠️ Abonimi juaj ka skaduar</h1>
    </div>
    <div class="content">
      <h2>${data.name || 'Punëdhënës'}, abonimi juaj përfundoi</h2>
      <p>Plani juaj <strong>"${data.planName || 'Pro'}"</strong> ka skaduar më <strong>${data.expiredDate || 'ditën e fundit'}</strong>. Pa abonim aktiv, nuk do të keni akses në këto veçori:</p>

      <div class="feature-box">
        <ul style="color: #525252; line-height: 2.2; padding-left: 20px; margin: 0;">
          <li>❌ Postimi i njoftimeve të reja të punës</li>
          <li>❌ Aksesi në ATS (Sistemi i Ndjekjes së Aplikimeve)</li>
          <li>❌ Shikimi i CV-ve të kandidatëve</li>
          <li>❌ Analitika e avancuar e njoftimeve</li>
        </ul>
      </div>

      <div class="stats-box">
        <h3>${data.activeJobsCount || '0'}</h3>
        <p>Njoftimet tuaja aktive do të çaktivizohen</p>
      </div>

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-subscription" class="cta-button">Rinovo Abonimin Tani</a>
      </p>
      <p style="text-align: center;">
        <a href="https://jobs.al/pricing" class="cta-secondary">Shiko Planet e Disponueshme</a>
      </p>

      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== PAYMENT RECEIPT TEMPLATE ====================

function generatePaymentReceiptEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>✅ Pagesa u konfirmua</h1>
    </div>
    <div class="content">
      <h2>Faleminderit, ${data.name || 'Punëdhënës'}!</h2>
      <p>Pagesa juaj u procesua me sukses. Më poshtë gjeni detajet e faturës.</p>

      <div class="feature-box" style="background: #F0FDF4; border-color: #BBF7D0;">
        <div class="info-row">
          <span class="info-label">Nr. Faturës</span>
          <span class="info-value">#${data.invoiceNumber || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data</span>
          <span class="info-value">${data.paymentDate || new Date().toLocaleDateString('sq-AL')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Përshkrimi</span>
          <span class="info-value">${data.description || 'Abonim Jobs.al'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metoda</span>
          <span class="info-value">${data.paymentMethod || 'Kartë'}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label" style="font-size: 16px; font-weight: 700; color: #1a1a1a;">Totali</span>
          <span class="info-value" style="font-size: 18px; color: #059669;">${data.amount || '€0'}</span>
        </div>
      </div>

      ${data.pdfUrl ? `
      <p style="text-align: center;">
        <a href="${data.pdfUrl}" class="cta-button">📄 Shkarko Faturën PDF</a>
      </p>
      ` : ''}

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-billing" class="cta-secondary">Shiko Historinë e Pagesave</a>
      </p>

      <p style="color: #737373; font-size: 13px;">Kjo faturë u gjenerua automatikisht. Për pyetje: <a href="mailto:billing@jobs.al" style="color: #E8272C;">billing@jobs.al</a></p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== PAYMENT FAILED TEMPLATE ====================

function generatePaymentFailedEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>❌ Pagesa nuk u krye</h1>
    </div>
    <div class="content">
      <h2>${data.name || 'Punëdhënës'}, pagesa juaj dështoi</h2>
      <p>Kemi provuar të procesojmë pagesën për <strong>"${data.planName || 'abonimin tuaj'}"</strong>, por transaksioni nuk u pranua.</p>

      <div class="feature-box" style="background: #FEF2F2; border-color: #FECACA;">
        <div class="info-row">
          <span class="info-label">Shuma</span>
          <span class="info-value">${data.amount || '€0'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Arsyeja</span>
          <span class="info-value" style="color: #DC2626;">${data.failureReason || 'Karta u refuzua'}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Provat</span>
          <span class="info-value">${data.attemptCount || '1'} / 3</span>
        </div>
      </div>

      <p>⏳ Do të provojmë pagesën automatikisht edhe <strong>${data.retriesLeft || '2'} herë</strong> në ditët e ardhshme. Për të shmangur ndërprerjen e shërbimit, ju lutemi përditësoni metodën e pagesës.</p>

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-billing" class="cta-button">Përditëso Metodën e Pagesës</a>
      </p>

      <p style="color: #737373; font-size: 13px;">Nëse keni pyetje, na kontaktoni: <a href="mailto:billing@jobs.al" style="color: #E8272C;">billing@jobs.al</a></p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== AD PERFORMANCE WEEKLY TEMPLATE ====================

function generateAdPerformanceWeeklyEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>📊 Raporti Javor i Reklamës</h1>
    </div>
    <div class="content">
      <h2>Përshëndetje, ${data.name || 'Punëdhënës'}!</h2>
      <p>Ja si performoi reklama juaj <strong>"${data.adTitle || 'Njoftimi'}"</strong> këtë javë (${data.weekRange || 'javën e kaluar'}):</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td style="width: 33%; padding: 8px;">
            <div style="background: linear-gradient(135deg, #E8272C 0%, #F04E53 100%); border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #fff; font-size: 28px; font-weight: 800; margin: 0;">${data.impressions || '0'}</p>
              <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 4px 0 0 0;">Shfaqje</p>
            </div>
          </td>
          <td style="width: 33%; padding: 8px;">
            <div style="background: linear-gradient(135deg, #E8272C 0%, #F04E53 100%); border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #fff; font-size: 28px; font-weight: 800; margin: 0;">${data.clicks || '0'}</p>
              <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 4px 0 0 0;">Klikime</p>
            </div>
          </td>
          <td style="width: 33%; padding: 8px;">
            <div style="background: linear-gradient(135deg, #E8272C 0%, #F04E53 100%); border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #fff; font-size: 28px; font-weight: 800; margin: 0;">${data.applications || '0'}</p>
              <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 4px 0 0 0;">Aplikime</p>
            </div>
          </td>
        </tr>
      </table>

      <div class="feature-box">
        <div class="info-row">
          <span class="info-label">CTR (Click-Through Rate)</span>
          <span class="info-value">${data.ctr || '0%'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kosto për Aplikim</span>
          <span class="info-value">${data.costPerApplication || '€0'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ditë të mbetura</span>
          <span class="info-value">${data.daysRemaining || '0'} ditë</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label">Buxheti i shpenzuar</span>
          <span class="info-value">${data.budgetSpent || '€0'} / ${data.budgetTotal || '€0'}</span>
        </div>
      </div>

      ${data.recommendation ? `
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">💡 <strong>Rekomandim:</strong> ${data.recommendation}</p>
      </div>
      ` : ''}

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-analytics" class="cta-button">Shiko Analitikën e Plotë</a>
      </p>
      <p style="text-align: center;">
        <a href="https://jobs.al/employer-ads" class="cta-secondary">Menaxho Reklamat</a>
      </p>

      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== INVOICE OVERDUE TEMPLATE ====================

function generateInvoiceOverdueEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
      <p class="header-logo">jobs<span>.al</span></p>
      <h1>🔴 Fatura ka kaluar afatin</h1>
    </div>
    <div class="content">
      <h2>${data.name || 'Punëdhënës'}, keni një faturë të papaguar</h2>
      <p>Fatura <strong>#${data.invoiceNumber || '—'}</strong> ka kaluar afatin e pagesës prej <strong>${data.daysOverdue || '0'} ditësh</strong>. Ju lutemi kryeni pagesën sa më shpejt për të shmangur ndërprerjen e shërbimeve.</p>

      <div class="feature-box" style="background: #FEF2F2; border-color: #FECACA;">
        <div class="info-row">
          <span class="info-label">Nr. Faturës</span>
          <span class="info-value">#${data.invoiceNumber || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data e lëshimit</span>
          <span class="info-value">${data.issueDate || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Afati i pagesës</span>
          <span class="info-value" style="color: #DC2626;">${data.dueDate || '—'} (${data.daysOverdue || '0'} ditë me vonesë)</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="info-label" style="font-size: 16px; font-weight: 700; color: #1a1a1a;">Shuma e papaguar</span>
          <span class="info-value" style="font-size: 18px; color: #DC2626;">${data.amount || '€0'}</span>
        </div>
      </div>

      <p>⚠️ Nëse pagesa nuk kryhet brenda <strong>${data.gracePeriodDays || '7'} ditëve</strong>, njoftimet tuaja aktive dhe aksesi në panelin e punëdhënësit do të pezullohen.</p>

      <p style="text-align: center;">
        <a href="https://jobs.al/employer-billing" class="cta-button">Paguaj Faturën Tani</a>
      </p>

      ${data.pdfUrl ? `
      <p style="text-align: center;">
        <a href="${data.pdfUrl}" class="cta-secondary">📄 Shkarko Faturën PDF</a>
      </p>
      ` : ''}

      <p style="color: #737373; font-size: 13px;">Nëse keni kryer pagesën tashmë, ju lutemi injorojeni këtë email. Për çdo pyetje: <a href="mailto:billing@jobs.al" style="color: #E8272C;">billing@jobs.al</a></p>
      <p>Me respekt,<br><strong>Ekipi i Jobs.al</strong></p>
    </div>`;
  return wrapEmail(content);
}

// ==================== MAIN HANDLER ====================

interface SendEmailRequest {
  to: string;
  templateSlug: string;
  data?: Record<string, string>;
  userId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, templateSlug, data = {}, userId }: SendEmailRequest = await req.json();

    if (!to || !templateSlug) {
      throw new Error("Missing required fields: to, templateSlug");
    }

    // Get email template
    const template = getEmailTemplate(templateSlug, data);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Jobs.al <info@jobs.al>",
      to: [to],
      subject: template.subject,
      html: template.html,
    });

    const didFail = !!emailResponse.error;
    if (didFail) {
      console.error("Resend send failed:", emailResponse.error);
    } else {
      console.log("Email sent successfully:", emailResponse.data?.id);
    }

    // Log the email (accurate status)
    const { error: logError } = await supabase.from("email_logs").insert({
      user_id: userId || null,
      template_slug: templateSlug,
      email_to: to,
      subject: template.subject,
      status: didFail ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      error_message: emailResponse.error?.message || null,
      metadata: data,
    });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: !didFail,
        data: emailResponse.data,
        error: emailResponse.error?.message || null,
      }),
      {
        status: didFail ? 502 : 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
