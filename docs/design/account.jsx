/* global React, ReactDOM */
const { useState, useEffect } = React;
const { Icon, FrameSVG, FRAMES, Session, MOCK_USER, ACCOUNT_DATA, SubNav, useSession, useCart } = window;
const Footer = window.LumenFooter;

const readAccountTab = () => {
  const params = window.__lumen_route_params || new URLSearchParams(window.location.search);
  return params.get("tab") || "dashboard";
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "orders", label: "Orders", icon: "cart", badge: 1 },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "prescriptions", label: "Prescriptions", icon: "fileText" },
  { id: "saved", label: "Saved frames", icon: "heart" },
  { id: "addresses", label: "Addresses", icon: "pin" },
  { id: "payments", label: "Payment methods", icon: "shield" },
  { id: "settings", label: "Settings", icon: "user" },
];

/* ============================================
   DASHBOARD
   ============================================ */
const Dashboard = ({ session, setTab }) => {
  const next = ACCOUNT_DATA.appointments.find(a => a.status === "upcoming");
  const liveOrder = ACCOUNT_DATA.orders.find(o => o.status !== "Delivered");
  const rxLatest = ACCOUNT_DATA.prescriptions[0];

  return (
    <div className="account-section">
      <h2>Welcome back, <span style={{color: "var(--lumen-blue)", fontStyle: "italic"}}>{session.name.split(" ")[0]}</span>.</h2>
      <p className="sub">Here's what's happening with your eye care and orders.</p>

      <div className="dash-tiles">
        <div className="dash-tile" onClick={() => setTab("orders")} style={{cursor: "pointer"}}>
          <div className="dash-tile-label">Active orders</div>
          <div className="dash-tile-value">{liveOrder ? 1 : 0}</div>
          <div className="dash-tile-foot">{liveOrder ? `#${liveOrder.id} · ${liveOrder.status}` : "No active orders"}</div>
        </div>
        <div className="dash-tile" onClick={() => setTab("appointments")} style={{cursor: "pointer"}}>
          <div className="dash-tile-label">Next appointment</div>
          <div className="dash-tile-value" style={{fontSize: 28}}>{next ? "Sat 23 May" : "—"}</div>
          <div className="dash-tile-foot">{next ? `${next.time} · ${next.clinic}` : "Book your next test"}</div>
        </div>
        <div className="dash-tile" onClick={() => setTab("prescriptions")} style={{cursor: "pointer"}}>
          <div className="dash-tile-label">Current prescription</div>
          <div className="dash-tile-value" style={{fontSize: 28}}>{rxLatest.id}</div>
          <div className="dash-tile-foot">Valid until {rxLatest.valid}</div>
        </div>
      </div>

      {liveOrder && (
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <div className="dash-tile-label" style={{marginBottom: 4}}>Live order · {liveOrder.id}</div>
              <div className="dash-card-title">{liveOrder.frame} · {liveOrder.colour}</div>
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); setTab("orders"); }} className="dash-card-link">Track order →</a>
          </div>

          {/* Mini tracker */}
          <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8}}>
            {[
              { name: "Order placed", date: "Tue 12 May", done: true },
              { name: "Lenses cut", date: "Wed 13 May", done: true },
              { name: "Out for delivery", date: "Today", done: true },
              { name: "Delivered", date: "Tomorrow", done: false },
            ].map((s, i) => (
              <div key={i} style={{position: "relative"}}>
                <div style={{
                  width: "100%", height: 3, background: s.done ? "var(--lumen-sage)" : "var(--lumen-border)",
                  borderRadius: 99, marginBottom: 8
                }}></div>
                <div style={{fontSize: 12.5, fontWeight: 600, color: s.done ? "var(--lumen-ink)" : "var(--lumen-muted)"}}>
                  {s.name}
                </div>
                <div style={{fontSize: 11, color: "var(--lumen-muted)", marginTop: 2}}>{s.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">Quick actions</div>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12}}>
          {[
            { name: "Book eye test", icon: "calendar", href: "Lumen Eye Care.html#cta" },
            { name: "Upload Rx", icon: "upload", action: () => setTab("prescriptions") },
            { name: "Shop frames", icon: "glasses", href: "Shop.html" },
            { name: "Find a clinic", icon: "pin", href: "Clinics.html" },
          ].map((q, i) => {
            const inner = (
              <>
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--r-md)",
                  background: "var(--lumen-blue-tint)", color: "var(--lumen-blue)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 10
                }}>
                  <Icon name={q.icon} size={18}/>
                </div>
                <div style={{fontSize: 13.5, fontWeight: 500}}>{q.name}</div>
              </>
            );
            const props = {
              key: i,
              className: "dash-tile",
              style: {cursor: "pointer", padding: 18, textAlign: "left", textDecoration: "none", color: "inherit"}
            };
            return q.href ? <a {...props} href={q.href}>{inner}</a> : <div {...props} onClick={q.action}>{inner}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================
   ORDERS
   ============================================ */
const Orders = () => (
  <div className="account-section">
    <h2>Your orders</h2>
    <p className="sub">Track active orders and revisit past purchases.</p>

    {/* Active */}
    {ACCOUNT_DATA.orders.filter(o => o.status !== "Delivered").map(o => {
      const frame = FRAMES.find(f => f.name === o.frame);
      return (
        <div key={o.id} className="dash-card">
          <div className="dash-card-head">
            <div>
              <div className="dash-tile-label" style={{marginBottom: 4}}>{o.id} · placed {o.date}</div>
              <div className="dash-card-title">{o.frame} <span style={{color: "var(--lumen-muted)", fontFamily: "var(--font-body)", fontSize: 16}}>· {o.colour}</span></div>
            </div>
            <span className="order-status shipped">{o.status}</span>
          </div>

          <div className="order-row" style={{borderBottom: "none"}}>
            <div className="order-row-img">
              {frame && <FrameSVG shape={frame.shape} color={frame.colors[0].hex}/>}
            </div>
            <div>
              <div className="order-row-name">{o.frame} · {o.colour}</div>
              <div className="order-row-meta">Single vision · Anti-reflective + UV400</div>
              <div className="order-row-meta" style={{color: "var(--lumen-sage)", marginTop: 4, fontWeight: 500}}>
                <Icon name="truck" size={12} style={{verticalAlign: "middle", marginRight: 4}}/>
                Out for delivery · arriving {o.eta}
              </div>
            </div>
            <div style={{fontSize: 16, fontWeight: 600}}>&#8373;{o.total}</div>
            <a href="#" className="order-row-action">Track <Icon name="arrow" size={12}/></a>
          </div>
        </div>
      );
    })}

    {/* Past */}
    <div className="dash-card">
      <div className="dash-card-head">
        <div className="dash-card-title">Past orders</div>
        <span style={{fontSize: 13, color: "var(--lumen-muted)"}}>{ACCOUNT_DATA.orders.filter(o => o.status === "Delivered").length} orders</span>
      </div>

      {ACCOUNT_DATA.orders.filter(o => o.status === "Delivered").map(o => {
        const frame = FRAMES.find(f => f.name === o.frame);
        return (
          <div key={o.id} className="order-row">
            <div className="order-row-img">{frame && <FrameSVG shape={frame.shape} color={frame.colors[0].hex}/>}</div>
            <div>
              <div className="order-row-name">{o.frame} · {o.colour}</div>
              <div className="order-row-meta">{o.id} · {o.date}</div>
            </div>
            <span className="order-status delivered">Delivered</span>
            <a href="#" className="order-row-action">Reorder</a>
          </div>
        );
      })}
    </div>
  </div>
);

/* ============================================
   APPOINTMENTS
   ============================================ */
const Appointments = () => (
  <div className="account-section">
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32}}>
      <div>
        <h2 style={{marginBottom: 8}}>Appointments</h2>
        <p className="sub" style={{marginBottom: 0}}>Your upcoming and past eye care visits.</p>
      </div>
      <a href="Lumen Eye Care.html#cta" className="btn btn-primary">
        Book new appointment <Icon name="arrow" size={14}/>
      </a>
    </div>

    {ACCOUNT_DATA.appointments.map(a => (
      <div key={a.id} className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-tile-label" style={{marginBottom: 4}}>{a.id}</div>
            <div className="dash-card-title">{a.type}</div>
          </div>
          <span className={`order-status ${a.status}`}>{a.status === "upcoming" ? "Upcoming" : "Completed"}</span>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, padding: "12px 0"}}>
          <div>
            <div className="dash-tile-label" style={{marginBottom: 4}}>Date</div>
            <div style={{fontFamily: "var(--font-display)", fontSize: 22}}>{new Date(a.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
          </div>
          <div>
            <div className="dash-tile-label" style={{marginBottom: 4}}>Time</div>
            <div style={{fontFamily: "var(--font-display)", fontSize: 22}}>{a.time}</div>
          </div>
          <div>
            <div className="dash-tile-label" style={{marginBottom: 4}}>Clinic</div>
            <div style={{fontSize: 14, fontWeight: 500, marginTop: 6}}>{a.clinic}</div>
          </div>
        </div>

        {a.status === "upcoming" && (
          <div style={{display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--lumen-border)"}}>
            <button className="btn btn-light btn-sm">Reschedule</button>
            <button className="btn btn-light btn-sm">Cancel</button>
            <a href="Clinics.html" className="btn btn-light btn-sm">
              <Icon name="pin" size={12}/> Directions
            </a>
          </div>
        )}
      </div>
    ))}
  </div>
);

/* ============================================
   PRESCRIPTIONS
   ============================================ */
const Prescriptions = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="account-section">
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32}}>
        <div>
          <h2 style={{marginBottom: 8}}>Prescriptions</h2>
          <p className="sub" style={{marginBottom: 0}}>All your prescriptions in one place — we use the most recent when you order.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <Icon name="upload" size={14}/> Upload new
        </button>
      </div>

      {showUpload && (
        <div className="rx-upload-zone" onClick={() => { window.toast && window.toast("Prescription uploaded — we'll verify in 2 hours."); setShowUpload(false); }}>
          <div className="rx-upload-icon"><Icon name="upload" size={24}/></div>
          <h4 style={{fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8}}>Drop your prescription here</h4>
          <p style={{color: "var(--lumen-muted)", fontSize: 14, marginBottom: 16}}>Photo or PDF · under 12 months old · max 5MB</p>
          <button className="btn btn-primary">Choose file</button>
          <p style={{fontSize: 12, color: "var(--lumen-muted)", marginTop: 24}}>
            <Icon name="info" size={11} style={{verticalAlign: "middle", marginRight: 4}}/>
            Don't have one? <a href="Lumen Eye Care.html#cta" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>Book a ₵120 eye test</a> — we'll issue one on the spot.
          </p>
        </div>
      )}

      {ACCOUNT_DATA.prescriptions.map((rx, i) => (
        <div key={rx.id} className="rx-card">
          <div className="rx-card-head">
            <div>
              <div className="rx-card-title">{rx.id}</div>
              <div className="rx-card-meta">Issued {rx.issued} · by {rx.optometrist} · valid until {rx.valid}</div>
            </div>
            {i === 0 && <span className="order-status delivered">Current</span>}
          </div>

          <div className="rx-card-table">
            <div>
              <div className="rx-cell-label">OD SPH</div>
              <div className="rx-cell-value">{rx.od_sph}</div>
            </div>
            <div>
              <div className="rx-cell-label">OD CYL</div>
              <div className="rx-cell-value">{rx.od_cyl}</div>
            </div>
            <div>
              <div className="rx-cell-label">OS SPH</div>
              <div className="rx-cell-value">{rx.os_sph}</div>
            </div>
            <div>
              <div className="rx-cell-label">OS CYL</div>
              <div className="rx-cell-value">{rx.os_cyl}</div>
            </div>
            <div>
              <div className="rx-cell-label">OD axis</div>
              <div className="rx-cell-value" style={{fontSize: 18}}>{rx.od_axis}°</div>
            </div>
            <div>
              <div className="rx-cell-label">OS axis</div>
              <div className="rx-cell-value" style={{fontSize: 18}}>{rx.os_axis}°</div>
            </div>
            <div>
              <div className="rx-cell-label">PD</div>
              <div className="rx-cell-value" style={{fontSize: 18}}>{rx.pd} mm</div>
            </div>
            <div>
              <div className="rx-cell-label">Type</div>
              <div className="rx-cell-value" style={{fontSize: 16}}>Distance</div>
            </div>
          </div>

          <div className="rx-card-actions">
            <a href="Shop.html" className="btn btn-light btn-sm">
              <Icon name="glasses" size={12}/> Shop with this Rx
            </a>
            <button className="btn btn-light btn-sm">
              <Icon name="upload" size={12}/> Download PDF
            </button>
            <button className="btn btn-light btn-sm">
              <Icon name="share" size={12}/> Share with optician
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================
   SAVED FRAMES
   ============================================ */
const Saved = () => {
  const saved = FRAMES.filter(f => ACCOUNT_DATA.savedFrames.includes(f.id));
  return (
    <div className="account-section">
      <h2>Saved frames</h2>
      <p className="sub">Frames you've hearted across the site.</p>

      <div className="frames-grid">
        {saved.map(f => (
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
                <div className="frame-price"><span className="from">From</span>&#8373;{f.price}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

/* ============================================
   ADDRESSES
   ============================================ */
const Addresses = () => (
  <div className="account-section">
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32}}>
      <div>
        <h2 style={{marginBottom: 8}}>Addresses</h2>
        <p className="sub" style={{marginBottom: 0}}>Your saved delivery addresses.</p>
      </div>
      <button className="btn btn-primary"><Icon name="plus" size={14}/> Add new address</button>
    </div>

    {ACCOUNT_DATA.addresses.map(a => (
      <div key={a.id} className="account-address">
        {a.default && <span className="account-address-default">Default</span>}
        <div className="account-address-label">{a.label}</div>
        <div className="account-address-name">{a.name}</div>
        <div className="account-address-line">{a.line1}<br/>{a.line2}<br/>{a.phone}</div>
        <div className="account-address-actions">
          <a>Edit</a>
          {!a.default && <a>Set as default</a>}
          {!a.default && <a style={{color: "var(--lumen-warm)"}}>Delete</a>}
        </div>
      </div>
    ))}
  </div>
);

/* ============================================
   PAYMENTS
   ============================================ */
const Payments = () => (
  <div className="account-section">
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32}}>
      <div>
        <h2 style={{marginBottom: 8}}>Payment methods</h2>
        <p className="sub" style={{marginBottom: 0}}>Saved Mobile Money wallets and cards.</p>
      </div>
      <button className="btn btn-primary"><Icon name="plus" size={14}/> Add payment</button>
    </div>

    {ACCOUNT_DATA.payments.map(p => (
      <div key={p.id} className="payment-opt" style={{marginBottom: 10}}>
        <div className={`payment-logo ${p.type === "momo" ? "mtn" : "card"}`}>
          {p.type === "momo" ? "MTN" : "💳"}
        </div>
        <div className="payment-main">
          <div className="payment-name">{p.network || p.brand} {p.default && <span style={{fontSize: 10, background: "var(--lumen-sage-tint)", color: "var(--lumen-sage)", padding: "2px 6px", borderRadius: 99, marginLeft: 8, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase"}}>Default</span>}</div>
          <div className="payment-desc">{p.number}</div>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn btn-light btn-sm">Edit</button>
          {!p.default && <button className="btn btn-light btn-sm" style={{color: "var(--lumen-warm)"}}>Remove</button>}
        </div>
      </div>
    ))}
  </div>
);

/* ============================================
   SETTINGS
   ============================================ */
const Settings = ({ session }) => {
  const [notifications, setNotifications] = useState({ email: true, sms: true, whatsapp: true, marketing: false });

  return (
    <div className="account-section">
      <h2>Settings</h2>
      <p className="sub">Manage your profile, notifications and privacy.</p>

      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label">Name</div>
          <div className="settings-row-value">{session.name}</div>
        </div>
        <button className="btn btn-light btn-sm">Edit</button>
      </div>
      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label">Email</div>
          <div className="settings-row-value">{session.email}</div>
        </div>
        <button className="btn btn-light btn-sm">Change</button>
      </div>
      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label">Phone number</div>
          <div className="settings-row-value">{session.phone}</div>
        </div>
        <button className="btn btn-light btn-sm">Change</button>
      </div>
      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label">Password</div>
          <div className="settings-row-value">•••••••• · last changed 2 months ago</div>
        </div>
        <button className="btn btn-light btn-sm">Change</button>
      </div>

      <h3 style={{fontFamily: "var(--font-display)", fontSize: 24, marginTop: 40, marginBottom: 16}}>Notifications</h3>

      {[
        { key: "email", label: "Email updates", desc: "Order confirmations, appointment reminders, receipts" },
        { key: "sms", label: "SMS updates", desc: "Critical updates only (delivery, appointment changes)" },
        { key: "whatsapp", label: "WhatsApp messages", desc: "Order tracking and appointment confirmations" },
        { key: "marketing", label: "New arrivals & offers", desc: "Promotional emails about new frames and sales" },
      ].map(n => (
        <div key={n.key} className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">{n.label}</div>
            <div className="settings-row-desc">{n.desc}</div>
          </div>
          <div className={`settings-toggle ${notifications[n.key] ? "on" : ""}`}
            onClick={() => setNotifications(s => ({ ...s, [n.key]: !s[n.key] }))}>
          </div>
        </div>
      ))}

      <h3 style={{fontFamily: "var(--font-display)", fontSize: 24, marginTop: 40, marginBottom: 16}}>Account</h3>

      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label">Sign out of all devices</div>
          <div className="settings-row-desc">You'll need to sign in again on every device.</div>
        </div>
        <button className="btn btn-light btn-sm" onClick={() => { Session.signOut(); window.location.href = "Lumen Eye Care.html"; }}>Sign out</button>
      </div>
      <div className="settings-row">
        <div className="settings-row-info">
          <div className="settings-row-label" style={{color: "var(--lumen-warm)"}}>Delete my account</div>
          <div className="settings-row-desc">Permanently delete your data. Your orders and prescriptions will be archived.</div>
        </div>
        <button className="btn btn-light btn-sm" style={{color: "var(--lumen-warm)", borderColor: "var(--lumen-warm)"}}>Delete</button>
      </div>
    </div>
  );
};

/* ============================================
   ACCOUNT ROOT
   ============================================ */
const Account = () => {
  const session = useSession();
  const [tab, setTab] = useState(readAccountTab);

  /* Auto-sign-in for the prototype if not signed in */
  useEffect(() => {
    if (!Session.isAuthed()) Session.signIn(MOCK_USER);
  }, []);

  /* Sync tab to URL */
  useEffect(() => {
    if (window.__lumen_no_auto) return; // skip in SPA mode
    const url = new URL(window.location.href);
    if (tab === "dashboard") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }, [tab]);

  if (!session) {
    return <div style={{padding: 100, textAlign: "center"}}>Loading…</div>;
  }

  return (
    <>
      <SubNav/>

      <div className="container-wide">
        <div className="breadcrumb" style={{paddingTop: 100}}>
          <a href="Lumen Eye Care.html">Home</a>
          <span className="sep">/</span>
          <span className="current">My account</span>
        </div>

        <div className="account-grid">
          {/* Sidebar */}
          <aside className="account-side">
            <div className="account-user-card">
              <div className="account-user-avatar">{session.initials}</div>
              <div style={{minWidth: 0}}>
                <div className="account-user-name">{session.name}</div>
                <div className="account-user-email" style={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}>{session.email}</div>
              </div>
            </div>

            <nav className="account-nav">
              {tabs.map(t => (
                <div key={t.id}
                  className={`account-nav-item ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}>
                  <span className="ico"><Icon name={t.icon} size={16}/></span>
                  {t.label}
                  {t.badge && <span className="badge">{t.badge}</span>}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="account-main">
            {tab === "dashboard" && <Dashboard session={session} setTab={setTab}/>}
            {tab === "orders" && <Orders/>}
            {tab === "appointments" && <Appointments/>}
            {tab === "prescriptions" && <Prescriptions/>}
            {tab === "saved" && <Saved/>}
            {tab === "addresses" && <Addresses/>}
            {tab === "payments" && <Payments/>}
            {tab === "settings" && <Settings session={session}/>}
          </main>
        </div>
      </div>

      <Footer/>
    </>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.Account = Account;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<Account/>);
}
