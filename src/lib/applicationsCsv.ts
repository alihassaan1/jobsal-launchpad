const esc = (v: unknown) => {
  let s = v == null ? "" : String(v);
  // Prevent spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_HEADERS = [
  "Name", "Email", "Phone", "Location", "Applied on", "Status", "Resumes", "Documents", "Cover letter", "Internal notes",
];

export function applicationsToCsv(apps: any[]): string {
  const rows = apps.map((a) => [
    a.profiles?.full_name, a.profiles?.email, a.profiles?.phone, a.profiles?.location,
    a.created_at ? new Date(a.created_at).toISOString().slice(0, 10) : "",
    a.status, (a.resumes || []).map((r: any) => r.title).join(" | "),
    a.documents_count ?? 0, a.cover_letter, a.notes,
  ]);
  return "\uFEFF" + [CSV_HEADERS, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
