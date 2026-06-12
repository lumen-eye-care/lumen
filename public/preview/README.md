# /preview/home — generated media drop-in

Same-origin assets for the immersive prototype. Serving them from here keeps the
CSP untouched (covered by `default-src 'self'` / `img-src 'self'`). All are
optional: the page renders intentionally (layered gradients, floating FrameSVG,
a procedural 3D frame) with none of them present, then upgrades as they land.

Generated via Higgsfield (Layer 6) with one locked grade across the site:
`low-key cinematic, deep navy field, single warm practical source, lifted blacks,
subtle film grain; palette around #0A1F35 base + #D97757 warm accent, near-white
#F2F2F0`. Type is never baked into media — headlines live in the DOM.

| File | Slot | Spec / budget |
|------|------|---------------|
| `hero-desktop.avif` | Hero bg (HERO-STILL) | 21:9, ≤350KB |
| `hero-mobile.avif` | Hero bg, mobile plate | 9:16, ≤250KB |
| `hero-loop.mp4` / `.webm` | Hero ambient (HERO-LOOP) | 16:9 1080p, ≤4MB desktop / ≤1.5MB mobile, muted, loop, poster = first frame |
| `frame.glb` | 3D signature (FRAME-3D) | draco-compressed, ≤1.5MB, ≤40k tris. Auto-detected by the viewer (HEAD probe); replaces the procedural model when present |
| `accent-mark.svg` | Nav / section accent (ACCENT-MARK) | recraft vector, colors locked to `#D97757`/`#0A1F35`, ≤20KB |

Wire-in points:
- Hero still/loop → `src/components/preview/immersive-hero.tsx` (`data-asset="HERO-STILL"` slot).
- GLB → no code change; `frame-3d-viewer.tsx` probes `/preview/frame.glb` on mount.
