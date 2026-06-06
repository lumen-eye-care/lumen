/* global React, ReactDOM */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { Icon, LogoMark, FrameSVG, FRAMES } = window;

const readFrameId = () => {
  const params = window.__lumen_route_params || new URLSearchParams(window.location.search);
  return parseInt(params.get("frame")) || 1;
};

/* Persist per-frame transforms in localStorage */
const tryonStorageKey = (frameId) => `lumen-tryon-${frameId}`;
const loadTransform = (frameId) => {
  try {
    return JSON.parse(localStorage.getItem(tryonStorageKey(frameId))) || { x: 0, y: 0, scale: 1 };
  } catch { return { x: 0, y: 0, scale: 1 }; }
};
const saveTransform = (frameId, t) => {
  try { localStorage.setItem(tryonStorageKey(frameId), JSON.stringify(t)); } catch {}
};

/* ============================================
   DRAGGABLE FRAME OVERLAY
   ============================================ */
const DraggableFrame = ({ frame, color, scale, x, y, onMove, onScale }) => {
  const ref = useRef(null);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    drag.current = { startX: p.clientX, startY: p.clientY, baseX: x, baseY: y };
    ref.current?.classList.add("dragging");
  };

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - drag.current.startX;
    const dy = p.clientY - drag.current.startY;
    onMove(drag.current.baseX + dx, drag.current.baseY + dy);
  }, [onMove]);

  const onPointerUp = useCallback(() => {
    drag.current = null;
    ref.current?.classList.remove("dragging");
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    onScale(Math.max(0.4, Math.min(1.6, scale + delta)));
  };

  return (
    <div
      ref={ref}
      className="tryon-overlay-frame"
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onWheel={onWheel}
      style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
      }}
    >
      <FrameSVG shape={frame.shape} color={color}/>
    </div>
  );
};

/* ============================================
   VIRTUAL TRY-ON
   ============================================ */
const TryOn = () => {
  const initialFrameId = useMemo(readFrameId, []);
  const initialIdx = FRAMES.findIndex(f => f.id === initialFrameId);
  const [frameIdx, setFrameIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [colorIdx, setColorIdx] = useState(0);
  const [compare, setCompare] = useState(false);
  const [compareIdx, setCompareIdx] = useState((initialIdx + 1) % FRAMES.length);
  const [showGuides, setShowGuides] = useState(false);
  const [favs, setFavs] = useState(new Set());
  const [captured, setCaptured] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const frame = FRAMES[frameIdx];
  const compareFrame = FRAMES[compareIdx];
  const currentColor = frame.colors[colorIdx]?.hex || frame.colors[0].hex;

  /* Transform state, per-frame, persisted */
  const [transform, setTransform] = useState(() => loadTransform(frame.id));

  useEffect(() => {
    setColorIdx(0);
    setTransform(loadTransform(frame.id));
  }, [frameIdx, frame.id]);

  /* Persist transform on change */
  useEffect(() => { saveTransform(frame.id, transform); }, [transform, frame.id]);

  /* Hide hint after first interaction */
  useEffect(() => {
    if (transform.x !== 0 || transform.y !== 0 || transform.scale !== 1) setHintVisible(false);
  }, [transform]);

  const setX = (x) => setTransform(t => ({ ...t, x }));
  const setY = (y) => setTransform(t => ({ ...t, y }));
  const setScale = (scale) => setTransform(t => ({ ...t, scale }));
  const setXY = (x, y) => setTransform(t => ({ ...t, x, y }));
  const resetTransform = () => setTransform({ x: 0, y: 0, scale: 1 });

  const toggleFav = () => {
    setFavs(s => {
      const n = new Set(s);
      if (n.has(frame.id)) n.delete(frame.id);
      else n.add(frame.id);
      return n;
    });
  };

  const handleCapture = () => {
    setCaptured(true);
    setTimeout(() => setCaptured(false), 1500);
  };

  /* Photo controls — reach into the image-slot's shadow DOM */
  const getSlot = () => document.getElementById("tryon-face");
  const replacePhoto = () => {
    const slot = getSlot();
    const btn = slot && slot.shadowRoot && slot.shadowRoot.querySelector('button[data-act="replace"]');
    if (btn) btn.click();
    else {
      const input = slot && slot.shadowRoot && slot.shadowRoot.querySelector('input[type="file"]');
      if (input) input.click();
    }
  };
  const removePhoto = () => {
    const slot = getSlot();
    const btn = slot && slot.shadowRoot && slot.shadowRoot.querySelector('button[data-act="clear"]');
    if (btn) btn.click();
    window.toast && window.toast("Photo removed.");
  };
  const cropPhoto = () => {
    const slot = getSlot();
    if (slot && slot._enterReframe) slot._enterReframe();
    else window.toast && window.toast("Drop a photo first, then tap Crop & zoom.");
  };
  const [photoLoaded, setPhotoLoaded] = useState(false);
  useEffect(() => {
    const slot = getSlot();
    if (!slot) return;
    const check = () => setPhotoLoaded(slot.hasAttribute("data-filled"));
    check();
    /* Watch for fill changes */
    const obs = new MutationObserver(check);
    obs.observe(slot, { attributes: true, attributeFilter: ["data-filled"] });
    return () => obs.disconnect();
  }, [compare]);

  return (
    <div className="tryon-shell">
      {/* Top controls */}
      <div className="tryon-top">
        <a href="Lumen Eye Care.html" className="tryon-back">
          <Icon name="arrowLeft" size={14}/>
          Back to Lumen
        </a>
        <div className="tryon-actions">
          <button
            className={`tryon-icon-btn ${showGuides ? "active" : ""}`}
            onClick={() => setShowGuides(!showGuides)}
            title="Show alignment guides"
          >
            <Icon name="target" size={16}/>
          </button>
          <button
            className={`tryon-icon-btn ${compare ? "active" : ""}`}
            onClick={() => setCompare(!compare)}
            title="Compare two frames"
          >
            <Icon name="columns" size={16}/>
          </button>
          <button className="tryon-icon-btn" onClick={handleCapture} title="Capture photo">
            <Icon name="cam" size={16}/>
          </button>
          <button className="tryon-icon-btn" title="Share">
            <Icon name="share" size={16}/>
          </button>
        </div>
      </div>

      {/* Capture flash */}
      {captured && (
        <div style={{
          position: "fixed", inset: 0, background: "white",
          opacity: 0.6, pointerEvents: "none",
          animation: "fadeIn 200ms ease-out",
          zIndex: 100
        }}/>
      )}

      {/* Stage */}
      <div className="tryon-stage">
        {hintVisible && !compare && (
          <div className="tryon-hint">
            <Icon name="info" size={12}/>
            Drag frames to position · Scroll to resize · Double-click your photo to crop
          </div>
        )}

        <div className={`tryon-canvas ${compare ? "compare" : ""}`}>
          {!compare ? (
            <>
              <image-slot
                id="tryon-face"
                placeholder="Drop a portrait photo here to try on virtually"
                shape="rect">
              </image-slot>
              <DraggableFrame
                frame={frame}
                color={currentColor}
                x={transform.x}
                y={transform.y}
                scale={transform.scale}
                onMove={setXY}
                onScale={setScale}
              />
              <div className={`tryon-guides ${showGuides ? "show" : ""}`}>
                <div className="gl gl-h" style={{top: "36%"}}></div>
                <div className="gl gl-h" style={{top: "50%"}}></div>
                <div className="gl gl-v"></div>
              </div>
            </>
          ) : (
            <>
              <div className="compare-cell">
                <image-slot id="tryon-face-a" placeholder="Drop a portrait" shape="rect"></image-slot>
                <div className="tryon-overlay-frame" style={{width: "70%", transform: "translate(-50%, -50%)"}}>
                  <FrameSVG shape={frame.shape} color={currentColor}/>
                </div>
                <span className="compare-label">{frame.name} · {frame.colors[colorIdx].name}</span>
              </div>
              <div className="compare-cell">
                <image-slot id="tryon-face-b" placeholder="Drop a portrait" shape="rect"></image-slot>
                <div className="tryon-overlay-frame" style={{width: "70%", transform: "translate(-50%, -50%)"}}>
                  <FrameSVG shape={compareFrame.shape} color={compareFrame.colors[0].hex}/>
                </div>
                <span className="compare-label">{compareFrame.name} · {compareFrame.colors[0].name}</span>
              </div>
            </>
          )}
        </div>

        {/* Adjust panel */}
        {!compare && (
          <div className="tryon-adjust">
            <span className="tryon-adjust-label">Adjust fit</span>

            <div className="tryon-adjust-group" title="Size">
              <Icon name="search" size={13} className="tryon-adjust-icon"/>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={transform.scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
              />
            </div>

            <div className="tryon-adjust-divider"></div>

            <div className="tryon-adjust-group" title="Vertical position">
              <span style={{fontSize: 13, color: "rgba(255,255,255,0.7)"}}>↕</span>
              <input
                type="range"
                min="-140"
                max="140"
                step="1"
                value={transform.y}
                onChange={(e) => setY(parseInt(e.target.value))}
              />
            </div>

            <div className="tryon-adjust-divider"></div>

            <div className="tryon-adjust-group" title="Horizontal position">
              <span style={{fontSize: 13, color: "rgba(255,255,255,0.7)"}}>↔</span>
              <input
                type="range"
                min="-140"
                max="140"
                step="1"
                value={transform.x}
                onChange={(e) => setX(parseInt(e.target.value))}
              />
            </div>

            <div className="tryon-adjust-divider"></div>

            <button className="tryon-adjust-reset" onClick={resetTransform}>
              <Icon name="refresh" size={11}/>
              Reset
            </button>
          </div>
        )}

        {/* Bottom rail */}
        <div className="tryon-rail">
          {FRAMES.map((f, i) => (
            <div
              key={f.id}
              className={`tryon-rail-item ${(compare ? compareIdx : frameIdx) === i ? "active" : ""}`}
              onClick={() => compare ? setCompareIdx(i) : setFrameIdx(i)}
              title={f.name}
            >
              <FrameSVG shape={f.shape} color={f.colors[0].hex}/>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="tryon-side">
        <div className="tryon-side-eyebrow">
          <span style={{marginRight: 6}}>◇</span> Now trying on
        </div>
        <h2 className="tryon-side-name">{frame.name}</h2>
        <p className="tryon-side-type">{frame.type}</p>

        <div className="tryon-side-price-row">
          <span className="tryon-side-price">&#8373;{frame.price}</span>
          <span className="tryon-side-price-meta">Frame only · lenses from ₵120</span>
        </div>

        <h5>Colour · {frame.colors[colorIdx].name}</h5>
        <div className="tryon-colors">
          {frame.colors.map((c, i) => (
            <span
              key={i}
              className={`tryon-color-swatch ${colorIdx === i ? "active" : ""}`}
              style={{ background: c.hex }}
              onClick={() => setColorIdx(i)}
              title={c.name}
            ></span>
          ))}
        </div>

        <h5>Your photo</h5>
        <div className="tryon-photo-ctl">
          <button onClick={replacePhoto}>
            <Icon name="upload" size={12}/>{photoLoaded ? "Change" : "Upload"}
          </button>
          <button onClick={cropPhoto} disabled={!photoLoaded} style={!photoLoaded ? {opacity: 0.4, cursor: "not-allowed"} : {}}>
            <Icon name="search" size={12}/>Crop & zoom
          </button>
          <button onClick={removePhoto} disabled={!photoLoaded} style={!photoLoaded ? {opacity: 0.4, cursor: "not-allowed"} : {color: "#FF9F8A"}}>
            <Icon name="x" size={12}/>Remove
          </button>
        </div>

        <h5>Features</h5>
        <div className="tryon-feats">
          {[
            "Hand-polished Italian acetate",
            "Spring-flex titanium hinges",
            "Adjustable nose pads",
            "Two-year frame warranty",
          ].map((f, i) => (
            <div key={i} className="tryon-feat">
              <span className="tryon-feat-tick"><Icon name="check" size={10}/></span>
              {f}
            </div>
          ))}
        </div>

        {compare && (
          <>
            <h5 style={{marginTop: 24}}>Comparing with</h5>
            <div style={{
              padding: "12px 14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--r-md)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{width: 36, height: 36, background: "rgba(255,255,255,0.06)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <FrameSVG shape={compareFrame.shape} color={compareFrame.colors[0].hex}/>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 600, color: "#fff"}}>{compareFrame.name}</div>
                <div style={{fontSize: 12, color: "rgba(255,255,255,0.6)"}}>&#8373;{compareFrame.price}</div>
              </div>
            </div>
          </>
        )}

        <div className="tryon-side-cta">
          <a href={`Frame Detail.html?frame=${frame.id}`} className="btn-buy">
            Choose lenses & buy
            <Icon name="arrow" size={16}/>
          </a>
          <button className="btn-favourite" onClick={toggleFav}>
            <Icon name="heart" size={14} stroke={favs.has(frame.id) ? 0 : 1.5} style={favs.has(frame.id) ? {fill: "currentColor"} : {}}/>
            {favs.has(frame.id) ? "Saved to favourites" : "Save to favourites"}
          </button>
        </div>
      </div>
    </div>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.TryOn = TryOn;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<TryOn/>);
}
