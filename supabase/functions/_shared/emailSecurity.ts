export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function isJobsAlUrl(value: string): boolean {
  return /^https:\/\/jobs\.al(?:$|[/?#])/.test(value);
}

function sanitizeValue(key: string, value: unknown): string {
  const text = String(value ?? "");
  if (/(?:url|link)$/i.test(key) && text && !isJobsAlUrl(text)) return "";
  return escapeHtml(text);
}

export function sanitizeEmailData(data: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "jobs" && typeof value === "string") {
      try {
        const jobs = JSON.parse(value);
        if (Array.isArray(jobs)) {
          safe[key] = JSON.stringify(jobs.map((job) => {
            if (!job || typeof job !== "object" || Array.isArray(job)) return {};
            return Object.fromEntries(
              Object.entries(job).map(([jobKey, jobValue]) => [jobKey, sanitizeValue(jobKey, jobValue)]),
            );
          }));
          continue;
        }
      } catch {
        // Invalid job JSON becomes an empty list rather than template HTML.
      }
      safe[key] = "[]";
      continue;
    }
    safe[key] = sanitizeValue(key, value);
  }
  return safe;
}
