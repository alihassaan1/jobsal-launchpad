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

const RICH_TAGS = [...BASIC_TAGS, "h1", "h4", "h5", "h6", "blockquote", "code", "pre", "hr", "u", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption"];

/** Sanitizes rich article HTML (blog posts): formatting, tables and https images only. */
export function sanitizeRichHtml(value: string | null | undefined): string {
  const sanitized = DOMPurify.sanitize(String(value ?? ""), {
    ALLOWED_TAGS: RICH_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "colspan", "rowspan"],
    ALLOW_DATA_ATTR: false,
  });
  const document = new DOMParser().parseFromString(sanitized, "text/html");
  document.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    if (!href.startsWith("https://") && !href.startsWith("/")) { anchor.removeAttribute("href"); return; }
    anchor.setAttribute("rel", "noopener noreferrer nofollow");
  });
  document.querySelectorAll("img").forEach((img) => {
    if (!(img.getAttribute("src") ?? "").startsWith("https://")) img.remove();
  });
  return document.body.innerHTML;
}
