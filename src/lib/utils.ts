import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract readable preview text without rendering employer-provided HTML. */
export function htmlToPlainText(value: string | null | undefined): string {
  if (!value) return "";

  const source = value.replace(/```(?:html)?/gi, "");
  const document = new DOMParser().parseFromString(source, "text/html");
  document.querySelectorAll("script, style, template").forEach((element) => element.remove());
  document.querySelectorAll("br, p, div, li, h1, h2, h3, h4, h5, h6").forEach((element) => {
    element.before(" ");
    element.after(" ");
  });

  return (document.body.textContent || "").replace(/\s+/g, " ").trim();
}
