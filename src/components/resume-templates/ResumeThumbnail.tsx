import { useEffect, useRef, useState } from "react";
import { renderResumeTemplate, type ResumeTemplateData } from "./registry";

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const A4_HEIGHT_PX = 1123; // 297mm at 96dpi

interface ResumeThumbnailProps {
  slug: string;
  data: ResumeTemplateData;
  /** Show the full A4 page instead of cropping to the card ratio */
  fullPage?: boolean;
  className?: string;
}

/**
 * Renders the real resume template at A4 size and scales it down to fit its
 * container, so thumbnails always match the generated PDF exactly.
 */
export default function ResumeThumbnail({
  slug,
  data,
  fullPage = false,
  className = "",
}: ResumeThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width ? width / A4_WIDTH_PX : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-white ${
        fullPage ? "aspect-[210/297]" : "aspect-[3/4]"
      } ${className}`}
    >
      {scale > 0 && (
        <div
          aria-hidden
          style={{
            width: A4_WIDTH_PX,
            minHeight: A4_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          {renderResumeTemplate(slug, data)}
        </div>
      )}
    </div>
  );
}

