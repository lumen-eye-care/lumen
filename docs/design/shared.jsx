/* global React */
/* Shared components for all Lumen pages.
   Exposes Icon, LogoMark, FrameSVG, Nav, Footer to window. */

const Icon = ({ name, size = 20, stroke = 1.5, className = "", style = {} }) => {
  const paths = {
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    arrowLeft: <><path d="M19 12H5M11 19l-7-7 7-7"/></>,
    arrowUp: <><path d="M7 17 17 7M7 7h10v10"/></>,
    chev: <><path d="m6 9 6 6 6-6"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    star: <><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" fill="currentColor"/></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></>,
    cam: <><path d="M23 7l-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
    sparkle: <><path d="M9.5 3 11 7.5 15.5 9 11 10.5 9.5 15 8 10.5 3.5 9 8 7.5 9.5 3Z"/><path d="M18 14l.8 2.4L21 17l-2.2.6L18 20l-.8-2.4L15 17l2.2-.6L18 14Z"/></>,
    glasses: <><circle cx="6" cy="14" r="4"/><circle cx="18" cy="14" r="4"/><path d="M10 14h4M2 10l3-4M22 10l-3-4"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    truck: <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="m15.5 13-1.4 1.4L17 22l-5-3-5 3 2.9-7.6L8.5 13"/></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/></>,
    book: <><path d="M4 19.5a2.5 2.5 0 0 1 2.5-2.5H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15ZM4 4.5v15M20 17H6.5"/></>,
    rotate: <><path d="M3 12a9 9 0 1 0 9-9M3 12l3-3M3 12l3 3"/></>,
    twitter: <><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3Z"/></>,
    insta: <><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2ZM17.5 6.5h.01"/></>,
    fb: <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></>,
    drop: <><path d="M12 2.69 5.66 8.7a8 8 0 1 0 12.68 0L12 2.69Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <><path d="M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    cart: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    play: <><path d="m5 3 14 9-14 9V3Z" fill="currentColor"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    car: <><path d="M5 17h14l1.5-7h-17z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></>,
    refresh: <><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15a9 9 0 0 0 14.85 3.36L23 14"/></>,
    columns: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></>,
    ruler: <><path d="m21 3-9 9-9-9 9-3 9 3Z M3 3v8 M21 3v8"/></>,
    palette: <><path d="M12 2a10 10 0 0 0 0 20c1.66 0 3-1.34 3-3v-1a2 2 0 0 1 2-2h2a3 3 0 0 0 3-3 10 10 0 0 0-10-11Z"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/><circle cx="9.5" cy="7" r="1.2" fill="currentColor"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor"/><circle cx="17" cy="11" r="1.2" fill="currentColor"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      {paths[name]}
    </svg>
  );
};

const LogoMark = ({ size = 30, color = "#0F4C81" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1.5"/>
    <path d="M6 20 Q20 8 34 20 Q20 32 6 20Z" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="20" cy="20" r="4.5" fill={color}/>
    <circle cx="21.5" cy="18.5" r="1.4" fill="#fff"/>
  </svg>
);

const FrameSVG = ({ shape, color = "#1E3148" }) => {
  const stroke = { stroke: color, strokeWidth: 4.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

  const shapes = {
    round: <g><circle cx="60" cy="80" r="38" {...stroke}/><circle cx="180" cy="80" r="38" {...stroke}/><path d="M98 78 L142 78" {...stroke}/><path d="M22 70 L8 60" {...stroke}/><path d="M218 70 L232 60" {...stroke}/></g>,
    square: <g><rect x="22" y="50" width="80" height="58" rx="8" {...stroke}/><rect x="138" y="50" width="80" height="58" rx="8" {...stroke}/><path d="M102 78 L138 78" {...stroke}/><path d="M22 60 L8 50" {...stroke}/><path d="M218 60 L232 50" {...stroke}/></g>,
    cateye: <g><path d="M22 95 Q30 50 75 50 Q105 50 102 80 Q98 110 60 110 Q22 110 22 95Z" {...stroke}/><path d="M218 95 Q210 50 165 50 Q135 50 138 80 Q142 110 180 110 Q218 110 218 95Z" {...stroke}/><path d="M102 78 L138 78" {...stroke}/><path d="M22 88 L8 78" {...stroke}/><path d="M218 88 L232 78" {...stroke}/></g>,
    aviator: <g><path d="M18 60 L102 60 Q102 115 60 115 Q22 115 18 80 Z" {...stroke}/><path d="M222 60 L138 60 Q138 115 180 115 Q218 115 222 80 Z" {...stroke}/><path d="M102 70 Q120 65 138 70" {...stroke}/><path d="M18 60 L8 50" {...stroke}/><path d="M222 60 L232 50" {...stroke}/></g>,
    oval: <g><ellipse cx="60" cy="80" rx="42" ry="32" {...stroke}/><ellipse cx="180" cy="80" rx="42" ry="32" {...stroke}/><path d="M102 78 L138 78" {...stroke}/><path d="M18 70 L8 60" {...stroke}/><path d="M222 70 L232 60" {...stroke}/></g>,
    hex: <g><path d="M30 50 L90 50 L102 80 L90 110 L30 110 L18 80 Z" {...stroke}/><path d="M150 50 L210 50 L222 80 L210 110 L150 110 L138 80 Z" {...stroke}/><path d="M102 80 L138 80" {...stroke}/><path d="M18 75 L8 65" {...stroke}/><path d="M222 75 L232 65" {...stroke}/></g>,
  };

  return (
    <svg viewBox="0 0 240 160" className="frame-svg" xmlns="http://www.w3.org/2000/svg">
      {shapes[shape] || shapes.round}
    </svg>
  );
};

/* Shared frames catalogue */
const FRAMES = [
  { id: 1, name: "Accra", shape: "round", type: "Italian Acetate · Optical", price: 580, badge: "BESTSELLER", colors: [{ name: "Midnight", hex: "#1E3148" }, { name: "Tortoise", hex: "#8B4513" }, { name: "Onyx", hex: "#2D2D2D" }], gender: "men" },
  { id: 2, name: "Achimota", shape: "square", type: "Japanese Titanium · Optical", price: 850, badge: null, colors: [{ name: "Onyx", hex: "#2D2D2D" }, { name: "Smoke", hex: "#5A6B7A" }, { name: "Cocoa", hex: "#8B7355" }], gender: "men" },
  { id: 3, name: "Aburi", shape: "cateye", type: "Italian Acetate · Optical", price: 720, badge: "NEW", colors: [{ name: "Midnight", hex: "#1E3148" }, { name: "Garnet", hex: "#7B2C36" }, { name: "Onyx", hex: "#2D2D2D" }], gender: "women" },
  { id: 4, name: "Labadi", shape: "aviator", type: "Metal · Sun", price: 890, badge: null, colors: [{ name: "Cocoa", hex: "#8B7355" }, { name: "Onyx", hex: "#2D2D2D" }, { name: "Sand", hex: "#C0A878" }], gender: "unisex" },
  { id: 5, name: "Aya", shape: "oval", type: "Italian Acetate · Optical", price: 490, badge: null, colors: [{ name: "Garnet", hex: "#7B2C36" }, { name: "Midnight", hex: "#1E3148" }, { name: "Onyx", hex: "#2D2D2D" }], gender: "women" },
  { id: 6, name: "Bonwire", shape: "hex", type: "Italian Acetate · Optical", price: 680, badge: "LIMITED", colors: [{ name: "Onyx", hex: "#2D2D2D" }, { name: "Walnut", hex: "#5C4033" }, { name: "Midnight", hex: "#1E3148" }], gender: "unisex" },
  { id: 7, name: "Osu", shape: "round", type: "Japanese Metal · Optical", price: 760, badge: null, colors: [{ name: "Sand", hex: "#C0A878" }, { name: "Onyx", hex: "#2D2D2D" }, { name: "Smoke", hex: "#5A6B7A" }], gender: "men" },
  { id: 8, name: "Kente", shape: "cateye", type: "Italian Acetate · Sun", price: 620, badge: null, colors: [{ name: "Onyx", hex: "#2D2D2D" }, { name: "Garnet", hex: "#7B2C36" }, { name: "Walnut", hex: "#5C4033" }], gender: "women" },
];

/* Compact nav used on subpages — links back to homepage sections */
const SubNav = ({ minimal = false }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container-wide nav-inner">
        <a href="Lumen Eye Care.html" className="logo">
          <span className="logo-mark"><LogoMark/></span>
          Lumen
        </a>

        {!minimal && (
          <div className="nav-links">
            <a href="Shop.html" className="nav-link">Shop glasses</a>
            <a href="Virtual Try-On.html" className="nav-link">Virtual try-on</a>
            <a href="Clinics.html" className="nav-link">Eye tests</a>
            <a href="Lens Quiz.html" className="nav-link">Lens guide</a>
            <a href="Journal.html" className="nav-link">Journal</a>
          </div>
        )}

        <div className="nav-actions">
          {!minimal && window.NavIconBar && <window.NavIconBar inline/>}
          <a href="Lumen Eye Care.html#cta" className="btn btn-primary" onClick={(e) => {
            if (window.openBooking) { e.preventDefault(); window.openBooking(); }
          }}>
            Book eye test
            <Icon name="arrowUp" size={14} className="btn-arrow"/>
          </a>
        </div>
      </div>
    </nav>
  );
};

/* Expose to window for cross-script use */
Object.assign(window, { Icon, LogoMark, FrameSVG, FRAMES, SubNav });

/* ============================================
   SHARED FOOTER
   ============================================ */
const Footer = () => (
  <footer className="footer">
    <div className="container-wide">
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            <LogoMark color="#fff"/>
            Lumen
          </div>
          <p className="footer-desc">
            A modern eye clinic and considered eyewear house. Four locations across Accra
            and Kumasi, plus home visits.
          </p>
          <div className="footer-newsletter">
            <input type="email" placeholder="Email for new arrivals + lens tips"/>
            <button>Subscribe</button>
          </div>
        </div>

        <div className="footer-col">
          <h4>Eye care</h4>
          <ul>
            <li><a href="Lumen Eye Care.html#cta" style={{color: "inherit"}}>Book an eye test</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Home visit booking</a></li>
            <li><a href="Account.html?tab=prescriptions" style={{color: "inherit"}}>Upload prescription</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Contact lens fitting</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Children's eye tests <span className="new-tag">New</span></a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="Shop.html" style={{color: "inherit"}}>All frames</a></li>
            <li><a href="Shop.html?cat=sun" style={{color: "inherit"}}>Sunglasses</a></li>
            <li><a href="Shop.html?sort=designer" style={{color: "inherit"}}>Designer collections</a></li>
            <li><a href="Lens Quiz.html" style={{color: "inherit"}}>Lens guide</a></li>
            <li><a href="Virtual Try-On.html" style={{color: "inherit"}}>Virtual try-on</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Clinics</h4>
          <ul>
            <li><a href="Clinics.html" style={{color: "inherit"}}>East Legon, Accra</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Osu, Accra</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Airport Residential</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Adum, Kumasi</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Home visits</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="Journal.html" style={{color: "inherit"}}>Our story</a></li>
            <li><a href="Journal.html" style={{color: "inherit"}}>Journal</a></li>
            <li><a href="Journal.html" style={{color: "inherit"}}>Careers</a></li>
            <li><a href="Journal.html" style={{color: "inherit"}}>Press</a></li>
            <li><a href="Clinics.html" style={{color: "inherit"}}>Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Lumen Eye Care Ltd · Licensed by AHPC Ghana · TIN C0012876452</span>
        <div className="footer-social">
          <a href="#"><Icon name="insta" size={14}/></a>
          <a href="#"><Icon name="twitter" size={14}/></a>
          <a href="#"><Icon name="fb" size={14}/></a>
        </div>
      </div>
    </div>
  </footer>
);

window.LumenFooter = Footer;

/* ============================================
   CART + SESSION STORE (localStorage backed)
   ============================================ */
const CART_KEY = "lumen-cart-v1";
const SESSION_KEY = "lumen-session-v1";
const FAVS_KEY = "lumen-favs-v1";

const safeRead = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
};
const safeWrite = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const subscribers = {};
const notify = (key) => (subscribers[key] || []).forEach(fn => fn());
const subscribe = (key, fn) => {
  subscribers[key] = subscribers[key] || [];
  subscribers[key].push(fn);
  return () => { subscribers[key] = subscribers[key].filter(f => f !== fn); };
};

const Cart = {
  get: () => safeRead(CART_KEY, []),
  count: () => Cart.get().reduce((n, i) => n + (i.qty || 1), 0),
  subtotal: () => Cart.get().reduce((s, i) => s + (i.price * (i.qty || 1)), 0),
  add: (item) => {
    const items = Cart.get();
    const existing = items.findIndex(i => i.frameId === item.frameId && i.color === item.color && i.lens === item.lens);
    if (existing >= 0) {
      items[existing].qty = (items[existing].qty || 1) + 1;
    } else {
      items.push({ ...item, qty: 1, id: Date.now() + Math.random() });
    }
    safeWrite(CART_KEY, items); notify("cart"); return items;
  },
  setQty: (id, qty) => {
    const items = Cart.get().map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i);
    safeWrite(CART_KEY, items); notify("cart");
  },
  remove: (id) => {
    safeWrite(CART_KEY, Cart.get().filter(i => i.id !== id)); notify("cart");
  },
  clear: () => { safeWrite(CART_KEY, []); notify("cart"); },
  subscribe: (fn) => subscribe("cart", fn),
};

const Session = {
  get: () => safeRead(SESSION_KEY, null),
  isAuthed: () => !!Session.get(),
  signIn: (user) => { safeWrite(SESSION_KEY, user); notify("session"); },
  signOut: () => { localStorage.removeItem(SESSION_KEY); notify("session"); },
  subscribe: (fn) => subscribe("session", fn),
};

const Favs = {
  get: () => new Set(safeRead(FAVS_KEY, [])),
  has: (id) => Favs.get().has(id),
  toggle: (id) => {
    const s = Favs.get();
    if (s.has(id)) s.delete(id); else s.add(id);
    safeWrite(FAVS_KEY, [...s]); notify("favs");
    return s;
  },
  subscribe: (fn) => subscribe("favs", fn),
};

/* React hooks */
const useCart = () => {
  const [items, setItems] = React.useState(Cart.get());
  React.useEffect(() => Cart.subscribe(() => setItems(Cart.get())), []);
  return items;
};
const useSession = () => {
  const [s, setS] = React.useState(Session.get());
  React.useEffect(() => Session.subscribe(() => setS(Session.get())), []);
  return s;
};
const useFavs = () => {
  const [s, setS] = React.useState(Favs.get());
  React.useEffect(() => Favs.subscribe(() => setS(Favs.get())), []);
  return s;
};

/* Mock user for sign-in */
const MOCK_USER = {
  name: "Ama Mensah",
  initials: "AM",
  email: "ama.mensah@example.com",
  phone: "+233 55 213 8821",
  joined: "2024-04",
};

/* Mock account data — orders, appointments, prescriptions */
const ACCOUNT_DATA = {
  orders: [
    { id: "LMN-24197", date: "2026-05-12", status: "Out for delivery", total: 1180, items: 2, eta: "Tomorrow", frame: "Aburi", colour: "Garnet" },
    { id: "LMN-24102", date: "2026-04-28", status: "Delivered", total: 760, items: 1, frame: "Osu", colour: "Sand" },
    { id: "LMN-23811", date: "2026-02-04", status: "Delivered", total: 490, items: 1, frame: "Aya", colour: "Midnight" },
  ],
  appointments: [
    { id: "APT-9821", date: "2026-05-23", time: "10:40", clinic: "East Legon clinic", type: "Annual eye test", status: "upcoming" },
    { id: "APT-9542", date: "2025-05-18", time: "14:00", clinic: "Osu clinic", type: "Comprehensive eye test", status: "past" },
  ],
  prescriptions: [
    { id: "RX-2026-05", issued: "2026-05-18", optometrist: "Dr. Naa Adei", valid: "2028-05", od_sph: "-1.50", od_cyl: "-0.50", od_axis: "180", os_sph: "-1.25", os_cyl: "-0.25", os_axis: "175", pd: "63" },
    { id: "RX-2024-04", issued: "2024-04-12", optometrist: "Dr. Kwesi Boateng", valid: "2026-04", od_sph: "-1.25", od_cyl: "-0.50", od_axis: "180", os_sph: "-1.00", os_cyl: "-0.25", os_axis: "175", pd: "63" },
  ],
  addresses: [
    { id: 1, label: "Home", line1: "12 Lagos Avenue", line2: "East Legon, Accra", default: true, name: "Ama Mensah", phone: "+233 55 213 8821" },
    { id: 2, label: "Office", line1: "Stanbic Heights, 4th Floor", line2: "Airport City, Accra", default: false, name: "Ama Mensah", phone: "+233 55 213 8821" },
  ],
  payments: [
    { id: 1, type: "momo", network: "MTN MoMo", number: "•••• 8821", default: true },
    { id: 2, type: "card", brand: "Visa", number: "•••• 4924", default: false },
  ],
  savedFrames: [3, 6, 7], // frame IDs
};

Object.assign(window, { Cart, Session, Favs, MOCK_USER, ACCOUNT_DATA, useCart, useSession, useFavs });
