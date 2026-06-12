"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/**
 * The 3D signature renderer (vanilla Three.js, code-split — see frame-3d-stage).
 *
 * Renders a procedural eyewear model so the signature works before any asset
 * exists, and hot-swaps the Higgsfield GLB (/preview/frame.glb, draco-compressed)
 * in when present. Scroll drives rotation + the --pv-focus var (blur→sharp on the
 * .pv-stage), cursor adds subtle parallax, the render loop pauses off-screen, and
 * everything is disposed on unmount.
 *
 * Budget guards: DPR capped at 2, single canvas, draco decoder self-hosted at
 * /draco/ (no CSP change), loop idle when not visible.
 */
const GLB_URL = "/preview/frame.glb";
const DRACO_PATH = "/draco/";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Build a stylised eyewear frame from primitives (titanium-ish look). */
function buildProceduralFrame(): THREE.Group {
  const group = new THREE.Group();

  const metal = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#cfd3d8"),
    metalness: 0.92,
    roughness: 0.32,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0a1f35"),
    metalness: 0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.42,
    ior: 1.4,
  });

  const ringR = 0.95;
  const tube = 0.07;
  for (const x of [-1.18, 1.18]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, tube, 18, 56),
      metal,
    );
    ring.position.x = x;
    group.add(ring);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(ringR - 0.02, 48),
      lensMat,
    );
    lens.position.set(x, 0, 0);
    group.add(lens);
  }

  // Bridge.
  const bridge = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, tube * 0.8, 12, 32, Math.PI),
    metal,
  );
  bridge.rotation.z = Math.PI;
  bridge.position.set(0, 0.28, 0);
  group.add(bridge);

  // Temples (arms) sweeping back from the outer rims.
  for (const x of [-2.13, 2.13]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(tube * 0.7, tube * 0.7, 1.7, 12),
      metal,
    );
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = x < 0 ? 0.32 : -0.32;
    arm.position.set(x, 0.05, -0.55);
    group.add(arm);
  }

  group.scale.setScalar(1.05);
  return group;
}

export function Frame3DViewer({
  shape,
  mode = "scroll",
}: {
  shape: string;
  /** "hero": blur→focus on load + slow idle spin (centerpiece). "scroll":
   *  rotation + focus driven by scroll position (in-page signature). */
  mode?: "hero" | "scroll";
}) {
  // shape is accepted for parity with the poster; the procedural model is shape-
  // agnostic and the GLB (when present) defines its own geometry.
  void shape;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    // Pulled back so the full frame (incl. temples, ~6 units wide) sits inside
    // the canvas with margin — the earlier 6.4 cropped the arms off.
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // Lighting: low cool ambient + one warm practical key + cool rim.
    scene.add(new THREE.AmbientLight(0x2a3a4a, 1.1));
    const key = new THREE.DirectionalLight(0xffd9b0, 2.6);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f9bd6, 1.0);
    rim.position.set(-5, -2, -4);
    scene.add(rim);

    let model: THREE.Object3D = buildProceduralFrame();
    scene.add(model);

    // Try to hot-swap the Higgsfield GLB if it has been generated. HEAD first to
    // avoid a 404 in the console when the asset doesn't exist yet.
    let draco: DRACOLoader | null = null;
    let disposed = false;
    fetch(GLB_URL, { method: "HEAD" })
      .then((res) => {
        if (!res.ok || disposed) return;
        draco = new DRACOLoader();
        draco.setDecoderPath(DRACO_PATH);
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);
        loader.load(GLB_URL, (gltf) => {
          if (disposed) return;
          scene.remove(model);
          disposeObject(model);
          model = gltf.scene;
          // Normalise scale/position so any GLB roughly fills the frame.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.position.sub(center);
          model.scale.setScalar(3.4 / maxDim);
          scene.add(model);
        });
      })
      .catch(() => {
        /* no GLB yet — procedural model stays */
      });

    // ---- Interaction state ----
    let focus = 0; // 0 hazy → 1 sharp (also drives CSS blur via --pv-focus)
    let targetRotY = 0;
    let curRotY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let visible = true;
    let raf = 0;
    let idleSpin = -0.9; // start rotated, unwind to front as it focuses
    const startTime = performance.now();

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    function updateScroll() {
      const rect = host!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the stage top is at the bottom of the viewport, 1 once its centre
      // has reached the upper third — sharpen as it rises into view.
      const t = (vh - rect.top) / (vh * 0.85);
      focus = Math.max(0, Math.min(1, t));
      // ~0.85 turn across the scroll range.
      targetRotY = focus * Math.PI * 0.85;
    }

    function onPointer(e: PointerEvent) {
      if (!finePointer) return;
      const rect = host!.getBoundingClientRect();
      targetPointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    function onLeave() {
      targetPointerX = 0;
      targetPointerY = 0;
    }

    function resize() {
      const w = host!.clientWidth || 1;
      const h = host!.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function tick() {
      if (mode === "hero") {
        // Entrance: blur→sharp over ~1.8s; meanwhile the frame unwinds to front
        // and then idles with a slow continuous spin.
        const elapsed = (performance.now() - startTime) / 1800;
        focus = easeOutCubic(Math.min(1, elapsed));
        idleSpin += 0.0022;
        targetRotY = idleSpin * focus; // hold still until focused, then drift
      }
      curRotY = lerp(curRotY, targetRotY, 0.08);
      pointerX = lerp(pointerX, targetPointerX, 0.1);
      pointerY = lerp(pointerY, targetPointerY, 0.1);

      model.rotation.y = curRotY + pointerX * 0.35;
      model.rotation.x = pointerY * 0.2;

      host!.style.setProperty("--pv-focus", focus.toFixed(3));
      renderer.render(scene, camera);
      raf = visible ? requestAnimationFrame(tick) : 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && raf === 0) {
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.01 },
    );
    io.observe(host);

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    if (mode === "scroll") {
      window.addEventListener("scroll", updateScroll, { passive: true });
    }
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);

    resize();
    if (mode === "scroll") updateScroll();
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", updateScroll);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      disposeObject(model);
      draco?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [mode]);

  return <div ref={hostRef} className="pv-stage relative aspect-square w-full" />;
}

/** Recursively dispose geometries + materials of an object tree. */
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) (mat as THREE.Material).dispose();
  });
}
