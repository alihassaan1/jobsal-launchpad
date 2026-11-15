import DOMPurify from "dompurify";

const BASIC_TAGS = ["p", "br", "b", "strong", "i", "em", "ul", "ol", "li", "h2", "h3", "a"];

export function sanitizeBasicHtml(value: string | null | undefined): string {
  const sanitized = DOMPurify.sanitize(String(value ?? "").replace(/\n/g, "<br />"), {
    ALLOWED_TAGS: BASIC_TAGS,
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  });
  const document = new DOMParser().parseFromString(sanitized, "text/html");
  document.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (!href.startsWith("https://")) {
      anchor.removeAttribute("href");
      return;
    }
    anchor.setAttribute("rel", "noopener noreferrer nofollow");
  });
  return document.body.innerHTML;
}
