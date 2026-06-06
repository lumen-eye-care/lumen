/* global React, ReactDOM */
const { useState, useMemo, useEffect } = React;
const { Icon, LogoMark, FrameSVG, FRAMES, SubNav } = window;

/* Read frame id from URL or route params */
const readFrameId = () => {
  const params = window.__lumen_route_params || new URLSearchParams(window.location.search);
  return parseInt(params.get("frame")) || 1;
};

/* ============================================
   BUILDER STEP (accordion item)
   ============================================ */
const Step = ({ num, title, value, active, done, onToggle, children }) => (
  <div className={`builder-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
    <div className="builder-head" onClick={onToggle}>
      <div className="builder-head-left">
        <span className="builder-step-num">{done ? <Icon name="check" size={12}/> : num}</span>
        <div>
          <div className="builder-step-title">{title}</div>
          {value && <div className="builder-step-value">{value}</div>}
        </div>
      </div>
      <Icon name="chev" size={18} className="builder-chev"/>
    </div>
    <div className="builder-body">
      {children}
    </div>
  </div>
);

/* ============================================
   FRAME DETAIL PAGE
   ============================================ */
const FrameDetail = () => {
  const initialFrameId = useMemo(readFrameId, []);
  const frame = FRAMES.find(f => f.id === initialFrameId) || FRAMES[0];

  /* Builder state */
  const [colorIdx, setColorIdx] = useState(0);
  const [lensType, setLensType] = useState("single"); // Smart default — most common
  const [addons, setAddons] = useState(new Set(["antireflective"])); // Smart default — most popular
  const [rx, setRx] = useState(null); // null = not chosen yet (intentionally — UX #04 prevention)

  /* Accordion */
  const [openStep, setOpenStep] = useState(1); // start at lens type — color has a smart default

  const lensOptions = [
    { id: "single", name: "Single vision", desc: "For distance OR reading. Most common.", price: 0, tag: "Most popular" },
    { id: "varifocal", name: "Varifocal", desc: "Distance, intermediate and reading in one.", price: 480 },
    { id: "reader", name: "Reading", desc: "For close-up work and screens.", price: 0 },
    { id: "blue", name: "Blue-light filter", desc: "If you're on screens 6+ hours a day.", price: 120, tag: "Recommended" },
  ];

  const addonOptions = [
    { id: "antireflective", name: "Anti-reflective coating", desc: "Reduces glare on screens and at night.", price: 0, badge: "Included" },
    { id: "scratch", name: "Scratch-resistant coating", desc: "Tougher lens for everyday wear.", price: 0, badge: "Included" },
    { id: "uv", name: "UV400 protection", desc: "Full UV-A and UV-B protection.", price: 0, badge: "Included" },
    { id: "transition", name: "Transitions® light-reactive", desc: "Tints in sunlight, clear indoors.", price: 320 },
    { id: "thin", name: "Thin & lightweight 1.67", desc: "Best for stronger prescriptions.", price: 220 },
    { id: "tint", name: "Custom tint (sun)", desc: "Grey, brown, or rose gradient.", price: 180 },
  ];

  const rxOptions = [
    { id: "upload", icon: "upload", name: "Upload prescription", desc: "Photo or PDF — under 12 months old" },
    { id: "manual", icon: "fileText", name: "Enter manually", desc: "Type your Rx details" },
    { id: "later", icon: "clock", name: "Send it later", desc: "We'll email you a reminder" },
  ];

  /* Live price calc */
  const basePrice = frame.price;
  const lensPrice = lensOptions.find(l => l.id === lensType)?.price || 0;
  const addonsPrice = [...addons]
    .map(id => addonOptions.find(a => a.id === id)?.price || 0)
    .reduce((sum, p) => sum + p, 0);
  const total = basePrice + lensPrice + addonsPrice;

  const toggleAddon = (id) => {
    setAddons(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const lensTypeName = lensOptions.find(l => l.id === lensType)?.name || "—";
  const colorName = frame.colors[colorIdx].name;

  /* Step "done" detection */
  const stepDone = [true, true, addons.size > 0, !!rx];

  const canAdd = !!rx; // Prevention — disable button until Rx chosen

  const handleAddToBag = () => {
    if (!canAdd) return;
    window.Cart.add({
      frameId: frame.id,
      color: colorName,
      lens: lensType,
      lensLabel: lensTypeName,
      addons: [...addons].map(id => addonOptions.find(a => a.id === id)?.name).filter(Boolean),
      rx: rx,
      price: total,
    });
    window.toast && window.toast(`${frame.name} added to your bag.`);
    setTimeout(() => window.openCart && window.openCart(), 300);
  };

  return (
    <>
      <SubNav/>

      <div className="page">
        <div className="container-wide">
          <div className="breadcrumb">
            <a href="Lumen Eye Care.html">Home</a>
            <span className="sep">/</span>
            <a href="Lumen Eye Care.html#frames">Frames</a>
            <span className="sep">/</span>
            <span className="current">{frame.name}</span>
          </div>

          <div className="pdp-grid">
            {/* Gallery */}
            <div className="pdp-gallery">
              <div className="pdp-thumbs">
                {frame.colors.map((c, i) => (
                  <div
                    key={i}
                    className={`pdp-thumb ${colorIdx === i ? "active" : ""}`}
                    onClick={() => setColorIdx(i)}
                  >
                    <FrameSVG shape={frame.shape} color={c.hex}/>
                  </div>
                ))}
              </div>

              <div className="pdp-stage">
                <div className="pdp-stage-badges">
                  {frame.badge && (
                    <span className="frame-badge sage" style={{position: "static"}}>{frame.badge}</span>
                  )}
                </div>
                <div className="pdp-stage-actions">
                  <button className="icon-btn" aria-label="Favourite"><Icon name="heart" size={16}/></button>
                  <button className="icon-btn" aria-label="Share"><Icon name="share" size={16}/></button>
                </div>
                <FrameSVG shape={frame.shape} color={frame.colors[colorIdx].hex}/>
                <a href={`Virtual Try-On.html?frame=${frame.id}`} className="pdp-tryon-cta">
                  <Icon name="cam" size={16}/>
                  Try on virtually
                </a>
              </div>
            </div>

            {/* Info + Builder */}
            <div className="pdp-info">
              <div className="pdp-rating-row">
                <span className="stars">
                  {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={13}/>)}
                </span>
                <span><strong style={{color: "var(--lumen-ink)"}}>4.9</strong> · 248 reviews</span>
                <span className="sep">·</span>
                <span>{frame.gender === "men" ? "Men" : frame.gender === "women" ? "Women" : "Unisex"}</span>
              </div>

              <h1 className="pdp-name">{frame.name}<span className="ital">.</span></h1>
              <p className="pdp-type">{frame.type} · {colorName}</p>

              <div className="pdp-price-summary">
                <span className="pdp-price">&#8373;{total.toLocaleString()}</span>
                <span className="pdp-price-incl">Frame + lenses + delivery included</span>
              </div>
              <p className="pdp-momo">
                Or pay <strong>&#8373;{Math.round(total/3).toLocaleString()}/month</strong> for 3 months with MTN MoMo · 0% interest
              </p>

              {/* What's included strip */}
              <div className="pdp-included">
                <div className="pdp-incl-item">
                  <span className="ico"><Icon name="check" size={14}/></span>
                  Free fitting & adjustments
                </div>
                <div className="pdp-incl-item">
                  <span className="ico"><Icon name="check" size={14}/></span>
                  30-day vision guarantee
                </div>
                <div className="pdp-incl-item">
                  <span className="ico"><Icon name="check" size={14}/></span>
                  2-yr frame warranty
                </div>
              </div>

              {/* Lens Builder */}
              <div className="builder">
                <Step
                  num={1}
                  title="Frame colour"
                  value={colorName}
                  active={openStep === 0}
                  done={stepDone[0] && openStep !== 0}
                  onToggle={() => setOpenStep(openStep === 0 ? -1 : 0)}
                >
                  <div className="color-row">
                    {frame.colors.map((c, i) => (
                      <div
                        key={i}
                        className={`color-opt ${colorIdx === i ? "selected" : ""}`}
                        onClick={() => { setColorIdx(i); setOpenStep(1); }}
                      >
                        <span className="color-swatch-lg" style={{ background: c.hex }}></span>
                        <span className="color-name">{c.name}</span>
                        <span className={`color-stock ${i === 2 ? "low" : ""}`}>
                          {i === 2 ? "Only 3 left" : "In stock"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Step>

                <Step
                  num={2}
                  title="Lens type"
                  value={`${lensTypeName}${lensPrice ? ` · +₵${lensPrice}` : " · Included"}`}
                  active={openStep === 1}
                  done={stepDone[1] && openStep !== 1}
                  onToggle={() => setOpenStep(openStep === 1 ? -1 : 1)}
                >
                  <div className="lens-grid">
                    {lensOptions.map(l => (
                      <button
                        key={l.id}
                        className={`lens-opt ${lensType === l.id ? "selected" : ""}`}
                        onClick={() => { setLensType(l.id); setOpenStep(2); }}
                      >
                        {l.tag && <span className="lens-opt-recommended">{l.tag}</span>}
                        <div className="lens-opt-name">{l.name}</div>
                        <div className="lens-opt-desc">{l.desc}</div>
                        <div className="lens-opt-price">{l.price > 0 ? `+₵${l.price}` : "Included"}</div>
                      </button>
                    ))}
                  </div>
                </Step>

                <Step
                  num={3}
                  title="Add-ons"
                  value={`${addons.size} selected${addonsPrice > 0 ? ` · +₵${addonsPrice}` : ""}`}
                  active={openStep === 2}
                  done={stepDone[2] && openStep !== 2}
                  onToggle={() => setOpenStep(openStep === 2 ? -1 : 2)}
                >
                  <div className="addon-list">
                    {addonOptions.map(a => (
                      <div
                        key={a.id}
                        className={`addon ${addons.has(a.id) ? "checked" : ""}`}
                        onClick={() => toggleAddon(a.id)}
                      >
                        <span className="addon-check">
                          {addons.has(a.id) && <Icon name="check" size={12}/>}
                        </span>
                        <div className="addon-main">
                          <div className="addon-name">{a.name}</div>
                          <div className="addon-desc">{a.desc}</div>
                        </div>
                        <span className={`addon-price ${a.price === 0 ? "free" : ""}`}>
                          {a.price === 0 ? (a.badge || "Free") : `+₵${a.price}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </Step>

                <Step
                  num={4}
                  title="Your prescription"
                  value={rx ? rxOptions.find(r => r.id === rx).name : "Required to add to bag"}
                  active={openStep === 3}
                  done={stepDone[3] && openStep !== 3}
                  onToggle={() => setOpenStep(openStep === 3 ? -1 : 3)}
                >
                  <div className="rx-row">
                    {rxOptions.map(r => (
                      <button
                        key={r.id}
                        className={`rx-opt ${rx === r.id ? "selected" : ""}`}
                        onClick={() => setRx(r.id)}
                      >
                        <div className="rx-opt-icon"><Icon name={r.icon} size={16}/></div>
                        <div className="rx-opt-name">{r.name}</div>
                        <div className="rx-opt-desc">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                  <p style={{
                    marginTop: 16, fontSize: 12.5, color: "var(--lumen-muted)",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <Icon name="info" size={14}/>
                    Don't have a prescription? <a href="Lumen Eye Care.html" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>Book a ₵120 eye test</a> &mdash; we'll fit your new glasses with the results.
                  </p>
                </Step>
              </div>

              {/* Sticky bag */}
              <div className="pdp-bag">
                <div className="pdp-bag-summary">
                  <span className="pdp-bag-total-label">Your total</span>
                  <div className="pdp-bag-total">
                    &#8373;{total.toLocaleString()}
                    {(lensPrice + addonsPrice) > 0 && (
                      <span className="delta">incl. lenses & extras</span>
                    )}
                  </div>
                </div>
                <button className="pdp-bag-bttn" disabled={!canAdd} onClick={handleAddToBag}>
                  {canAdd ? <>Add to bag <Icon name="arrow" size={16}/></> : "Choose prescription option ↑"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related frames */}
        <section className="related" data-screen-label="Related frames">
          <div className="container-wide">
            <div className="section-head">
              <div className="section-head-left">
                <div className="eyebrow"><span className="dot"></span>You might also like</div>
                <h2 className="section-title">More frames in <span className="ital">your shape.</span></h2>
              </div>
            </div>

            <div className="frames-grid">
              {FRAMES.filter(f => f.id !== frame.id).slice(0, 4).map(f => (
                <a key={f.id} href={`Frame Detail.html?frame=${f.id}`} className="frame-card" style={{display: "block"}}>
                  <div className="frame-img">
                    {f.badge && <span className={`frame-badge ${f.badge === "NEW" ? "sage" : ""}`}>{f.badge}</span>}
                    <FrameSVG shape={f.shape} color={f.colors[0].hex}/>
                  </div>
                  <div className="frame-info">
                    <div className="frame-meta">
                      <div>
                        <div className="frame-name">{f.name}</div>
                        <div className="frame-type">{f.type}</div>
                      </div>
                      <div className="frame-price">
                        <span className="from">From</span>
                        &#8373;{f.price}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.FrameDetail = FrameDetail;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<FrameDetail/>);
}
