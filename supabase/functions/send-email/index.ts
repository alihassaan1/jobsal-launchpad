import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    }
  };

  return templates[templateSlug] || templates["welcome"];
}

// Base email wrapper
function wrapEmail(content: string, unsubscribeUrl: string = "https://jobs.al/settings"): string {
  return `
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jobs.al</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 16px 0 0 0; font-weight: 700; }
    .content { padding: 40px 32px; }
    .content h2 { color: #1f2937; font-size: 24px; margin: 0 0 16px 0; }
    .content p { color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .cta-button:hover { opacity: 0.9; }
    .feature-box { background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .feature-item { display: flex; align-items: flex-start; margin: 16px 0; }
    .feature-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; }
    .feature-icon span { color: #ffffff; font-size: 24px; }
    .feature-text h4 { color: #1f2937; font-size: 16px; margin: 0 0 4px 0; font-weight: 600; }
    .feature-text p { color: #6b7280; font-size: 14px; margin: 0; }
    .stats-box { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .stats-box h3 { color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; }
    .stats-box p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; }
    .job-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .job-card h4 { color: #1f2937; font-size: 18px; margin: 0 0 8px 0; }
    .job-card .company { color: #4F46E5; font-size: 14px; margin: 0 0 8px 0; }
    .job-card .details { color: #6b7280; font-size: 14px; margin: 0; }
    .footer { background-color: #1f2937; padding: 32px; text-align: center; }
    .footer p { color: #9ca3af; font-size: 14px; margin: 0 0 16px 0; }
    .footer a { color: #a5b4fc; text-decoration: none; }
    .social-links { margin: 24px 0; }
    .social-links a { display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; }
    .unsubscribe { color: #6b7280 !important; font-size: 12px; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
      .header { padding: 24px 16px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p><strong style="color: #ffffff;">Jobs.al</strong> - Platforma #1 e punësimit në Shqipëri</p>
      <div class="social-links">
        <a href="https://facebook.com/jobs.al">Facebook</a> •
        <a href="https://instagram.com/jobs.al">Instagram</a> •
        <a href="https://linkedin.com/company/jobs-al">LinkedIn</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        © 2024 Jobs.al. Të gjitha të drejtat e rezervuara.<br>
        Tiranë, Shqipëri
      </p>
      <p>
        <a href="${unsubscribeUrl}" class="unsubscribe">Çregjistrohu nga emailet</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateWelcomeEmail(data: Record<string, string>): string {
  const content = `
    <div class="header">
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
      <a href="https://jobs.al/jobs/${job.slug}" style="color: #4F46E5; font-size: 14px;">Shiko Detajet →</a>
    </div>
  `).join('') : `
    <div class="job-card">
      <p>Vizitoni platformën për të parë mundësitë më të reja!</p>
    </div>
  `;

  const content = `
    <div class="header">
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

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    const { error: logError } = await supabase.from("email_logs").insert({
      user_id: userId || null,
      template_slug: templateSlug,
      email_to: to,
      subject: template.subject,
      status: emailResponse.error ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      error_message: emailResponse.error?.message || null,
      metadata: data,
    });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
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