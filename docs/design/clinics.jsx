/* global React, ReactDOM */
const { Icon, SubNav } = window;
const Footer = window.LumenFooter;

const clinics = [
  {
    id: "eastlegon",
    name: "East Legon clinic",
    addr: "12 Lagos Avenue, East Legon, Accra",
    phone: "030 270 0218",
    whatsapp: "+233 55 213 8821",
    optometrists: 3,
    services: ["Eye tests", "Contact lens fitting", "Children's eye tests", "Glasses fitting"],
    todayHours: "08:00 – 19:00",
    isOpen: true,
    isFlagship: true,
  },
  {
    id: "osu",
    name: "Osu clinic",
    addr: "Oxford St, Osu, Accra",
    phone: "030 270 0219",
    whatsapp: "+233 55 213 8822",
    optometrists: 2,
    services: ["Eye tests", "Contact lens fitting", "Glasses fitting"],
    todayHours: "09:00 – 20:00",
    isOpen: true,
  },
  {
    id: "airport",
    name: "Airport Residential",
    addr: "7 Mankata Close, Airport Residential, Accra",
    phone: "030 270 0220",
    whatsapp: "+233 55 213 8823",
    optometrists: 2,
    services: ["Eye tests", "Glasses fitting", "Designer collections"],
    todayHours: "08:00 – 18:00",
    isOpen: true,
  },
  {
    id: "kumasi",
    name: "Adum clinic, Kumasi",
    addr: "Prempeh II Street, Adum, Kumasi",
    phone: "032 220 1500",
    whatsapp: "+233 55 213 8824",
    optometrists: 2,
    services: ["Eye tests", "Contact lens fitting", "Children's eye tests"],
    todayHours: "08:00 – 18:00",
    isOpen: true,
  },
];

const allHours = [
  { day: "Mon", hrs: "08:00 – 19:00" },
  { day: "Tue", hrs: "08:00 – 19:00", today: true },
  { day: "Wed", hrs: "08:00 – 19:00" },
  { day: "Thu", hrs: "08:00 – 19:00" },
  { day: "Fri", hrs: "08:00 – 20:00" },
  { day: "Sat", hrs: "09:00 – 18:00" },
  { day: "Sun", hrs: "Closed" },
];

const Clinics = () => (
  <>
    <SubNav/>

    <section className="clinics-hero">
      <div className="container-wide">
        <div className="breadcrumb" style={{justifyContent: "center", paddingTop: 0}}>
          <a href="Lumen Eye Care.html">Home</a>
          <span className="sep">/</span>
          <span className="current">Clinics</span>
        </div>
        <div className="eyebrow" style={{justifyContent: "center", display: "inline-flex", alignItems: "center", marginTop: 16}}>
          <span className="dot"></span>Four locations in Ghana
        </div>
        <h1 className="shop-hero-title" style={{marginTop: 12}}>
          Care, close to <span className="ital">where you are.</span>
        </h1>
        <p className="shop-hero-sub" style={{margin: "12px auto 0"}}>
          Four locations across Accra and Kumasi, plus home visits.
          Every clinic has the same equipment and the same clinical standard.
        </p>
      </div>
    </section>

    <div className="container-wide">
      <div className="clinics-list">
        {clinics.map(c => (
          <div key={c.id} className="clinic-card">
            <div className="clinic-map">
              <div className="clinic-map-pin">
                <Icon name="pin" size={12}/>
                {c.name}
              </div>
            </div>
            <div className="clinic-info">
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6}}>
                <h2 className="clinic-name">{c.name}</h2>
                {c.isFlagship && <span className="order-status delivered">Flagship</span>}
              </div>
              <p className="clinic-addr">{c.addr}</p>

              <div style={{display: "flex", gap: 18, fontSize: 13, marginBottom: 16}}>
                <span style={{color: "var(--lumen-sage)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4}}>
                  <span style={{width: 6, height: 6, background: "var(--lumen-sage)", borderRadius: "50%"}}></span>
                  Open · {c.todayHours}
                </span>
                <span style={{color: "var(--lumen-muted)"}}>·</span>
                <span style={{color: "var(--lumen-muted)"}}>{c.optometrists} optometrists on staff</span>
              </div>

              <div style={{marginBottom: 20}}>
                <div className="dash-tile-label" style={{marginBottom: 8}}>Opening hours</div>
                {allHours.map(h => (
                  <div key={h.day} className={`clinic-hours-row ${h.today ? "today" : ""}`}>
                    <span className="day">{h.day}{h.today && " (today)"}</span>
                    <span className="hrs">{h.hrs}</span>
                  </div>
                ))}
              </div>

              <div style={{marginBottom: 20}}>
                <div className="dash-tile-label" style={{marginBottom: 8}}>Services here</div>
                <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
                  {c.services.map(s => (
                    <span key={s} className="filter-chip" style={{cursor: "default", height: 28, padding: "0 12px", fontSize: 12}}>
                      <Icon name="check" size={10} style={{color: "var(--lumen-sage)"}}/>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="clinic-actions">
                <a href="Lumen Eye Care.html#cta" className="btn btn-primary">
                  Book here <Icon name="arrow" size={14}/>
                </a>
                <a href={`tel:${c.phone}`} className="btn btn-light">
                  <Icon name="phone" size={14}/> Call
                </a>
                <a href="#" className="btn btn-light" title="Open WhatsApp chat" onClick={(e) => { e.preventDefault(); window.toast && window.toast("Opening WhatsApp…"); }}>
                  <Icon name="phone" size={14}/> Chat
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Home visit banner */}
      <section style={{padding: "32px 0 100px"}}>
        <div style={{
          background: "var(--lumen-ink)",
          color: "white",
          borderRadius: "var(--r-xl)",
          padding: 56,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 40,
          alignItems: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{position: "relative", zIndex: 1}}>
            <div className="eyebrow" style={{color: "var(--lumen-blue-tint)"}}>
              <span className="dot" style={{background: "var(--lumen-blue-tint)"}}></span>
              Home visit eye tests
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-0.02em",
              lineHeight: 1.02, marginTop: 16, marginBottom: 16, color: "white"
            }}>
              Can't make it in? <span style={{fontStyle: "italic", color: "var(--lumen-blue-tint)"}}>We'll come to you.</span>
            </h2>
            <p style={{fontSize: 15.5, color: "rgba(255,255,255,0.7)", marginBottom: 28, lineHeight: 1.55}}>
              Full clinical equipment, brought to your home or office. Perfect for elderly patients,
              busy professionals, and families with young children. We cover all of Accra and Kumasi.
            </p>
            <div style={{display: "flex", gap: 12}}>
              <a href="Lumen Eye Care.html#cta" className="btn btn-blue btn-lg">
                Book a home visit <Icon name="arrow" size={14}/>
              </a>
              <a href="tel:0302700218" className="btn btn-ghost btn-lg" style={{color: "white", borderColor: "rgba(255,255,255,0.2)"}}>
                <Icon name="phone" size={14}/> Call to discuss
              </a>
            </div>
          </div>

          <div style={{position: "relative", zIndex: 1}}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--r-lg)",
              padding: 24
            }}>
              {[
                { label: "Visit fee", value: "₵250" },
                { label: "Includes", value: "30-min full exam + retinal imaging" },
                { label: "Equipment", value: "Portable autorefractor + slit lamp" },
                { label: "Coverage", value: "Accra · Kumasi" },
                { label: "Available", value: "Tue – Sat · 9am – 5pm" },
              ].map((r, i) => (
                <div key={i} style={{display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: 13.5}}>
                  <span style={{color: "rgba(255,255,255,0.5)"}}>{r.label}</span>
                  <span style={{fontWeight: 500}}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            position: "absolute", top: -200, right: -200,
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(15,76,129,0.4), transparent 60%)",
            pointerEvents: "none"
          }}></div>
        </div>
      </section>
    </div>

    <Footer/>
  </>
);

window.LumenPages = window.LumenPages || {};
window.LumenPages.Clinics = Clinics;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<Clinics/>);
}
