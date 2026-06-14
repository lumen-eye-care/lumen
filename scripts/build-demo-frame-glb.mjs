/**
 * Procedurally builds a recognizable eyewear model and exports an uncompressed
 * binary GLB to public/models/frame-demo.glb.
 *
 * POC asset for the <model-viewer> Phase-3 proof-of-concept. Uncompressed (no
 * Draco) so model-viewer never fetches a CDN decoder — keeps CSP clean. Replace
 * with real per-frame .glb models (Blender / photogrammetry) for production.
 *
 *   node scripts/build-demo-frame-glb.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "models", "frame-demo.glb");

// ── geometry buffers, grouped per material (one primitive each) ──
function makeGroup() {
  return { pos: [], nrm: [], idx: [], base: 0 };
}
const frame = makeGroup(); // acetate rims/bridge/temples
const lens = makeGroup(); // tinted lenses

function addTri(g, a, b, c) {
  g.idx.push(a, b, c);
}

/** Torus in the XY plane (faces +z), centered at c. */
function torus(g, R, r, cx, cy, cz, segU = 56, segV = 18) {
  const start = g.pos.length / 3;
  for (let i = 0; i <= segU; i++) {
    const u = (i / segU) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * Math.PI * 2;
      const cv = Math.cos(v);
      const sv = Math.sin(v);
      g.pos.push(cx + (R + r * cv) * cu, cy + (R + r * cv) * su, cz + r * sv);
      g.nrm.push(cv * cu, cv * su, sv);
    }
  }
  const cols = segV + 1;
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = start + i * cols + j;
      const b = start + (i + 1) * cols + j;
      addTri(g, a, b, a + 1);
      addTri(g, b, b + 1, a + 1);
    }
  }
}

/** Axis-aligned box, per-face normals. */
function box(g, x0, y0, z0, x1, y1, z1) {
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const faces = [
    [0, 1, 2, 3, [0, 0, -1]],
    [5, 4, 7, 6, [0, 0, 1]],
    [4, 0, 3, 7, [-1, 0, 0]],
    [1, 5, 6, 2, [1, 0, 0]],
    [4, 5, 1, 0, [0, -1, 0]],
    [3, 2, 6, 7, [0, 1, 0]],
  ];
  for (const [a, b, c, d, n] of faces) {
    const s = g.pos.length / 3;
    for (const k of [a, b, c, d]) {
      g.pos.push(v[k][0], v[k][1], v[k][2]);
      g.nrm.push(n[0], n[1], n[2]);
    }
    addTri(g, s, s + 1, s + 2);
    addTri(g, s, s + 2, s + 3);
  }
}

/** Flat disc in the XY plane (a lens), double-sided via material. */
function disc(g, R, cx, cy, cz, seg = 40) {
  const center = g.pos.length / 3;
  g.pos.push(cx, cy, cz);
  g.nrm.push(0, 0, 1);
  const rim = g.pos.length / 3;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    g.pos.push(cx + R * Math.cos(a), cy + R * Math.sin(a), cz);
    g.nrm.push(0, 0, 1);
  }
  for (let i = 0; i < seg; i++) addTri(g, center, rim + i, rim + i + 1);
}

// ── build the glasses ──
const R = 0.34; // lens radius
const tube = 0.028; // rim thickness
const offX = 0.42; // half inter-lens distance

torus(frame, R, tube, -offX, 0, 0);
torus(frame, R, tube, offX, 0, 0);
// bridge across the top inner gap
box(frame, -0.085, 0.16, -0.02, 0.085, 0.21, 0.02);
// temple arms going back (-z) from the outer rim
box(frame, -offX - R - 0.02, -0.03, -0.02, -offX - R + 0.02, 0.03, -0.62);
box(frame, offX + R - 0.02, -0.03, -0.02, offX + R + 0.02, 0.03, -0.62);
// lenses (slightly behind the rim plane)
disc(lens, R - 0.02, -offX, 0, -0.004);
disc(lens, R - 0.02, offX, 0, -0.004);

// ── pack to GLB ──
function f32(arr) {
  return Buffer.from(new Float32Array(arr).buffer);
}
function u16(arr) {
  return Buffer.from(new Uint16Array(arr).buffer);
}
function pad4(buf, fill = 0) {
  const rem = buf.length % 4;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem, fill)]);
}
function minMax3(pos) {
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], pos[i + k]);
      mx[k] = Math.max(mx[k], pos[i + k]);
    }
  }
  return { mn, mx };
}

const groups = [frame, lens];
const bufferViews = [];
const accessors = [];
const chunks = [];
let offset = 0;

function addView(buf, target) {
  const padded = pad4(buf);
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
  chunks.push(padded);
  offset += padded.length;
  return bufferViews.length - 1;
}

const primitives = [];
for (const g of groups) {
  const posView = addView(f32(g.pos), 34962);
  const nrmView = addView(f32(g.nrm), 34962);
  const idxView = addView(u16(g.idx), 34963);
  const { mn, mx } = minMax3(g.pos);

  const posAcc = accessors.length;
  accessors.push({
    bufferView: posView, componentType: 5126, count: g.pos.length / 3,
    type: "VEC3", min: mn, max: mx,
  });
  const nrmAcc = accessors.length;
  accessors.push({ bufferView: nrmView, componentType: 5126, count: g.nrm.length / 3, type: "VEC3" });
  const idxAcc = accessors.length;
  accessors.push({ bufferView: idxView, componentType: 5123, count: g.idx.length, type: "SCALAR" });

  primitives.push({
    attributes: { POSITION: posAcc, NORMAL: nrmAcc },
    indices: idxAcc,
    material: primitives.length, // 0 = acetate, 1 = lens
  });
}

const bin = Buffer.concat(chunks);

const gltf = {
  asset: { version: "2.0", generator: "lumen build-demo-frame-glb" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "LumenDemoFrame" }],
  meshes: [{ name: "frame", primitives }],
  materials: [
    {
      name: "acetate",
      pbrMetallicRoughness: {
        baseColorFactor: [0.04, 0.11, 0.2, 1],
        metallicFactor: 0.1,
        roughnessFactor: 0.35,
      },
    },
    {
      name: "lens",
      doubleSided: true,
      alphaMode: "BLEND",
      pbrMetallicRoughness: {
        baseColorFactor: [0.55, 0.72, 0.85, 0.28],
        metallicFactor: 0.0,
        roughnessFactor: 0.1,
      },
    },
  ],
  buffers: [{ byteLength: bin.length }],
  bufferViews,
  accessors,
};

const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
const binBuf = pad4(bin, 0);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // 'glTF'
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);

function chunk(type, data) {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(data.length, 0);
  h.writeUInt32LE(type, 4);
  return Buffer.concat([h, data]);
}

const glb = Buffer.concat([
  header,
  chunk(0x4e4f534a, jsonBuf), // JSON
  chunk(0x004e4942, binBuf), // BIN
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, glb);
console.log(
  `wrote ${OUT} (${glb.length} bytes, ${frame.pos.length / 3 + lens.pos.length / 3} verts)`,
);
