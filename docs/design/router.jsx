/* global React, ReactDOM */
/* Lumen SPA Router — hash-based, swaps page components, intercepts <a href=".html"> clicks */

const { useState, useEffect } = React;

/* Map URL hash path → page name in window.LumenPages */
const PAGE_MAP = {
  "": "Home",
  "home": "Home",
  "shop": "Shop",
  "frame-detail": "FrameDetail",
  "try-on": "TryOn",
  "lens-quiz": "LensQuiz",
  "checkout": "Checkout",
  "account": "Account",
  "clinics": "Clinics",
  "journal": "Journal",
};

/* Map filename (lowercased) → route path */
const FILE_MAP = {
  "lumen eye care.html": "home",
  "shop.html": "shop",
  "frame detail.html": "frame-detail",
  "virtual try-on.html": "try-on",
  "lens quiz.html": "lens-quiz",
  "checkout.html": "checkout",
  "account.html": "account",
  "clinics.html": "clinics",
  "journal.html": "journal",
};

function parseHash() {
  const raw = window.location.hash.slice(1);
  const [path, query] = raw.split("?");
  return {
    path: (path || "home").toLowerCase(),
    params: new URLSearchParams(query || ""),
    raw,
  };
}

function hrefToHash(href) {
  if (!href) return null;
  if (href.startsWith("#")) return null;
  if (/^(https?|mailto|tel):/i.test(href)) return null;
  const m = href.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
  if (!m) return null;
  const file = m[1].split("/").pop().toLowerCase();
  const route = FILE_MAP[file];
  if (!route) return null;
  let q = m[2] || "";
  const anchor = m[3] || "";
  /* Homepage #cta anchor → trigger booking modal */
  if (route === "home" && anchor === "#cta") {
    q = q ? q + "&book=1" : "?book=1";
  }
  return "#" + route + q;
}

const NotFound = () => (
  <div style={{
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
    fontFamily: "var(--font-display)", padding: 40, background: "var(--lumen-cream)"
  }}>
    <h1 style={{fontSize: 80, letterSpacing: "-0.02em", marginBottom: 12}}>404</h1>
    <p style={{fontSize: 18, color: "var(--lumen-muted)", marginBottom: 28}}>
      That page doesn't exist in this demo.
    </p>
    <a href="Lumen Eye Care.html" className="btn btn-primary">Back to Lumen</a>
  </div>
);

const Router = () => {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);

    const onClick = (e) => {
      /* Skip if modifier pressed (user wants new tab etc.) */
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      const hash = hrefToHash(href);
      if (hash !== null) {
        e.preventDefault();
        if (hash === "#" + route.path + (route.params.toString() ? "?" + route.params.toString() : "")) {
          /* Same route — scroll to top */
          window.scrollTo(0, 0);
          return;
        }
        window.location.hash = hash;
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [route]);

  /* Expose params to legacy code */
  window.__lumen_route_params = route.params;

  const pageName = PAGE_MAP[route.path];
  const PageComp = pageName && window.LumenPages && window.LumenPages[pageName];

  if (!PageComp) return <NotFound/>;
  return <PageComp key={route.path + ":" + route.params.toString()}/>;
};

ReactDOM.createRoot(document.getElementById("root")).render(<Router/>);
