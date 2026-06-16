import { ImageResponse } from "next/og";

/**
 * Default Open Graph / link-preview card (1200×630) for every route that
 * doesn't supply its own image — brand cream/ink with the glasses-frame
 * logomark (same paths as src/components/atoms/logo-mark.tsx, inlined
 * because Satori renders raw SVG, not React client components). This is
 * the stacked "B" lockup: mark above the letterspaced LUMEN wordmark.
 */
export const alt = "Lumen Eye Care — premium eyewear, designed in Ghana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF7F2",
          color: "#0A1F35",
        }}
      >
        <svg
          width={336}
          height={184}
          viewBox="0 0 62 34"
          fill="none"
          stroke="#0F4C81"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="14" cy="18" r="11" />
          <circle cx="48" cy="18" r="11" />
          <path d="M25 16 Q31 12 37 16" />
          <path d="M6 11 L1.5 8" />
          <path d="M56 11 L60.5 8" />
        </svg>
        <div
          style={{
            marginTop: 40,
            fontSize: 92,
            fontWeight: 500,
            letterSpacing: 38,
            // trailing letter-spacing pushes the word right; nudge it back.
            textIndent: 38,
          }}
        >
          LUMEN
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 34,
            color: "#0A1F35",
            opacity: 0.65,
          }}
        >
          Premium eyewear, designed in Ghana
        </div>
        <div
          style={{
            marginTop: 48,
            width: 72,
            height: 4,
            backgroundColor: "#D97757",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
