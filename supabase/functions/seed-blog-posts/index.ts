import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if posts already exist
    const { data: existingPosts } = await supabaseClient
      .from('posts')
      .select('id')
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Sample posts already exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first admin user
    const { data: adminRole } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminRole) {
      throw new Error('No admin user found');
    }

    const samplePosts = [
      {
        title: '10 Essential Resume Tips to Land Your Dream Job in 2025',
        slug: '10-essential-resume-tips-2025',
        content: `<h2>Make Your Resume Stand Out</h2>
<p>Your resume is your first impression with potential employers. Here are 10 proven tips to make it count:</p>

<h3>1. Tailor Your Resume to Each Job</h3>
<p>Don't send the same generic resume to every employer. Customize your resume for each position by highlighting relevant skills and experiences that match the job description.</p>

<h3>2. Use Action Verbs</h3>
<p>Start your bullet points with strong action verbs like "achieved," "implemented," "developed," or "managed" to demonstrate your impact.</p>

<h3>3. Quantify Your Achievements</h3>
<p>Numbers speak louder than words. Instead of saying "improved sales," say "increased sales by 35% in 6 months."</p>

<h3>4. Keep It Concise</h3>
<p>Aim for one page if you have less than 10 years of experience. Two pages maximum for senior professionals.</p>

<h3>5. Use Professional Formatting</h3>
<p>Choose a clean, ATS-friendly template. Avoid graphics, photos, or complex formatting that might confuse applicant tracking systems.</p>

<h3>6. Include Keywords</h3>
<p>Use industry-specific keywords from the job posting to pass ATS screening and show you're qualified.</p>

<h3>7. Highlight Relevant Skills</h3>
<p>Create a dedicated skills section with both hard and soft skills relevant to your target role.</p>

<h3>8. Proofread Carefully</h3>
<p>Typos and grammatical errors can instantly disqualify you. Use spell-check and have someone else review your resume.</p>

<h3>9. Add a Professional Summary</h3>
<p>Write a compelling 2-3 sentence summary at the top that showcases your value proposition.</p>

<h3>10. Keep It Updated</h3>
<p>Regularly update your resume with new skills, certifications, and achievements even when you're not actively job hunting.</p>

<p><strong>Ready to create your perfect resume?</strong> Try our <a href="/ai-resume-builder">AI-powered resume builder</a> to get started in minutes!</p>`,
        excerpt: 'Discover the top 10 resume writing strategies that will help you stand out from the competition and land more interviews in 2025.',
        featured_image: 'https://jobs.al/assets/blog-resume-tips.jpg',
        category: 'Resume Tips',
        tags: ['resume', 'cv', 'job search', 'career advice', 'interview'],
        language: 'en',
        author_id: adminRole.user_id,
        is_published: true,
        published_at: new Date().toISOString(),
        meta_title: '10 Essential Resume Tips to Land Your Dream Job in 2025',
        meta_description: 'Expert resume writing tips to help you stand out. Learn how to create an ATS-friendly CV that gets you more interviews.'
      },
      {
        title: 'The Albanian Job Market in 2025: Trends and Opportunities',
        slug: 'albanian-job-market-2025-trends',
        content: `<h2>Understanding the Albanian Employment Landscape</h2>
<p>Albania's job market is experiencing significant transformation in 2025. Here's what you need to know:</p>

<h3>Growing Sectors</h3>
<p>The IT and technology sector continues to lead job growth, with a 25% increase in tech positions compared to last year. Tourism and hospitality are also rebounding strongly post-pandemic.</p>

<h3>Remote Work Revolution</h3>
<p>Over 40% of Albanian companies now offer remote or hybrid work options, opening up opportunities for professionals across the country.</p>

<h3>Skills in Demand</h3>
<ul>
<li>Software Development (React, Node.js, Python)</li>
<li>Digital Marketing</li>
<li>Data Analysis</li>
<li>Project Management</li>
<li>English Language Proficiency</li>
</ul>

<h3>Salary Trends</h3>
<p>Average salaries in Tirana have increased by 15% year-over-year, with tech professionals earning between €1,500-€3,000 monthly.</p>

<h3>Top Employers</h3>
<p>International companies continue to expand their presence in Albania, creating high-quality job opportunities with competitive benefits.</p>

<h3>Tips for Job Seekers</h3>
<ol>
<li>Build your online presence on LinkedIn and Jobs.al</li>
<li>Invest in continuous learning and certifications</li>
<li>Network actively in professional communities</li>
<li>Consider remote opportunities with international companies</li>
</ol>

<p>Stay ahead of the curve by regularly checking <a href="/jobs">new job postings on Jobs.al</a>!</p>`,
        excerpt: 'Explore the latest trends, growing sectors, and opportunities in Albania\'s evolving job market for 2025.',
        featured_image: 'https://jobs.al/assets/blog-career-albania.jpg',
        category: 'Job Market',
        tags: ['albania', 'job market', 'employment trends', 'career', 'tirana'],
        language: 'en',
        author_id: adminRole.user_id,
        is_published: true,
        published_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        meta_title: 'Albanian Job Market 2025: Trends, Salaries & Opportunities',
        meta_description: 'Complete guide to Albania\'s job market in 2025. Discover growing sectors, salary trends, and top opportunities for professionals.'
      },
      {
        title: 'Si të shkruani një CV të përsosur në shqip - Udhëzues i plotë',
        slug: 'si-te-shkruani-cv-ne-shqip',
        content: `<h2>Hapat për një CV profesionale</h2>
<p>Krijimi i një CV të mirë është hapi i parë drejt karrierës së suksesshme. Ja si ta bëni atë:</p>

<h3>1. Informacioni Personal</h3>
<p>Përfshini emrin e plotë, numrin e telefonit, email-in profesional dhe profilin në LinkedIn.</p>

<h3>2. Përmbledhja Profesionale</h3>
<p>Shkruani 2-3 fjali që përshkruajnë përvojën tuaj dhe objektivat profesionale.</p>

<h3>3. Përvoja e Punës</h3>
<p>Listoni punët tuaja në rendin kronologjik të kundërt (nga më e fundit). Për çdo pozicion, përfshini:</p>
<ul>
<li>Emrin e kompanisë dhe pozicionin</li>
<li>Periudhën e punësimit</li>
<li>3-5 arritje kryesore me numra konkretë</li>
</ul>

<h3>4. Arsimi</h3>
<p>Përmendni diplomën tuaj, institucionin dhe vitin e diplomimit.</p>

<h3>5. Aftësitë</h3>
<p>Listoni aftësitë teknike dhe personale që janë relevante për pozicionin.</p>

<h3>6. Gjuhët</h3>
<p>Specifikoni nivelin e njohurive (bazë, i mesëm, i avancuar, amtare).</p>

<h3>Këshilla të Rëndësishme:</h3>
<ul>
<li>Mbajeni CV-në në 1-2 faqe</li>
<li>Përdorni font profesional (Arial, Calibri)</li>
<li>Kontrolloni për gabime drejtshkrimore</li>
<li>Përshtateni CV-në për çdo pozicion</li>
</ul>

<p><strong>Dëshironi të krijoni një CV profesionale shpejt?</strong> Provoni <a href="/resume-builder-al">ndërtuesin tonë të CV-ve me AI</a>!</p>`,
        excerpt: 'Mësoni si të shkruani një CV profesionale në gjuhën shqipe që tërheq vëmendjen e punëdhënësve dhe rrit shanset tuaja për sukses.',
        featured_image: 'https://jobs.al/assets/blog-resume-tips.jpg',
        category: 'Këshilla Karriere',
        tags: ['CV', 'punë', 'karrierë', 'shqipëri', 'aplikim'],
        language: 'al',
        author_id: adminRole.user_id,
        is_published: true,
        published_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        meta_title: 'Si të shkruani një CV të përsosur në shqip | Jobs.al',
        meta_description: 'Udhëzues i plotë për të shkruar një CV profesionale në shqip. Këshilla, shembuj dhe strategji për sukses në aplikim.'
      },
      {
        title: 'How to Ace Your Job Interview: Expert Tips from Albanian Recruiters',
        slug: 'ace-job-interview-tips-albania',
        content: `<h2>Master Your Next Interview</h2>
<p>Job interviews can be nerve-wracking, but with the right preparation, you can significantly increase your chances of success.</p>

<h3>Before the Interview</h3>
<h4>Research the Company</h4>
<p>Spend time understanding the company's mission, values, recent news, and culture. This shows genuine interest and helps you prepare relevant questions.</p>

<h4>Prepare Your Stories</h4>
<p>Use the STAR method (Situation, Task, Action, Result) to prepare examples of your achievements and problem-solving abilities.</p>

<h4>Dress Appropriately</h4>
<p>Business professional is usually safe. When in doubt, it's better to be slightly overdressed than underdressed.</p>

<h3>During the Interview</h3>
<h4>Make a Strong First Impression</h4>
<ul>
<li>Arrive 10-15 minutes early</li>
<li>Offer a firm handshake</li>
<li>Make eye contact</li>
<li>Smile and be enthusiastic</li>
</ul>

<h4>Answer Effectively</h4>
<p>Listen carefully to each question, take a moment to think, and provide structured, concise answers with specific examples.</p>

<h4>Ask Thoughtful Questions</h4>
<p>Prepare 3-5 questions about the role, team, company culture, and growth opportunities. This shows your interest and helps you evaluate if it's the right fit.</p>

<h3>Common Interview Questions in Albania</h3>
<ul>
<li>Tell me about yourself</li>
<li>Why do you want to work here?</li>
<li>What are your salary expectations?</li>
<li>Where do you see yourself in 5 years?</li>
<li>Why should we hire you?</li>
</ul>

<h3>After the Interview</h3>
<p>Send a thank-you email within 24 hours, reiterating your interest and highlighting key points from the conversation.</p>

<p>Ready to start your job search? <a href="/jobs">Browse thousands of opportunities on Jobs.al</a>!</p>`,
        excerpt: 'Learn proven strategies to excel in job interviews, including preparation tips, common questions, and expert advice from Albanian recruiters.',
        featured_image: 'https://jobs.al/assets/blog-job-search.jpg',
        category: 'Interview Tips',
        tags: ['interview', 'job search', 'career advice', 'hiring', 'preparation'],
        language: 'en',
        author_id: adminRole.user_id,
        is_published: true,
        published_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        meta_title: 'How to Ace Your Job Interview: Expert Tips | Jobs.al',
        meta_description: 'Master your next job interview with expert tips from Albanian recruiters. Learn preparation strategies and common questions.'
      }
    ];

    const { data, error } = await supabaseClient
      .from('posts')
      .insert(samplePosts);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        message: 'Sample blog posts created successfully',
        count: samplePosts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
