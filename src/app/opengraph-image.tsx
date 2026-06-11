import { ImageResponse } from "next/og";

/**
 * Default Open Graph / link-preview card (1200×630) for every route that
 * doesn't supply its own image — brand cream/ink with the eye logomark
 * (same paths as src/components/atoms/logo-mark.tsx, inlined because
 * Satori renders raw SVG, not React client components).
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
          width={140}
          height={140}
          viewBox="0 0 40 40"
          fill="none"
        >
          <circle cx="20" cy="20" r="18.5" stroke="#0F4C81" strokeWidth="1.5" />
          <path
            d="M6 20 Q20 8 34 20 Q20 32 6 20Z"
            stroke="#0F4C81"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="20" r="4.5" fill="#0F4C81" />
          <circle cx="21.5" cy="18.5" r="1.4" fill="#fff" />
        </svg>
        <div
          style={{
            marginTop: 36,
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: -2,
          }}
        >
          Lumen
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
