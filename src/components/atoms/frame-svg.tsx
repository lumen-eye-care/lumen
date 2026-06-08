/**
 * Procedural frame shape renderer — ported from docs/design/shared.jsx.
 * Used as a product image placeholder when photo_urls is empty.
 * Near-zero cost on slow 4G (pure SVG, no HTTP request).
 */

export type FrameShape =
  | "round"
  | "square"
  | "cateye"
  | "aviator"
  | "oval"
  | "hex";

type FrameSVGProps = {
  shape: FrameShape | string | null;
  color?: string;
  className?: string;
};

export function FrameSVG({
  shape,
  color = "#1E3148",
  className = "",
}: FrameSVGProps) {
  const s = {
    stroke: color,
    strokeWidth: 4.5,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const shapeMap: Record<FrameShape, React.ReactNode> = {
    round: (
      <g>
        <circle cx="60" cy="80" r="38" {...s} />
        <circle cx="180" cy="80" r="38" {...s} />
        <path d="M98 78 L142 78" {...s} />
        <path d="M22 70 L8 60" {...s} />
        <path d="M218 70 L232 60" {...s} />
      </g>
    ),
    square: (
      <g>
        <rect x="22" y="50" width="80" height="58" rx="8" {...s} />
        <rect x="138" y="50" width="80" height="58" rx="8" {...s} />
        <path d="M102 78 L138 78" {...s} />
        <path d="M22 60 L8 50" {...s} />
        <path d="M218 60 L232 50" {...s} />
      </g>
    ),
    cateye: (
      <g>
        <path
          d="M22 95 Q30 50 75 50 Q105 50 102 80 Q98 110 60 110 Q22 110 22 95Z"
          {...s}
        />
        <path
          d="M218 95 Q210 50 165 50 Q135 50 138 80 Q142 110 180 110 Q218 110 218 95Z"
          {...s}
        />
        <path d="M102 78 L138 78" {...s} />
        <path d="M22 88 L8 78" {...s} />
        <path d="M218 88 L232 78" {...s} />
      </g>
    ),
    aviator: (
      <g>
        <path d="M18 60 L102 60 Q102 115 60 115 Q22 115 18 80 Z" {...s} />
        <path d="M222 60 L138 60 Q138 115 180 115 Q218 115 222 80 Z" {...s} />
        <path d="M102 70 Q120 65 138 70" {...s} />
        <path d="M18 60 L8 50" {...s} />
        <path d="M222 60 L232 50" {...s} />
      </g>
    ),
    oval: (
      <g>
        <ellipse cx="60" cy="80" rx="42" ry="32" {...s} />
        <ellipse cx="180" cy="80" rx="42" ry="32" {...s} />
        <path d="M102 78 L138 78" {...s} />
        <path d="M18 70 L8 60" {...s} />
        <path d="M222 70 L232 60" {...s} />
      </g>
    ),
    hex: (
      <g>
        <path d="M30 50 L90 50 L102 80 L90 110 L30 110 L18 80 Z" {...s} />
        <path d="M150 50 L210 50 L222 80 L210 110 L150 110 L138 80 Z" {...s} />
        <path d="M102 80 L138 80" {...s} />
        <path d="M18 75 L8 65" {...s} />
        <path d="M222 75 L232 65" {...s} />
      </g>
    ),
  };

  const resolved =
    shape && shape in shapeMap
      ? shapeMap[shape as FrameShape]
      : shapeMap.round;

  return (
    <svg
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {resolved}
    </svg>
  );
}
