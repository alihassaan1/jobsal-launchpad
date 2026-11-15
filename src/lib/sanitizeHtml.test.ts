// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeBasicHtml } from "./sanitizeHtml";

describe("sanitizeBasicHtml", () => {
  it("removes scripts, event handlers, and unsupported tags", () => {
    const result = sanitizeBasicHtml('<p onclick="alert(1)">Safe</p><script>alert(1)</script><img src=x><strong>Role</strong>');
    expect(result).toBe("<p>Safe</p><strong>Role</strong>");
  });

  it("keeps only HTTPS links and adds safe rel attributes", () => {
    const result = sanitizeBasicHtml('<a href="https://jobs.al/jobs/1">Job</a><a href="javascript:alert(1)">Bad</a>');
    expect(result).toContain('href="https://jobs.al/jobs/1"');
    expect(result).toContain('rel="noopener noreferrer nofollow"');
    expect(result).toContain(">Bad</a>");
    expect(result).not.toContain("javascript:");
  });
});
