"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Triangle, Program, Mesh, Texture } from "ogl";

/**
 * OGL refraction shader for the hero frame — Phase 2, TIER_2+ only.
 *
 * A single fullscreen triangle samples the frame PNG with a cursor-driven
 * chromatic aberration + a slow wave, so the acetate reads like a physical
 * object catching light. Deliberately minimal per the Ghana device budget:
 * 1 draw call, 1 texture, no post-processing, DPR capped. Honors
 * prefers-reduced-motion (renders one static frame) and disposes the GL
 * context on unmount.
 *
 * Falls back (onError) to the CSS image — the gate in hero-frame.tsx renders
 * that until this signals it has painted successfully.
 */
export function HeroFrameShader({
  src,
  alt = "Lumen frame",
  onError,
}: {
  src: string;
  alt?: string;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let renderer: Renderer | null = null;
    let raf = 0;
    let disposed = false;

    // Eased cursor state.
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    let hover = 0;
    let thover = 0;

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      container.appendChild(gl.canvas);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.display = "block";

      const texture = new Texture(gl, { premultiplyAlpha: true });
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        if (disposed) return;
        texture.image = img;
        setReady(true);
      };
      img.onerror = () => onError?.();

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTexture: { value: texture },
          uMouse: { value: [0, 0] },
          uTime: { value: 0 },
          uHover: { value: 0 },
        },
        transparent: true,
      });

      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = container;
        if (w === 0 || h === 0) return;
        renderer!.setSize(w, h);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(container);

      const onMove = (e: PointerEvent) => {
        const r = container.getBoundingClientRect();
        tmx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) || 0;
        tmy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) || 0;
        thover = 1;
      };
      const onLeave = () => {
        thover = 0;
        tmx = 0;
        tmy = 0;
      };
      if (!reduce) {
        window.addEventListener("pointermove", onMove, { passive: true });
        container.addEventListener("pointerleave", onLeave);
      }

      const start = performance.now();
      const loop = () => {
        if (disposed) return;
        mx += (tmx - mx) * 0.07;
        my += (tmy - my) * 0.07;
        hover += (thover - hover) * 0.06;
        program.uniforms.uMouse.value = [mx, -my];
        program.uniforms.uHover.value = hover;
        program.uniforms.uTime.value = (performance.now() - start) / 1000;
        renderer!.render({ scene: mesh });
        if (!reduce) raf = requestAnimationFrame(loop);
      };
      // Render once when the texture is ready; animate only if motion allowed.
      const kick = () => {
        if (disposed) return;
        if (!texture.image) {
          raf = requestAnimationFrame(kick);
          return;
        }
        loop();
      };
      raf = requestAnimationFrame(kick);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerleave", onLeave);
        const ext = gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
        if (gl.canvas.parentNode === container) {
          container.removeChild(gl.canvas);
        }
      };
    } catch (err) {
      console.error("[hero-shader] init failed", err);
      onError?.();
    }
  }, [src, onError]);

  return (
    <div
      className="lm-rise lm-float"
      style={{ willChange: "transform", aspectRatio: "1200 / 896" }}
    >
      <div
        ref={containerRef}
        role="img"
        aria-label={alt}
        className="h-full w-full"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 500ms ease",
          filter: "drop-shadow(0 30px 60px var(--lm-shadow))",
        }}
      />
    </div>
  );
}

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;   // -1..1, eased
  uniform float uTime;
  uniform float uHover;  // 0..1, eased
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Slow ambient wave so the acetate is never perfectly still.
    uv.x += sin(uv.y * 10.0 + uTime * 0.6) * 0.0015;

    // Cursor-driven + radial chromatic split.
    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 dir = uMouse * 0.010 * (0.45 + uHover);
    vec2 ca = dir + center * dist * 0.018 * (0.5 + uHover);

    float r = texture2D(uTexture, uv + ca).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - ca).b;
    float a = texture2D(uTexture, uv).a;

    gl_FragColor = vec4(r, g, b, a);
  }
`;
