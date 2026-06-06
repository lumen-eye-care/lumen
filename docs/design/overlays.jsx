/* global React, ReactDOM */
/* Lumen Overlays — Cart drawer, Search, Sign In, Toast.
   Self-mounts to its own portal. Exposes window.openCart / openSearch / openSignIn / closeOverlays / toast. */

const { useState, useEffect, useRef } = React;
const { Icon, LogoMark, FrameSVG, FRAMES, Cart, Session, Favs, MOCK_USER, useCart, useSession } = window;

/* ============================================
   CART DRAWER
   ============================================ */
const CartDrawer = ({ onClose }) => {
  const items = useCart();
  const subtotal = items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
  const delivery = subtotal > 0 && subtotal < 500 ? 25 : 0;
  const total = subtotal + delivery;

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose}></div>
      <aside className="cart-drawer" role="dialog" aria-label="Your bag">
        <div className="cart-head">
          <div className="cart-head-title">
            Your bag
            {items.length > 0 && <span className="cart-head-count">{items.length}</span>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={14}/></button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon"><Icon name="cart" size={26}/></div>
              <h4>Your bag is empty</h4>
              <p>Browse our considered frames, take the lens quiz, or book an eye test to get started.</p>
              <a href="Shop.html" className="btn btn-primary" onClick={onClose}>
                Shop frames <Icon name="arrow" size={14}/>
              </a>
            </div>
          ) : (
            <>
              {items.map(item => {
                const frame = FRAMES.find(f => f.id === item.frameId);
                if (!frame) return null;
                const color = frame.colors.find(c => c.name === item.color) || frame.colors[0];
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-img">
                      <FrameSVG shape={frame.shape} color={color.hex}/>
                    </div>
                    <div className="cart-item-main">
                      <div className="cart-item-name">{frame.name}</div>
                      <div className="cart-item-meta">{item.color} · {item.lensLabel || "Single vision lens"}</div>
                      {item.addons && item.addons.length > 0 && (
                        <div className="cart-item-extras">
                          {item.addons.map((a, i) => <span key={i} className="cart-item-extra">{a}</span>)}
                        </div>
                      )}
                      <div className="cart-item-qty">
                        <button onClick={() => Cart.setQty(item.id, (item.qty || 1) - 1)}><Icon name="minus" size={12}/></button>
                        <span>{item.qty || 1}</span>
                        <button onClick={() => Cart.setQty(item.id, (item.qty || 1) + 1)}><Icon name="plus" size={12}/></button>
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">&#8373;{(item.price * (item.qty || 1)).toLocaleString()}</span>
                      <button className="cart-item-remove" onClick={() => Cart.remove(item.id)}>Remove</button>
                    </div>
                  </div>
                );
              })}

              <div className="cart-promo">
                <Icon name="truck" size={16}/>
                {subtotal >= 500 ? (
                  <>You qualify for <strong>free delivery</strong> across Accra & Kumasi.</>
                ) : (
                  <>Spend <strong>&#8373;{500 - subtotal}</strong> more for free delivery.</>
                )}
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-foot">
            <div className="cart-row">
              <span className="label">Subtotal ({items.reduce((n,i) => n + (i.qty||1), 0)} items)</span>
              <span>&#8373;{subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-row">
              <span className="label">Delivery</span>
              <span>{delivery === 0 ? "Free" : `₵${delivery}`}</span>
            </div>
            <div className="cart-row total">
              <span>Total</span>
              <span>&#8373;{total.toLocaleString()}</span>
            </div>
            <a href="Checkout.html" className="cart-checkout">
              Checkout <Icon name="arrow" size={14}/>
            </a>
            <p className="cart-secondary">
              <Icon name="shield" size={11} style={{verticalAlign: "middle", marginRight: 4}}/>
              Secure checkout · Pay with MoMo, Card or Cash on Delivery
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

/* ============================================
   SEARCH OVERLAY
   ============================================ */
const SearchOverlay = ({ onClose }) => {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const recent = ["Single-vision lenses", "Aviator", "Children's eye test", "Blue-light lenses"];
  const trending = ["Aburi", "Sunglasses", "Home visit", "Contact lenses"];

  const results = q.trim()
    ? FRAMES.filter(f =>
        f.name.toLowerCase().includes(q.toLowerCase()) ||
        f.shape.toLowerCase().includes(q.toLowerCase()) ||
        f.type.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 6)
    : [];

  const onKey = (e) => { if (e.key === "Escape") onClose(); };

  return (
    <div className="search-overlay" onKeyDown={onKey}>
      <div className="search-inner">
        <div className="search-head">
          <Icon name="search" size={24} className="search-icon"/>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search frames, services, articles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <button className="search-close" onClick={onClose}>
            esc <Icon name="x" size={12}/>
          </button>
        </div>

        {!q && (
          <>
            <div className="search-section">
              <div className="search-section-title">Trending searches</div>
              <div className="search-suggestions">
                {trending.map(t => (
                  <button key={t} className="search-chip" onClick={() => setQ(t)}>
                    <Icon name="search" size={12}/>{t}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-section">
              <div className="search-section-title">Quick links</div>
              <div className="search-suggestions">
                <a href="Lumen Eye Care.html" className="search-chip"><Icon name="calendar" size={12}/>Book an eye test</a>
                <a href="Lens Quiz.html" className="search-chip"><Icon name="sparkle" size={12}/>Lens quiz</a>
                <a href="Virtual Try-On.html" className="search-chip"><Icon name="cam" size={12}/>Virtual try-on</a>
                <a href="Account.html?tab=prescriptions" className="search-chip"><Icon name="fileText" size={12}/>Upload prescription</a>
                <a href="Clinics.html" className="search-chip"><Icon name="pin" size={12}/>Find a clinic</a>
              </div>
            </div>
          </>
        )}

        {q && results.length > 0 && (
          <div className="search-section">
            <div className="search-section-title">Frames · {results.length} matches</div>
            {results.map(f => (
              <a key={f.id} href={`Frame Detail.html?frame=${f.id}`} className="search-result-row">
                <div className="search-result-img"><FrameSVG shape={f.shape} color={f.colors[0].hex}/></div>
                <div style={{flex: 1}}>
                  <div className="search-result-name">{f.name}</div>
                  <div className="search-result-type">{f.type}</div>
                </div>
                <div className="search-result-price">&#8373;{f.price}</div>
              </a>
            ))}
          </div>
        )}

        {q && results.length === 0 && (
          <div className="search-section" style={{textAlign: "center", padding: "60px 20px"}}>
            <Icon name="search" size={32} className="search-icon"/>
            <p style={{marginTop: 16, color: "var(--lumen-muted)"}}>No results for "{q}". Try "Aburi", "sunglasses" or "eye test".</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================
   SIGN IN MODAL
   ============================================ */
const SignInModal = ({ onClose, defaultTab = "in" }) => {
  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const submit = (e) => {
    e.preventDefault();
    /* Mock auth — sign in as Ama Mensah */
    Session.signIn(MOCK_USER);
    onClose();
    window.toast && window.toast(`Welcome back, ${MOCK_USER.name.split(" ")[0]}.`);
  };

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose}></div>
      <div className="signin-modal">
        <div className="signin-card">
          <button className="signin-close" onClick={onClose}><Icon name="x" size={14}/></button>

          <div className="signin-logo">
            <LogoMark size={26}/> Lumen
          </div>
          <h2 className="signin-title">
            {tab === "in" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="signin-sub">
            {tab === "in" ? "Sign in to view your orders, prescriptions and appointments." : "Save prescriptions, book quicker, and track your orders."}
          </p>

          <div className="signin-tabs">
            <button className={`signin-tab ${tab === "in" ? "active" : ""}`} onClick={() => setTab("in")}>Sign in</button>
            <button className={`signin-tab ${tab === "up" ? "active" : ""}`} onClick={() => setTab("up")}>Create account</button>
          </div>

          <form onSubmit={submit}>
            {tab === "up" && (
              <div className="signin-field">
                <label>Full name</label>
                <input type="text" placeholder="Ama Mensah"/>
              </div>
            )}
            <div className="signin-field">
              <label>Email or phone</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ama@example.com"/>
            </div>
            <div className="signin-field">
              <label>{tab === "in" ? "Password" : "Choose a password"}</label>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••"/>
            </div>
            {tab === "in" && (
              <div style={{textAlign: "right", marginBottom: 16}}>
                <a href="#" style={{fontSize: 12.5, color: "var(--lumen-blue)", textDecoration: "underline"}}>Forgot password?</a>
              </div>
            )}
            <button type="submit" className="signin-submit">
              {tab === "in" ? "Sign in" : "Create account"}
              <Icon name="arrow" size={14}/>
            </button>
          </form>

          <div className="signin-divider">or continue with</div>
          <div className="signin-social">
            <button type="button" onClick={submit}>
              <span style={{fontSize: 13, fontWeight: 700}}>G</span> Google
            </button>
            <button type="button" onClick={submit}>
              <Icon name="phone" size={13}/> SMS code
            </button>
          </div>

          <p style={{fontSize: 11.5, color: "var(--lumen-muted)", marginTop: 24, lineHeight: 1.5}}>
            By continuing you agree to Lumen's <a href="#" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>Terms</a> and <a href="#" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </>
  );
};

/* ============================================
   USER MENU (signed in dropdown)
   ============================================ */
const UserMenu = ({ user, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div className="user-menu" ref={ref}>
      <div className="user-menu-head">
        <div className="user-menu-name">{user.name}</div>
        <div className="user-menu-email">{user.email}</div>
      </div>
      <a href="Account.html" className="user-menu-item"><span className="ico"><Icon name="user" size={15}/></span>My account</a>
      <a href="Account.html?tab=orders" className="user-menu-item"><span className="ico"><Icon name="cart" size={15}/></span>My orders</a>
      <a href="Account.html?tab=appointments" className="user-menu-item"><span className="ico"><Icon name="calendar" size={15}/></span>Appointments</a>
      <a href="Account.html?tab=prescriptions" className="user-menu-item"><span className="ico"><Icon name="fileText" size={15}/></span>Prescriptions</a>
      <a href="Account.html?tab=saved" className="user-menu-item"><span className="ico"><Icon name="heart" size={15}/></span>Saved frames</a>
      <a href="Account.html?tab=settings" className="user-menu-item"><span className="ico"><Icon name="user" size={15}/></span>Settings</a>
      <div style={{height: 1, background: "var(--lumen-border)", margin: "8px 0"}}></div>
      <a href="#" className="user-menu-item danger" onClick={(e) => { e.preventDefault(); Session.signOut(); window.toast && window.toast("You've been signed out."); onClose(); }}>
        <span className="ico"><Icon name="arrowLeft" size={15}/></span>Sign out
      </a>
    </div>
  );
};

/* ============================================
   TOAST HOST
   ============================================ */
const ToastHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.toast = (msg) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, msg }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
    };
  }, []);

  return (
    <div className="toast-host">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="toast-icon"><Icon name="check" size={12}/></span>
          {t.msg}
        </div>
      ))}
    </div>
  );
};

/* ============================================
   OVERLAYS ROOT
   ============================================ */
const Overlays = () => {
  const [openWhich, setOpenWhich] = useState(null);
  const session = useSession();

  useEffect(() => {
    window.openCart = () => setOpenWhich("cart");
    window.openSearch = () => setOpenWhich("search");
    window.openSignIn = (tab = "in") => setOpenWhich({ name: "signin", tab });
    window.closeOverlays = () => setOpenWhich(null);
    window.requireAuth = (next) => {
      if (Session.isAuthed()) { next && next(); return true; }
      setOpenWhich({ name: "signin", tab: "in" });
      return false;
    };
  }, []);

  /* Close on ESC */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpenWhich(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Lock body scroll when any overlay open */
  useEffect(() => {
    if (openWhich) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [openWhich]);

  const isSignin = openWhich && typeof openWhich === "object" && openWhich.name === "signin";

  return (
    <>
      {openWhich === "cart" && <CartDrawer onClose={() => setOpenWhich(null)}/>}
      {openWhich === "search" && <SearchOverlay onClose={() => setOpenWhich(null)}/>}
      {isSignin && <SignInModal onClose={() => setOpenWhich(null)} defaultTab={openWhich.tab}/>}
      <ToastHost/>
    </>
  );
};

/* Self-mount */
(() => {
  let host = document.getElementById("lumen-overlays-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "lumen-overlays-root";
    document.body.appendChild(host);
  }
  ReactDOM.createRoot(host).render(<Overlays/>);
})();

/* Re-usable Nav Icon Bar component for pages that want it */
window.NavIconBar = ({ inline = false }) => {
  const session = useSession();
  const cartItems = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = cartItems.reduce((n, i) => n + (i.qty || 1), 0);

  return (
    <div className="nav-actions" style={inline ? {} : undefined}>
      <button className="icon-btn" aria-label="Search" onClick={() => window.openSearch()}>
        <Icon name="search" size={16}/>
      </button>

      {session ? (
        <div className="icon-btn-wrap">
          <button className="user-avatar" onClick={() => setMenuOpen(v => !v)} title={session.name}>
            {session.initials}
          </button>
          {menuOpen && <UserMenu user={session} onClose={() => setMenuOpen(false)}/>}
        </div>
      ) : (
        <button className="icon-btn" aria-label="Account" onClick={() => window.openSignIn()}>
          <Icon name="user" size={16}/>
        </button>
      )}

      <div className="icon-btn-wrap">
        <button className="icon-btn" aria-label="Cart" onClick={() => window.openCart()}>
          <Icon name="cart" size={16}/>
        </button>
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </div>
    </div>
  );
};
