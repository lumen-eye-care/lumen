/* global React, ReactDOM */
const { Icon, SubNav } = window;
const Footer = window.LumenFooter;

const articles = [
  {
    id: 1,
    cat: "Eye care",
    title: "How often should you get an eye test?",
    excerpt: "Most adults should test every two years — but if you spend more than six hours on screens, sooner. Here's how to know.",
    date: "12 May 2026", read: "6 min read",
    imgClass: "", icon: "eye",
    featured: true,
  },
  {
    id: 2,
    cat: "Lens technology",
    title: "Blue light, explained — and what the research actually says.",
    excerpt: "There's a lot of noise about blue light. We break down which lenses are worth it, and which are marketing fluff.",
    date: "29 April 2026", read: "8 min read",
    imgClass: "warm", icon: "monitor",
  },
  {
    id: 3,
    cat: "Style",
    title: "Round, square, or cat-eye? A guide to face shapes.",
    excerpt: "Picking frames that fit your face is less about rules and more about proportion. Our optometrists share their cheat sheet.",
    date: "14 April 2026", read: "5 min read",
    imgClass: "sage", icon: "glasses",
  },
  {
    id: 4,
    cat: "Ghana",
    title: "Why we built Lumen in Accra.",
    excerpt: "Eye care should be premium and accessible. A note from our founders on why we started Lumen here.",
    date: "2 April 2026", read: "4 min read",
    imgClass: "dark", icon: "sparkle",
  },
  {
    id: 5,
    cat: "Children",
    title: "When should your child have their first eye test?",
    excerpt: "Pediatric optometry isn't about Snellen charts. Here's what we look for at every age.",
    date: "20 March 2026", read: "7 min read",
    imgClass: "sage", icon: "user",
  },
  {
    id: 6,
    cat: "Lens technology",
    title: "Single vision, varifocal, reader: which lens is right for you?",
    excerpt: "A plain-English guide to lens types. We answer the questions our optometrists hear every week.",
    date: "12 March 2026", read: "9 min read",
    imgClass: "", icon: "book",
  },
];

const Journal = () => (
  <>
    <SubNav/>

    <section className="journal-hero">
      <div className="container-wide">
        <div className="breadcrumb" style={{justifyContent: "center", paddingTop: 0}}>
          <a href="Lumen Eye Care.html">Home</a>
          <span className="sep">/</span>
          <span className="current">Journal</span>
        </div>
        <div className="eyebrow" style={{justifyContent: "center", display: "inline-flex", alignItems: "center", marginTop: 16}}>
          <span className="dot"></span>The Lumen journal
        </div>
        <h1 className="shop-hero-title" style={{marginTop: 12}}>
          Stories about <span className="ital">vision, frames, and care.</span>
        </h1>
        <p className="shop-hero-sub" style={{margin: "12px auto 0"}}>
          Practical eye care guidance from our optometrists, plus the story behind Lumen.
        </p>
      </div>
    </section>

    <div className="container-wide">
      {/* Featured */}
      {articles.filter(a => a.featured).map(a => (
        <a key={a.id} href="#" className="journal-card" style={{
          display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 0,
          marginBottom: 40, overflow: "hidden", textDecoration: "none", color: "inherit"
        }}>
          <div className={`journal-card-img ${a.imgClass}`} style={{aspectRatio: "16/10"}}>
            <Icon name={a.icon} size={80}/>
          </div>
          <div className="journal-card-content" style={{padding: 48}}>
            <div className="journal-card-cat">{a.cat}</div>
            <h2 style={{fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.015em", marginBottom: 16}}>
              {a.title}
            </h2>
            <p style={{fontSize: 15, color: "var(--lumen-muted)", lineHeight: 1.55, marginBottom: 24, flex: 1}}>
              {a.excerpt}
            </p>
            <div className="journal-card-meta">{a.date} · {a.read}</div>
          </div>
        </a>
      ))}

      <div className="journal-feed">
        {articles.filter(a => !a.featured).map(a => (
          <a key={a.id} href="#" className="journal-card" style={{textDecoration: "none", color: "inherit"}}>
            <div className={`journal-card-img ${a.imgClass}`}>
              <Icon name={a.icon} size={56}/>
            </div>
            <div className="journal-card-content">
              <div className="journal-card-cat">{a.cat}</div>
              <h3 className="journal-card-title">{a.title}</h3>
              <p className="journal-card-excerpt">{a.excerpt}</p>
              <div className="journal-card-meta">{a.date} · {a.read}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Subscribe */}
      <section style={{padding: "60px 0 100px", textAlign: "center"}}>
        <h2 style={{fontFamily: "var(--font-display)", fontSize: 36, letterSpacing: "-0.015em", marginBottom: 12}}>
          New articles every Tuesday.
        </h2>
        <p style={{color: "var(--lumen-muted)", maxWidth: 480, margin: "0 auto 24px"}}>
          One short note per week. Eye care tips, new arrivals, no fluff.
        </p>
        <div style={{display: "flex", maxWidth: 420, margin: "0 auto", background: "white", border: "1px solid var(--lumen-border)", borderRadius: 99, padding: 4}}>
          <input type="email" placeholder="your@email.com" style={{
            flex: 1, background: "transparent", border: "none", padding: "0 16px",
            fontSize: 14, fontFamily: "inherit", outline: "none"
          }}/>
          <button className="btn btn-primary" style={{height: 40, padding: "0 18px"}}>Subscribe</button>
        </div>
      </section>
    </div>

    <Footer/>
  </>
);

window.LumenPages = window.LumenPages || {};
window.LumenPages.Journal = Journal;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<Journal/>);
}
