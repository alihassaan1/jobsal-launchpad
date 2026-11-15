import { assert, assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { isJobsAlUrl, sanitizeEmailData } from "./emailSecurity.ts";

Deno.test("email data escapes every HTML value", () => {
  const safe = sanitizeEmailData({
    name: '<img src=x onerror="alert(1)">',
    jobTitle: "<script>alert(1)</script>",
    companyName: "A & B",
  });
  assertEquals(safe.name, "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assertEquals(safe.jobTitle, "&lt;script&gt;alert(1)&lt;/script&gt;");
  assertEquals(safe.companyName, "A &amp; B");
});

Deno.test("only direct Jobs.al HTTPS links survive", () => {
  const safe = sanitizeEmailData({
    confirmationUrl: "https://jobs.al/auth/confirm?token_hash=abc&type=signup",
    meetingLink: "https://jobs.al.evil.example/phish",
    pdfUrl: "javascript:alert(1)",
  });
  assert(safe.confirmationUrl.startsWith("https://jobs.al/"));
  assertEquals(safe.meetingLink, "");
  assertEquals(safe.pdfUrl, "");
  assert(!isJobsAlUrl("http://jobs.al/insecure"));
});

Deno.test("nested job values are escaped without breaking job JSON", () => {
  const safe = sanitizeEmailData({
    jobs: JSON.stringify([{ title: "<b>Sales</b>", slug: "sales", jobUrl: "https://evil.example" }]),
  });
  const jobs = JSON.parse(safe.jobs);
  assertEquals(jobs[0].title, "&lt;b&gt;Sales&lt;/b&gt;");
  assertEquals(jobs[0].slug, "sales");
  assertEquals(jobs[0].jobUrl, "");
});
