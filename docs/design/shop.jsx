/* global React, ReactDOM */
const { useState, useMemo, useEffect } = React;
const { Icon, FrameSVG, FRAMES, SubNav } = window;
const Footer = window.LumenFooter;

const readShopInit = () => {
  const params = window.__lumen_route_params || new URLSearchParams(window.location.search);
  return { cat: params.get("cat") || "optical", sort: params.get("sort") || "featured" };
};

/* Sidebar filter group with collapse */
const FilterGroup = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`shop-filter-group ${!open ? "collapsed" : ""}`}>
      <div className="shop-filter-head" onClick={() => setOpen(!open)}>
        {title}
        <span className="chev"><Icon name="chev" size={14}/></span>
      </div>
      <div className="shop-filter-body">{children}</div>
    </div>
  );
};

const Shop = () => {
  const init = useMemo(readShopInit, []);
  const [cat, setCat] = useState(init.cat);
  const [sort, setSort] = useState(init.sort);
  const [shapes, setShapes] = useState(new Set());
  const [genders, setGenders] = useState(new Set());
  const [colours, setColours] = useState(new Set());
  const [materials, setMaterials] = useState(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  /* Sync category to URL */
  useEffect(() => {
    if (window.__lumen_no_auto) return; // skip in SPA mode
    const url = new URL(window.location.href);
    if (cat === "optical") url.searchParams.delete("cat");
    else url.searchParams.set("cat", cat);
    window.history.replaceState({}, "", url);
  }, [cat]);

  /* Filter logic */
  const filtered = useMemo(() => {
    let items = [...FRAMES];

    if (cat === "sun") {
      items = items.filter(f => f.type.toLowerCase().includes("sun"));
    } else if (cat === "optical") {
      items = items.filter(f => f.type.toLowerCase().includes("optical"));
    } else if (cat === "contacts") {
      return []; // Contact lenses use a different catalog (stub for now)
    }

    if (shapes.size) items = items.filter(f => shapes.has(f.shape));
    if (genders.size) items = items.filter(f => genders.has(f.gender));
    if (materials.size) items = items.filter(f => materials.has(
      f.type.toLowerCase().includes("titanium") ? "titanium" :
      f.type.toLowerCase().includes("metal") ? "metal" :
      "acetate"
    ));
    if (colours.size) items = items.filter(f => f.colors.some(c => colours.has(c.name)));
    if (priceMin) items = items.filter(f => f.price >= parseInt(priceMin));
    if (priceMax) items = items.filter(f => f.price <= parseInt(priceMax));

    switch (sort) {
      case "price-low": items.sort((a, b) => a.price - b.price); break;
      case "price-high": items.sort((a, b) => b.price - a.price); break;
      case "newest": items.sort((a, b) => (b.badge === "NEW" ? 1 : 0) - (a.badge === "NEW" ? 1 : 0)); break;
      case "designer": items.sort((a, b) => b.price - a.price); break;
    }

    return items;
  }, [cat, sort, shapes, genders, colours, materials, priceMin, priceMax]);

  const toggleSet = (set, setSet, val) => {
    const n = new Set(set);
    if (n.has(val)) n.delete(val); else n.add(val);
    setSet(n);
  };

  const clearFilters = () => {
    setShapes(new Set()); setGenders(new Set()); setColours(new Set());
    setMaterials(new Set()); setPriceMin(""); setPriceMax("");
  };

  const activeFilterCount = shapes.size + genders.size + colours.size + materials.size +
    (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

  const allColors = ["Midnight", "Tortoise", "Onyx", "Smoke", "Cocoa", "Garnet", "Sand", "Walnut"];
  const colorHex = {
    Midnight: "#1E3148", Tortoise: "#8B4513", Onyx: "#2D2D2D", Smoke: "#5A6B7A",
    Cocoa: "#8B7355", Garnet: "#7B2C36", Sand: "#C0A878", Walnut: "#5C4033",
  };

  return (
    <>
      <SubNav/>

      <section className="shop-hero" data-screen-label="01 Shop hero">
        <div className="container-wide">
          <div className="breadcrumb">
            <a href="Lumen Eye Care.html">Home</a>
            <span className="sep">/</span>
            <span className="current">Shop</span>
          </div>

          <h1 className="shop-hero-title">
            {cat === "sun" ? <>The <span className="ital">sunglasses</span> collection.</> :
             cat === "contacts" ? <>Contact <span className="ital">lenses.</span></> :
             <>Frames, <span className="ital">considered.</span></>}
          </h1>
          <p className="shop-hero-sub">
            {cat === "sun"
              ? "Polarised, prescription-ready, and tuned for Ghana sun. Every pair carries our two-year frame warranty."
              : cat === "contacts"
              ? "From daily disposables to monthlies, toric and multifocal — fitted by our optometrists."
              : "Italian acetate, Japanese titanium, Swiss lenses. Chosen for fit, longevity and design integrity."}
          </p>

          <div className="shop-tabs">
            <button className={`shop-tab ${cat === "optical" ? "active" : ""}`} onClick={() => setCat("optical")}>
              <Icon name="glasses" size={14}/> Optical
            </button>
            <button className={`shop-tab ${cat === "sun" ? "active" : ""}`} onClick={() => setCat("sun")}>
              <Icon name="sun" size={14}/> Sunglasses
            </button>
            <button className={`shop-tab ${cat === "contacts" ? "active" : ""}`} onClick={() => setCat("contacts")}>
              <Icon name="drop" size={14}/> Contact lenses
            </button>
          </div>
        </div>
      </section>

      <div className="container-wide">
        <div className="shop-grid">
          {/* Sidebar */}
          <aside className="shop-sidebar">
            <FilterGroup title="Frame shape">
              {["round", "square", "cateye", "aviator", "oval", "hex"].map(s => (
                <label key={s} className="shop-filter-opt">
                  <input type="checkbox" checked={shapes.has(s)} onChange={() => toggleSet(shapes, setShapes, s)}/>
                  <span style={{textTransform: "capitalize"}}>{s === "cateye" ? "Cat-eye" : s === "hex" ? "Geometric" : s}</span>
                  <span className="count">{FRAMES.filter(f => f.shape === s).length}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Gender">
              {["women", "men", "unisex"].map(g => (
                <label key={g} className="shop-filter-opt">
                  <input type="checkbox" checked={genders.has(g)} onChange={() => toggleSet(genders, setGenders, g)}/>
                  <span style={{textTransform: "capitalize"}}>{g}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Material">
              {[
                { id: "acetate", label: "Italian Acetate" },
                { id: "titanium", label: "Japanese Titanium" },
                { id: "metal", label: "Metal" },
              ].map(m => (
                <label key={m.id} className="shop-filter-opt">
                  <input type="checkbox" checked={materials.has(m.id)} onChange={() => toggleSet(materials, setMaterials, m.id)}/>
                  <span>{m.label}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Colour">
              <div className="shop-color-grid">
                {allColors.map(c => (
                  <span
                    key={c}
                    className={`shop-color-swatch ${colours.has(c) ? "active" : ""}`}
                    style={{ background: colorHex[c] }}
                    onClick={() => toggleSet(colours, setColours, c)}
                    title={c}
                  ></span>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Price range (₵)">
              <div className="shop-price-input">
                <input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}/>
                <input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}/>
              </div>
            </FilterGroup>

            {activeFilterCount > 0 && (
              <button className="shop-clear" onClick={clearFilters}>
                Clear all filters ({activeFilterCount})
              </button>
            )}
          </aside>

          {/* Main */}
          <main className="shop-main">
            {cat === "contacts" ? (
              <div className="shop-empty">
                <h3>Contact lenses — fitted in clinic</h3>
                <p>Contacts need a clinical fitting first. Book a 30-min consultation with an optometrist; we'll prescribe and order your trial pair on the same day.</p>
                <a href="Lumen Eye Care.html#cta" className="btn btn-primary">
                  Book a contact lens consultation <Icon name="arrow" size={14}/>
                </a>
              </div>
            ) : (
              <>
                <div className="shop-toolbar">
                  <div className="shop-count">
                    Showing <strong>{filtered.length}</strong> of <strong>{FRAMES.length}</strong> frames
                  </div>
                  <div className="shop-sort">
                    <label>Sort:</label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                      <option value="featured">Featured</option>
                      <option value="newest">Newest first</option>
                      <option value="price-low">Price: low → high</option>
                      <option value="price-high">Price: high → low</option>
                      <option value="designer">Designer first</option>
                    </select>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="shop-active-filters">
                    {[...shapes].map(s => (
                      <span key={"s"+s} className="shop-active-chip">
                        Shape: {s}
                        <button onClick={() => toggleSet(shapes, setShapes, s)}><Icon name="x" size={10}/></button>
                      </span>
                    ))}
                    {[...genders].map(g => (
                      <span key={"g"+g} className="shop-active-chip">
                        {g}
                        <button onClick={() => toggleSet(genders, setGenders, g)}><Icon name="x" size={10}/></button>
                      </span>
                    ))}
                    {[...colours].map(c => (
                      <span key={"c"+c} className="shop-active-chip">
                        {c}
                        <button onClick={() => toggleSet(colours, setColours, c)}><Icon name="x" size={10}/></button>
                      </span>
                    ))}
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div className="shop-empty">
                    <h3>No frames match these filters</h3>
                    <p>Try clearing some filters or browsing all frames.</p>
                    <button className="btn btn-primary" onClick={clearFilters}>
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="frames-grid">
                    {filtered.map(f => (
                      <a key={f.id} href={`Frame Detail.html?frame=${f.id}`} className="frame-card" style={{display: "block"}}>
                        <div className="frame-img">
                          {f.badge && <span className={`frame-badge ${f.badge === "NEW" ? "sage" : f.badge === "LIMITED" ? "warm" : ""}`}>{f.badge}</span>}
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
                          <div className="frame-colors">
                            {f.colors.map((c, i) => (
                              <span key={i} className="frame-swatch" style={{ background: c.hex }}></span>
                            ))}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer/>
    </>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.Shop = Shop;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<Shop/>);
}
