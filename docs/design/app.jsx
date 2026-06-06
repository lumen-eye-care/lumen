/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================
   ICONS (lucide-style inline SVG)
   ============================================ */
const Icon = ({ name, size = 20, stroke = 1.5, className = "" }) => {
  const paths = {
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
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
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
};

/* ============================================
   LOGO MARK
   ============================================ */
const LogoMark = ({ size = 30, color = "#0F4C81" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1.5"/>
    <path d="M6 20 Q20 8 34 20 Q20 32 6 20Z" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="20" cy="20" r="4.5" fill={color}/>
    <circle cx="21.5" cy="18.5" r="1.4" fill="#fff"/>
  </svg>
);

/* ============================================
   FRAME SVG (illustrative line drawings)
   ============================================ */
const FrameSVG = ({ shape, color = "#1E3148" }) => {
  const stroke = { stroke: color, strokeWidth: 4.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const fill = { fill: color };

  const shapes = {
    round: (
      <g>
        <circle cx="60" cy="80" r="38" {...stroke}/>
        <circle cx="180" cy="80" r="38" {...stroke}/>
        <path d="M98 78 L142 78" {...stroke}/>
        <path d="M22 70 L8 60" {...stroke}/>
        <path d="M218 70 L232 60" {...stroke}/>
      </g>
    ),
    square: (
      <g>
        <rect x="22" y="50" width="80" height="58" rx="8" {...stroke}/>
        <rect x="138" y="50" width="80" height="58" rx="8" {...stroke}/>
        <path d="M102 78 L138 78" {...stroke}/>
        <path d="M22 60 L8 50" {...stroke}/>
        <path d="M218 60 L232 50" {...stroke}/>
      </g>
    ),
    cateye: (
      <g>
        <path d="M22 95 Q30 50 75 50 Q105 50 102 80 Q98 110 60 110 Q22 110 22 95Z" {...stroke}/>
        <path d="M218 95 Q210 50 165 50 Q135 50 138 80 Q142 110 180 110 Q218 110 218 95Z" {...stroke}/>
        <path d="M102 78 L138 78" {...stroke}/>
        <path d="M22 88 L8 78" {...stroke}/>
        <path d="M218 88 L232 78" {...stroke}/>
      </g>
    ),
    aviator: (
      <g>
        <path d="M18 60 L102 60 Q102 115 60 115 Q22 115 18 80 Z" {...stroke}/>
        <path d="M222 60 L138 60 Q138 115 180 115 Q218 115 222 80 Z" {...stroke}/>
        <path d="M102 70 Q120 65 138 70" {...stroke}/>
        <path d="M18 60 L8 50" {...stroke}/>
        <path d="M222 60 L232 50" {...stroke}/>
      </g>
    ),
    oval: (
      <g>
        <ellipse cx="60" cy="80" rx="42" ry="32" {...stroke}/>
        <ellipse cx="180" cy="80" rx="42" ry="32" {...stroke}/>
        <path d="M102 78 L138 78" {...stroke}/>
        <path d="M18 70 L8 60" {...stroke}/>
        <path d="M222 70 L232 60" {...stroke}/>
      </g>
    ),
    hex: (
      <g>
        <path d="M30 50 L90 50 L102 80 L90 110 L30 110 L18 80 Z" {...stroke}/>
        <path d="M150 50 L210 50 L222 80 L210 110 L150 110 L138 80 Z" {...stroke}/>
        <path d="M102 80 L138 80" {...stroke}/>
        <path d="M18 75 L8 65" {...stroke}/>
        <path d="M222 75 L232 65" {...stroke}/>
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 240 160" className="frame-svg" xmlns="http://www.w3.org/2000/svg">
      {shapes[shape] || shapes.round}
    </svg>
  );
};

/* ============================================
   NAV
   ============================================ */
/* Helpers for cart count badge + user avatar — re-render when state changes */
const UserAvatarSlot = () => {
  const session = window.useSession ? window.useSession() : null;
  const [menuOpen, setMenuOpen] = useState(false);
  if (!session) return null;
  return (
    <div className="icon-btn-wrap" onClick={(e) => e.stopPropagation()}>
      <button className="user-avatar" onClick={() => setMenuOpen(v => !v)} title={session.name}>
        {session.initials}
      </button>
      {menuOpen && (
        <div className="user-menu" onClick={() => setMenuOpen(false)}>
          <div className="user-menu-head">
            <div className="user-menu-name">{session.name}</div>
            <div className="user-menu-email">{session.email}</div>
          </div>
          <a href="Account.html" className="user-menu-item"><span className="ico"><Icon name="user" size={15}/></span>My account</a>
          <a href="Account.html?tab=orders" className="user-menu-item"><span className="ico"><Icon name="cart" size={15}/></span>My orders</a>
          <a href="Account.html?tab=appointments" className="user-menu-item"><span className="ico"><Icon name="calendar" size={15}/></span>Appointments</a>
          <a href="Account.html?tab=prescriptions" className="user-menu-item"><span className="ico"><Icon name="fileText" size={15}/></span>Prescriptions</a>
          <a href="Account.html?tab=saved" className="user-menu-item"><span className="ico"><Icon name="heart" size={15}/></span>Saved frames</a>
          <div style={{height: 1, background: "var(--lumen-border)", margin: "8px 0"}}></div>
          <a href="#" className="user-menu-item danger" onClick={(e) => { e.preventDefault(); window.Session.signOut(); window.toast && window.toast("You've been signed out."); }}>
            <span className="ico"><Icon name="arrowLeft" size={15}/></span>Sign out
          </a>
        </div>
      )}
    </div>
  );
};

const CartCountBadge = () => {
  const items = window.useCart ? window.useCart() : [];
  const n = items.reduce((sum, i) => sum + (i.qty || 1), 0);
  if (!n) return null;
  return <span className="cart-badge">{n}</span>;
};

const NavAccountSlot = () => {
  const session = window.useSession ? window.useSession() : null;
  if (session) return <UserAvatarSlot/>;
  return (
    <button className="icon-btn" aria-label="Account" onClick={() => window.openSignIn && window.openSignIn()}>
      <Icon name="user" size={16}/>
    </button>
  );
};

const Nav = ({ onBook }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container-wide nav-inner">
        <a href="#" className="logo">
          <span className="logo-mark"><LogoMark/></span>
          Lumen
        </a>

        <div className="nav-links">
          <span className="nav-link" data-comment-anchor="nav-shop">
            Shop glasses <Icon name="chev" size={14} className="chev"/>
            <div className="megamenu">
              <a href="Shop.html" className="megamenu-item">
                <div className="megamenu-icon"><Icon name="glasses" size={18}/></div>
                <div>
                  <div className="megamenu-title">Prescription glasses</div>
                  <div className="megamenu-desc">From ₵450 — single vision, varifocals, readers</div>
                </div>
              </a>
              <a href="Shop.html?cat=sun" className="megamenu-item">
                <div className="megamenu-icon"><Icon name="sun" size={18}/></div>
                <div>
                  <div className="megamenu-title">Sunglasses</div>
                  <div className="megamenu-desc">Polarised and prescription-ready</div>
                </div>
              </a>
              <a href="Shop.html?cat=contacts" className="megamenu-item">
                <div className="megamenu-icon"><Icon name="drop" size={18}/></div>
                <div>
                  <div className="megamenu-title">Contact lenses</div>
                  <div className="megamenu-desc">Dailies, monthlies, toric, multifocal</div>
                </div>
              </a>
              <a href="Shop.html?sort=designer" className="megamenu-item">
                <div className="megamenu-icon"><Icon name="sparkle" size={18}/></div>
                <div>
                  <div className="megamenu-title">Designer collections</div>
                  <div className="megamenu-desc">Curated luxury & heritage labels</div>
                </div>
              </a>
            </div>
          </span>
          <a href="Virtual Try-On.html" className="nav-link">Virtual try-on</a>
          <a href="Clinics.html" className="nav-link">
            Eye tests <Icon name="chev" size={14} className="chev"/>
          </a>
          <a href="Lens Quiz.html" className="nav-link">Lens guide</a>
          <a href="Journal.html" className="nav-link">Journal</a>
        </div>

        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search" onClick={() => window.openSearch && window.openSearch()}><Icon name="search" size={16}/></button>
          <NavAccountSlot/>
          <div className="icon-btn-wrap">
            <button className="icon-btn" aria-label="Cart" onClick={() => window.openCart && window.openCart()}><Icon name="cart" size={16}/></button>
            <CartCountBadge/>
          </div>
          <button className="btn btn-primary" onClick={onBook}>
            Book eye test
            <Icon name="arrowUp" size={14} className="btn-arrow"/>
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ============================================
   HERO
   ============================================ */
const Hero = ({ onBook }) => (
  <section className="hero" data-screen-label="01 Hero">
    <div className="container-wide">
      <div className="hero-grid">
        <div className="hero-left">
          <div className="eyebrow"><span className="dot"></span>An eye clinic, refined</div>
          <h1 className="hero-headline">
            See clearly.<br/>
            <span className="ital">Live beautifully.</span>
          </h1>
          <p className="hero-sub">
            Comprehensive eye care and considered eyewear under one roof. Book a clinical
            eye test with one of our optometrists — or shop hand-picked frames with
            prescription lenses fitted by our lab.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onBook}>
              Book an eye test
              <Icon name="arrowUp" size={16} className="btn-arrow"/>
            </button>
            <a href="Lens Quiz.html" className="btn btn-ghost btn-lg">
              <Icon name="play" size={12}/>
              Take the lens quiz
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-num">12k+</div>
              <div className="hero-stat-label">Eye tests carried out last year</div>
            </div>
            <div className="hero-divider"></div>
            <div>
              <div className="hero-stat-num">4.9</div>
              <div className="hero-stat-label">Average rating across 3,200 reviews</div>
            </div>
            <div className="hero-divider"></div>
            <div>
              <div className="hero-stat-num">22 min</div>
              <div className="hero-stat-label">Average consultation time</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-img-frame">
            <image-slot id="hero-portrait"
              placeholder="Drop a portrait of an optometrist or model wearing glasses"
              shape="rect">
            </image-slot>
            <div className="scan-line"></div>
          </div>

          <div className="hero-card card-tl">
            <div className="card-icon blue"><Icon name="shield" size={18}/></div>
            <div>
              <div className="card-title">GOC-registered clinicians</div>
              <div className="card-sub">Fully qualified optometrists on every visit</div>
            </div>
          </div>

          <div className="hero-card card-br">
            <div className="card-rating">
              <div className="card-stars">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={12}/>)}
              </div>
              <span style={{fontWeight: 600}}>4.9</span>
            </div>
            <div>
              <div className="card-title">"The most thorough eye test I've had."</div>
              <div className="card-sub">— Ama M., Accra</div>
            </div>
          </div>

          <div className="hero-card card-bl">
            <div className="card-icon"><Icon name="calendar" size={18}/></div>
            <div>
              <div className="card-title">Next slot · Today 4:20pm</div>
              <div className="card-sub">East Legon clinic · 3 left</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ============================================
   TRUST STRIP
   ============================================ */
const Trust = () => (
  <section className="trust-strip" data-screen-label="02 Trust">
    <div className="container-wide">
      <p className="trust-label">Trusted by clinicians, partners and patients across Ghana</p>
      <div className="trust-logos">
        <span className="trust-logo">⊙ <span className="mark">GHANA OPTOMETRY ASSOC.</span></span>
        <span className="trust-logo serif">Ministry of Health</span>
        <span className="trust-logo">◇ <span className="mark">ZEISS PARTNER</span></span>
        <span className="trust-logo serif">Allied Health Professions Council</span>
        <span className="trust-logo">▲ <span className="mark">ESSILOR LAB</span></span>
        <span className="trust-logo serif">NHIS Accepted</span>
      </div>
    </div>
  </section>
);

/* ============================================
   SERVICES
   ============================================ */
const Services = ({ onBook }) => {
  const services = [
    {
      icon: "eye",
      title: "In-clinic eye test",
      desc: "A 30-minute comprehensive consultation covering refraction, retinal imaging and ocular health.",
      tag: "From \u20b5120",
      cta: "Book now",
    },
    {
      icon: "home",
      title: "Home visit eye test",
      desc: "Bring the clinic to you. Ideal for elderly patients or anyone who prefers care at home.",
      tag: "From \u20b5250",
      cta: "Arrange visit",
    },
    {
      icon: "cam",
      title: "Virtual try-on",
      desc: "See yourself in any frame from our catalogue using your camera — no appointment needed.",
      tag: "Try it",
      cta: "Open try-on",
      featured: true,
    },
    {
      icon: "upload",
      title: "Upload your prescription",
      desc: "Already have a recent prescription? Upload it in seconds and skip straight to choosing frames.",
      tag: "1 min",
      cta: "Upload prescription",
    },
    {
      icon: "sparkle",
      title: "Lens recommendation quiz",
      desc: "Five questions to find the right lens technology for your lifestyle, screen-time and vision.",
      tag: "5 questions",
      cta: "Start quiz",
    },
    {
      icon: "glasses",
      title: "Frames + prescription lenses",
      desc: "Shop curated frames, choose your lenses, and let our lab take care of the rest.",
      tag: "Free returns",
      cta: "Shop frames",
    },
  ];

  return (
    <section className="services" data-screen-label="03 Services" id="services">
      <div className="container-wide">
        <div className="section-head">
          <div className="section-head-left">
            <div className="eyebrow"><span className="dot"></span>Everything we do</div>
            <h2 className="section-title">A complete <span className="ital">eye care</span> service, end-to-end.</h2>
          </div>
          <p className="section-sub">
            From your first eye test through to fitting your new lenses — we handle every step
            in one place, so you don't have to.
          </p>
        </div>

        <div className="services-grid">
          {services.map((s, i) => (
            <div key={i} className={`service-card ${s.featured ? "featured" : ""}`}
              onClick={() => {
                if (i === 0 || i === 1) onBook();
                else if (i === 2) window.location.href = "Virtual Try-On.html";
                else if (i === 4) window.location.href = "Lens Quiz.html";
                else if (i === 5) window.location.href = "Frame Detail.html";
              }}
            >
              <span className="service-tag">{s.tag}</span>
              <div className="service-icon"><Icon name={s.icon} size={22}/></div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
              <span className="service-link">
                {s.cta} <Icon name="arrow" size={14}/>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================
   FRAMES
   ============================================ */
const FRAMES_DATA = [
  { id: 1, name: "Accra", shape: "round", type: "Acetate · Optical", price: 580, badge: "BESTSELLER", colors: ["#1E3148", "#8B4513", "#2D2D2D"], gender: "men", priceRange: "mid" },
  { id: 2, name: "Achimota", shape: "square", type: "Titanium · Optical", price: 850, badge: null, colors: ["#2D2D2D", "#5A6B7A", "#8B7355"], gender: "men", priceRange: "high" },
  { id: 3, name: "Aburi", shape: "cateye", type: "Acetate · Optical", price: 720, badge: "NEW", colors: ["#1E3148", "#7B2C36", "#2D2D2D"], gender: "women", priceRange: "mid" },
  { id: 4, name: "Labadi", shape: "aviator", type: "Metal · Sun", price: 890, badge: null, colors: ["#8B7355", "#2D2D2D", "#C0A878"], gender: "unisex", priceRange: "high" },
  { id: 5, name: "Aya", shape: "oval", type: "Acetate · Optical", price: 490, badge: null, colors: ["#7B2C36", "#1E3148", "#2D2D2D"], gender: "women", priceRange: "mid" },
  { id: 6, name: "Bonwire", shape: "hex", type: "Acetate · Optical", price: 680, badge: "LIMITED", colors: ["#2D2D2D", "#5C4033", "#1E3148"], gender: "unisex", priceRange: "mid" },
  { id: 7, name: "Osu", shape: "round", type: "Metal · Optical", price: 760, badge: null, colors: ["#C0A878", "#2D2D2D", "#5A6B7A"], gender: "men", priceRange: "high" },
  { id: 8, name: "Kente", shape: "cateye", type: "Acetate · Sun", price: 620, badge: null, colors: ["#2D2D2D", "#7B2C36", "#5C4033"], gender: "women", priceRange: "mid" },
];

const Frames = () => {
  const [filter, setFilter] = useState("all");
  const [favs, setFavs] = useState(new Set());

  const filters = [
    { id: "all", label: "All frames", count: 8 },
    { id: "round", label: "Round", count: 2 },
    { id: "square", label: "Square", count: 1 },
    { id: "cateye", label: "Cat-eye", count: 2 },
    { id: "aviator", label: "Aviator", count: 1 },
    { id: "oval", label: "Oval", count: 1 },
    { id: "hex", label: "Geometric", count: 1 },
  ];

  const filtered = useMemo(() => {
    if (filter === "all") return FRAMES_DATA;
    return FRAMES_DATA.filter(f => f.shape === filter);
  }, [filter]);

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavs(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <section className="frames" data-screen-label="04 Frames" id="frames">
      <div className="container-wide">
        <div className="section-head">
          <div className="section-head-left">
            <div className="eyebrow"><span className="dot"></span>This season</div>
            <h2 className="section-title">Frames, <span className="ital">considered.</span></h2>
          </div>
          <p className="section-sub">
            Italian acetate, Japanese titanium and Swiss lenses. Every frame in our collection is
            chosen for fit, longevity and design integrity.
          </p>
        </div>

        <div className="frames-filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className="count">{f.count}</span>
            </button>
          ))}
          <div className="filter-divider"></div>
          <button className="filter-chip">
            <Icon name="user" size={14}/> Gender
            <Icon name="chev" size={12}/>
          </button>
          <button className="filter-chip">
            Price range
            <Icon name="chev" size={12}/>
          </button>
          <button className="filter-chip">
            Color
            <Icon name="chev" size={12}/>
          </button>
        </div>

        <div className="frames-grid">
          {filtered.map(frame => (
            <div key={frame.id} className="frame-card" onClick={() => window.location.href = `Frame Detail.html?frame=${frame.id}`}>
              <div className="frame-img">
                {frame.badge && (
                  <span className={`frame-badge ${frame.badge === "NEW" ? "sage" : frame.badge === "LIMITED" ? "warm" : ""}`}>
                    {frame.badge}
                  </span>
                )}
                <button
                  className={`frame-fav ${favs.has(frame.id) ? "active" : ""}`}
                  onClick={(e) => toggleFav(frame.id, e)}
                  aria-label="Favourite"
                >
                  <Icon name="heart" size={16} stroke={favs.has(frame.id) ? 0 : 1.5}
                    style={favs.has(frame.id) ? {fill: "currentColor"} : {}}/>
                </button>
                <FrameSVG shape={frame.shape} color={frame.colors[0]}/>
                <button className="frame-tryon" onClick={(e) => { e.stopPropagation(); window.location.href = `Virtual Try-On.html?frame=${frame.id}`; }}>
                  <Icon name="cam" size={14}/>
                  Virtual try-on
                </button>
              </div>
              <div className="frame-info">
                <div className="frame-meta">
                  <div>
                    <div className="frame-name">{frame.name}</div>
                    <div className="frame-type">{frame.type}</div>
                  </div>
                  <div className="frame-price">
                    <span className="from">From</span>
                    &#8373;{frame.price}
                  </div>
                </div>
                <div className="frame-colors">
                  {frame.colors.map((c, i) => (
                    <span key={i} className="frame-swatch" style={{ background: c }}></span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================
   QUIZ (Lens recommendation)
   ============================================ */
const Quiz = () => {
  const [sel, setSel] = useState(2);
  const options = [
    "I spend most of my day on screens",
    "I'm outdoors a lot — driving or sport",
    "I work indoors with mixed lighting",
    "I'm a reader — books, fine print, hobbies",
  ];

  return (
    <section className="quiz" data-screen-label="05 Lens quiz">
      <div className="container-wide">
        <div className="quiz-inner">
          <div className="quiz-left">
            <div className="quiz-eyebrow">
              <span className="dot"></span>Lens recommendation quiz
            </div>
            <h2 className="quiz-title">
              Find the perfect lens — <span className="ital">in five questions.</span>
            </h2>
            <p className="quiz-sub">
              Lens choice matters as much as the frame. Tell us about your lifestyle and we'll
              recommend the right material, coatings and add-ons for the way you actually live.
            </p>
            <div className="quiz-points">
              {[
                "Personalised to your screen time and prescription",
                "Compare single-vision, varifocal and blue-light options",
                "See your full price up-front — no surprises",
              ].map((p, i) => (
                <div key={i} className="quiz-point">
                  <span className="quiz-point-tick"><Icon name="check" size={12}/></span>
                  {p}
                </div>
              ))}
            </div>
            <div className="quiz-cta-row">
              <a href="Lens Quiz.html" className="btn btn-blue btn-lg">
                Start the quiz
                <Icon name="arrow" size={16}/>
              </a>
            </div>
          </div>

          <div className="quiz-visual">
            <div className="quiz-mock">
              <div className="quiz-mock-progress">
                <span>Step 2 of 5</span>
                <div className="quiz-mock-bar">
                  <div className="quiz-mock-bar-fill"></div>
                </div>
              </div>
              <div className="quiz-mock-q">Where do you spend most of your day?</div>
              <div className="quiz-options">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className={`quiz-option ${sel === i ? "selected" : ""}`}
                    onClick={() => setSel(i)}
                  >
                    <span className="quiz-option-radio"></span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================
   TESTIMONIALS
   ============================================ */
const Testimonials = () => {
  const items = [
    {
      featured: true,
      quote: "The most thorough eye test I've had in twenty years \u2014 and the frames are quietly the best I've ever owned.",
      name: "Ama Mensah",
      meta: "Patient since 2023 \u00b7 East Legon",
      initials: "AM",
    },
    {
      quote: "Booked online at 9pm, examined the next morning, glasses in three days. Genuinely effortless.",
      name: "Kwame Osei",
      meta: "First visit \u00b7 Osu clinic",
      initials: "KO",
    },
    {
      quote: "My optometrist actually explained my prescription. I finally understand my eyes.",
      name: "Akosua R.",
      meta: "Family patient \u00b7 Kumasi",
      initials: "AR",
    },
  ];

  return (
    <section className="testimonials" data-screen-label="06 Testimonials">
      <div className="container-wide">
        <div className="section-head">
          <div className="section-head-left">
            <div className="eyebrow"><span className="dot"></span>Reviews</div>
            <h2 className="section-title">Care that <span className="ital">earns trust.</span></h2>
          </div>
          <p className="section-sub">
            3,200+ reviews. 4.9 average. Patients return because we take time — and so does our work.
          </p>
        </div>

        <div className="test-grid">
          {items.map((t, i) => (
            <div key={i} className={`test-card ${t.featured ? "featured" : ""}`}>
              <div className="test-stars">
                {[1,2,3,4,5].map(n => <Icon key={n} name="star" size={14}/>)}
              </div>
              <p className="test-quote">"{t.quote}"</p>
              <div className="test-author">
                <div className="test-avatar">{t.initials}</div>
                <div>
                  <div className="test-name">{t.name}</div>
                  <div className="test-meta">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================
   CTA BANNER
   ============================================ */
const CTABanner = ({ onBook }) => (
  <section className="cta-banner" data-screen-label="07 CTA" id="cta">
    <div className="container-wide">
      <div className="cta-inner">
        <div className="eyebrow" style={{justifyContent: "center", display: "inline-flex", alignItems: "center"}}>
          <span className="dot"></span>Same-week appointments
        </div>
        <h2 className="cta-title">
          Your eyes deserve the <span className="ital">full hour.</span>
        </h2>
        <p className="cta-sub">
          Book a clinical eye test with one of our optometrists. Same-week appointments across
          our Accra and Kumasi clinics.
        </p>
        <div className="cta-actions">
          <button className="btn btn-primary btn-lg" onClick={onBook}>
            Book an eye test
            <Icon name="arrowUp" size={16}/>
          </button>
          <button className="btn btn-light btn-lg">
            <Icon name="phone" size={16}/>
            Call 030 270 0218
          </button>
        </div>
      </div>
    </div>
  </section>
);

/* ============================================
   FOOTER
   ============================================ */
const Footer = () => (
  <footer className="footer" data-screen-label="08 Footer">
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
            <li onClick={() => window.location.hash = '#cta'}>Book an eye test</li>
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

/* ============================================
   BOOKING MODAL — multi step
   ============================================ */
const BookingModal = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [service, setService] = useState("clinic");
  const [date, setDate] = useState(2);
  const [time, setTime] = useState("10:40");
  const [loc, setLoc] = useState("marylebone");
  const [form, setForm] = useState({ first: "", last: "", email: "", phone: "" });

  useEffect(() => {
    if (open) { setStep(0); setService("clinic"); }
  }, [open]);

  if (!open) return null;

  const steps = ["Service", "Date & time", "Clinic", "Your details", "Confirmed"];

  const next = () => setStep(s => Math.min(steps.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const dates = [
    { day: "Mon", num: 19, mon: "May" },
    { day: "Tue", num: 20, mon: "May" },
    { day: "Wed", num: 21, mon: "May" },
    { day: "Thu", num: 22, mon: "May" },
    { day: "Fri", num: 23, mon: "May" },
  ];
  const times = ["09:00", "09:20", "10:00", "10:40", "11:20", "12:00", "14:00", "14:40", "15:20", "16:00", "16:40", "17:20"];
  const unavail = ["09:00", "12:00", "15:20"];

  const locations = [
    { id: "eastlegon", name: "East Legon clinic", addr: "12 Lagos Avenue, East Legon, Accra", meta: "3 SLOTS LEFT" },
    { id: "osu", name: "Osu clinic", addr: "Oxford St, Osu, Accra", meta: "5 SLOTS LEFT" },
    { id: "airport", name: "Airport Residential", addr: "7 Mankata Close, Airport Residential, Accra", meta: "AVAILABLE" },
    { id: "kumasi", name: "Adum clinic, Kumasi", addr: "Prempeh II Street, Adum, Kumasi", meta: "AVAILABLE" },
    { id: "home", name: "Home visit", addr: "We come to your address in Accra or Kumasi", meta: "TUE–SAT" },
  ];

  const serviceOpts = [
    { id: "clinic", icon: "eye", title: "Comprehensive eye test", desc: "30-min consultation with retinal imaging", price: "\u20b5120" },
    { id: "contact", icon: "drop", title: "Contact lens consultation", desc: "Fitting, trial pair and aftercare", price: "\u20b5180" },
    { id: "home", icon: "home", title: "Home visit", desc: "We come to you — full equipment", price: "\u20b5250" },
    { id: "child", icon: "user", title: "Children's eye test", desc: "Under-16, paediatric optometrist", price: "Free" },
  ];

  const selectedLoc = locations.find(l => l.id === loc);
  const selectedDate = dates[date];
  const selectedService = serviceOpts.find(s => s.id === service);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-side">
          <div className="modal-side-eyebrow">
            <span style={{ marginRight: 8 }}>◇</span> Lumen booking
          </div>
          <h3 className="modal-side-title">Book your eye test in under two minutes.</h3>
          <p className="modal-side-sub">
            A clinical consultation with a GOC-registered optometrist. Free to reschedule
            up to 24 hours before.
          </p>
          <div className="modal-steps">
            {steps.map((s, i) => (
              <div key={s} className={`modal-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                <span className="step-circle">
                  {i < step ? <Icon name="check" size={12}/> : i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-body">
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16}/>
          </button>

          {step === 0 && (
            <>
              <div className="modal-step-head">
                <div className="modal-step-num">Step 1 of 4</div>
                <h4 className="modal-step-title">What kind of appointment?</h4>
                <p className="modal-step-sub">Choose the service you'd like to book.</p>
              </div>
              <div className="modal-content">
                <div className="service-opts">
                  {serviceOpts.map(s => (
                    <button
                      key={s.id}
                      className={`service-opt ${service === s.id ? "selected" : ""}`}
                      onClick={() => setService(s.id)}
                    >
                      <div className="service-opt-icon"><Icon name={s.icon} size={18}/></div>
                      <div className="service-opt-title">{s.title}</div>
                      <div className="service-opt-desc">{s.desc}</div>
                      <div className="service-opt-price">{s.price}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <span></span>
                <button className="btn btn-primary" onClick={next}>
                  Continue <Icon name="arrow" size={14}/>
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="modal-step-head">
                <div className="modal-step-num">Step 2 of 4</div>
                <h4 className="modal-step-title">Pick a date and time.</h4>
                <p className="modal-step-sub">Showing slots this week. Tap to switch week.</p>
              </div>
              <div className="modal-content">
                <div className="date-grid">
                  {dates.map((d, i) => (
                    <button
                      key={i}
                      className={`date-pill ${date === i ? "selected" : ""}`}
                      onClick={() => setDate(i)}
                    >
                      <div className="date-pill-day">{d.day}</div>
                      <div className="date-pill-num">{d.num}</div>
                      <div className="date-pill-mon">{d.mon}</div>
                    </button>
                  ))}
                </div>
                <div className="time-label">
                  <Icon name="clock" size={14}/> Available times — {selectedDate.day} {selectedDate.num} {selectedDate.mon}
                </div>
                <div className="time-grid">
                  {times.map(t => {
                    const u = unavail.includes(t);
                    return (
                      <button
                        key={t}
                        disabled={u}
                        className={`time-pill ${time === t ? "selected" : ""} ${u ? "unavail" : ""}`}
                        onClick={() => !u && setTime(t)}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <span className="modal-back" onClick={back}>
                  <Icon name="arrow" size={14} className="" style={{transform: "rotate(180deg)"}}/> Back
                </span>
                <button className="btn btn-primary" onClick={next}>
                  Continue <Icon name="arrow" size={14}/>
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="modal-step-head">
                <div className="modal-step-num">Step 3 of 4</div>
                <h4 className="modal-step-title">Choose a clinic.</h4>
                <p className="modal-step-sub">All four locations have the same equipment and clinicians.</p>
              </div>
              <div className="modal-content">
                <div className="loc-list">
                  {locations.map(l => (
                    <div
                      key={l.id}
                      className={`loc-opt ${loc === l.id ? "selected" : ""}`}
                      onClick={() => setLoc(l.id)}
                    >
                      <div className="loc-icon">
                        <Icon name={l.id === "home" ? "home" : "pin"} size={18}/>
                      </div>
                      <div className="loc-info">
                        <div className="loc-name">{l.name}</div>
                        <div className="loc-addr">{l.addr}</div>
                      </div>
                      <div className="loc-meta">{l.meta}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <span className="modal-back" onClick={back}>← Back</span>
                <button className="btn btn-primary" onClick={next}>
                  Continue <Icon name="arrow" size={14}/>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="modal-step-head">
                <div className="modal-step-num">Step 4 of 4</div>
                <h4 className="modal-step-title">Almost there.</h4>
                <p className="modal-step-sub">A few details so we can confirm your booking.</p>
              </div>
              <div className="modal-content">
                <div className="form-summary">
                  <div className="form-summary-row">
                    <span className="label">Appointment</span>
                    <span className="value">{selectedService.title}</span>
                  </div>
                  <div className="form-summary-row">
                    <span className="label">When</span>
                    <span className="value">{selectedDate.day} {selectedDate.num} {selectedDate.mon} · {time}</span>
                  </div>
                  <div className="form-summary-row">
                    <span className="label">Where</span>
                    <span className="value">{selectedLoc.name}</span>
                  </div>
                  <div className="form-summary-row">
                    <span className="label">Fee</span>
                    <span className="value">{selectedService.price}</span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>First name</label>
                    <input value={form.first} onChange={e => setForm({...form, first: e.target.value})} placeholder="Ama"/>
                  </div>
                  <div className="form-field">
                    <label>Last name</label>
                    <input value={form.last} onChange={e => setForm({...form, last: e.target.value})} placeholder="Mensah"/>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Email</label>
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com"/>
                  </div>
                  <div className="form-field">
                    <label>Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="055 123 4567"/>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <span className="modal-back" onClick={back}>← Back</span>
                <button className="btn btn-primary" onClick={next}>
                  Confirm booking <Icon name="check" size={14}/>
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="confirmation modal-content">
                <div className="conf-check"><Icon name="check" size={32} stroke={2}/></div>
                <h4 className="conf-title">You're booked in.</h4>
                <p className="conf-sub">
                  We've sent a confirmation to <strong>{form.email || "your inbox"}</strong>.
                  You can reschedule any time from your account.
                </p>
                <div className="conf-card">
                  <div className="form-summary-row">
                    <span className="label">{selectedService.title}</span>
                    <span className="value">{selectedService.price}</span>
                  </div>
                  <div style={{height: 1, background: "var(--lumen-border)", margin: "10px 0"}}></div>
                  <div className="form-summary-row" style={{marginBottom: 6}}>
                    <span className="label">Date</span>
                    <span className="value">{selectedDate.day} {selectedDate.num} {selectedDate.mon} · {time}</span>
                  </div>
                  <div className="form-summary-row">
                    <span className="label">Clinic</span>
                    <span className="value">{selectedLoc.name}</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={onClose}>
                  Done <Icon name="check" size={14}/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================
   APP ROOT
   ============================================ */
const App = () => {
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = bookOpen ? "hidden" : "";
  }, [bookOpen]);

  /* Expose openBooking for cross-page nav */
  useEffect(() => {
    window.openBooking = () => setBookOpen(true);
    /* Open booking if URL has ?book=1 or #cta from subpages */
    const params = window.__lumen_route_params || new URLSearchParams(window.location.search);
    if (params.get("book") === "1" || window.location.hash === "#cta") {
      setTimeout(() => setBookOpen(true), 400);
    }
  }, []);

  return (
    <>
      <Nav onBook={() => setBookOpen(true)}/>
      <Hero onBook={() => setBookOpen(true)}/>
      <Trust/>
      <Services onBook={() => setBookOpen(true)}/>
      <Frames/>
      <Quiz/>
      <Testimonials/>
      <CTABanner onBook={() => setBookOpen(true)}/>
      <Footer/>
      <BookingModal open={bookOpen} onClose={() => setBookOpen(false)}/>
    </>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.Home = App;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
}
