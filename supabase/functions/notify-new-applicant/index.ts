import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2.119.0/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const Body = z.object({ applicationId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "A valid application is required" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await admin.auth.getUser(authorization.slice(7));
    if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

    const { data: application, error: applicationError } = await admin
      .from("applications")
      .select("id, job_id, applicant_id, created_at, jobs(title, location)")
      .eq("id", parsed.data.applicationId)
      .eq("applicant_id", user.id)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return json({ error: "Application not found" }, 404);

    const deliveryKey = `application:${application.id}`;
    const { data: duplicate } = await admin.from("email_logs")
      .select("id")
      .eq("template_slug", "new-applicant")
      .eq("metadata->>delivery_key", deliveryKey)
      .limit(1);
    if (duplicate?.length) return json({ success: true, notified: false });

    const [{ data: contact, error: contactError }, { data: applicant }, { count: totalApplications }] = await Promise.all([
      admin.rpc("get_job_employer_contact", { _job_id: application.job_id }),
      admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      admin.from("applications").select("id", { count: "exact", head: true }).eq("job_id", application.job_id),
    ]);
    if (contactError) throw contactError;
    const employer = Array.isArray(contact) ? contact[0] : contact;
    if (!employer?.employer_email) return json({ success: true, notified: false });

    const response = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
      body: JSON.stringify({
        to: employer.employer_email,
        templateSlug: "new-applicant",
        userId: employer.owner_id,
        data: {
          delivery_key: deliveryKey,
          employerName: employer.employer_name || "",
          jobTitle: employer.job_title || application.jobs?.title || "",
          location: application.jobs?.location || "",
          applicantName: applicant?.full_name || "Kandidat",
          applicantEmail: applicant?.email || "",
          appliedDate: new Date(application.created_at).toLocaleDateString("sq-AL"),
          totalApplications: String(totalApplications || 1),
        },
      }),
    });
    if (!response.ok) return json({ error: "Notification could not be sent" }, 502);
    return json({ success: true, notified: true });
  } catch (error) {
    console.error("New applicant notification failed", error);
    return json({ error: "Notification could not be sent" }, 500);
  }
});
