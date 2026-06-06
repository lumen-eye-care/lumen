/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;
const { Icon, LogoMark, FrameSVG, FRAMES, Cart, Session, MOCK_USER, ACCOUNT_DATA, useCart } = window;

/* Minimal nav for checkout — just logo + secure badge */
const CheckoutNav = ({ onBack }) => (
  <nav className="nav scrolled" style={{position: "fixed"}}>
    <div className="container-wide nav-inner">
      <a href="Lumen Eye Care.html" className="logo">
        <span className="logo-mark"><LogoMark/></span>
        Lumen
      </a>
      <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--lumen-muted)"}}>
        <Icon name="shield" size={14}/>
        Secure checkout
      </div>
    </div>
  </nav>
);

const Checkout = () => {
  const items = useCart();
  const [step, setStep] = useState(0); // 0=delivery, 1=payment, 2=review, 3=success
  const [deliveryType, setDeliveryType] = useState("delivery"); // delivery | pickup
  const [pickupClinic, setPickupClinic] = useState("eastlegon");
  const [addr, setAddr] = useState(ACCOUNT_DATA.addresses[0]);
  const [payment, setPayment] = useState("mtn");
  const [momoPhone, setMomoPhone] = useState(MOCK_USER.phone);
  const [cardNumber, setCardNumber] = useState("");
  const [contact, setContact] = useState({
    email: MOCK_USER.email,
    phone: MOCK_USER.phone,
    first: MOCK_USER.name.split(" ")[0],
    last: MOCK_USER.name.split(" ")[1] || "",
  });
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const subtotal = items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
  const delivery = deliveryType === "pickup" ? 0 : (subtotal >= 500 ? 0 : 25);
  const total = subtotal + delivery;

  /* If cart is empty when arriving, show empty state */
  if (items.length === 0 && step < 3) {
    return (
      <div className="checkout-shell">
        <CheckoutNav/>
        <div className="container-wide" style={{paddingTop: 160, textAlign: "center"}}>
          <div className="cart-empty" style={{background: "white", borderRadius: "var(--r-xl)", border: "1px solid var(--lumen-border)", maxWidth: 480, margin: "0 auto", padding: "60px 32px"}}>
            <div className="cart-empty-icon"><Icon name="cart" size={26}/></div>
            <h4>Your bag is empty</h4>
            <p>Nothing to check out yet. Browse our frames or take the lens quiz to get started.</p>
            <a href="Shop.html" className="btn btn-primary">Shop frames <Icon name="arrow" size={14}/></a>
          </div>
        </div>
      </div>
    );
  }

  const clinics = [
    { id: "eastlegon", name: "East Legon clinic", addr: "12 Lagos Avenue, East Legon, Accra" },
    { id: "osu", name: "Osu clinic", addr: "Oxford St, Osu, Accra" },
    { id: "airport", name: "Airport Residential", addr: "7 Mankata Close, Airport Residential" },
    { id: "kumasi", name: "Adum clinic, Kumasi", addr: "Prempeh II Street, Adum, Kumasi" },
  ];

  const paymentOpts = [
    { id: "mtn", name: "MTN Mobile Money", desc: "You'll get a prompt on " + momoPhone, logo: "MTN", logoClass: "mtn" },
    { id: "voda", name: "Vodafone Cash", desc: "Pay from your Voda Cash wallet", logo: "VC", logoClass: "voda" },
    { id: "tigo", name: "AirtelTigo Money", desc: "Pay from your AT Money wallet", logo: "AT", logoClass: "tigo" },
    { id: "card", name: "Card", desc: "Visa, Mastercard or Verve", logo: "💳", logoClass: "card" },
    { id: "cash", name: "Cash on Delivery", desc: "Pay our rider in cash (Accra & Kumasi only)", logo: "₵", logoClass: "cash" },
  ];

  const placeOrder = () => {
    setProcessing(true);
    setTimeout(() => {
      setOrderId("LMN-" + Math.floor(24000 + Math.random() * 999));
      Cart.clear();
      setProcessing(false);
      setStep(3);
    }, 2200);
  };

  /* SUCCESS STATE */
  if (step === 3) {
    return (
      <div className="checkout-shell">
        <CheckoutNav/>
        <div className="container-wide">
          <div style={{maxWidth: 640, margin: "120px auto 80px", textAlign: "center"}}>
            <div className="conf-check" style={{width: 88, height: 88, marginBottom: 32}}>
              <Icon name="check" size={40} stroke={2}/>
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 56, letterSpacing: "-0.02em",
              lineHeight: 1.02, marginBottom: 12
            }}>
              Order <span style={{color: "var(--lumen-blue)", fontStyle: "italic"}}>confirmed.</span>
            </h1>
            <p style={{fontSize: 16.5, color: "var(--lumen-muted)", marginBottom: 36, lineHeight: 1.5}}>
              Thanks {contact.first}. We've sent a receipt to <strong>{contact.email}</strong> and your order is being prepared.
            </p>

            <div className="summary-card" style={{textAlign: "left", maxWidth: 480, margin: "0 auto 32px"}}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--lumen-border)"}}>
                <div>
                  <div style={{fontSize: 12, color: "var(--lumen-muted)", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase"}}>Order ID</div>
                  <div style={{fontFamily: "var(--font-display)", fontSize: 22}}>{orderId}</div>
                </div>
                <div style={{textAlign: "right"}}>
                  <div style={{fontSize: 12, color: "var(--lumen-muted)", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase"}}>Total paid</div>
                  <div style={{fontFamily: "var(--font-display)", fontSize: 22}}>&#8373;{total.toLocaleString()}</div>
                </div>
              </div>

              <div className="summary-row" style={{marginBottom: 8}}>
                <span className="label">Payment</span>
                <span>{paymentOpts.find(p => p.id === payment)?.name}</span>
              </div>
              <div className="summary-row" style={{marginBottom: 8}}>
                <span className="label">{deliveryType === "delivery" ? "Delivery to" : "Pickup at"}</span>
                <span style={{textAlign: "right"}}>
                  {deliveryType === "delivery"
                    ? <>{addr.line1}<br/>{addr.line2}</>
                    : clinics.find(c => c.id === pickupClinic)?.name}
                </span>
              </div>
              <div className="summary-row">
                <span className="label">{deliveryType === "delivery" ? "Expected" : "Ready by"}</span>
                <span><strong>{deliveryType === "delivery" ? "Tue 23 May, 2–4pm" : "Fri 22 May, 5pm"}</strong></span>
              </div>
            </div>

            <div style={{display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap"}}>
              <a href="Account.html?tab=orders" className="btn btn-primary">
                Track my order <Icon name="arrow" size={14}/>
              </a>
              <a href="Lumen Eye Care.html" className="btn btn-ghost">
                Back to home
              </a>
            </div>

            <p style={{fontSize: 13, color: "var(--lumen-muted)", marginTop: 40}}>
              Need help? <a href="Clinics.html" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>Call us at 030 270 0218</a> or <a href="Clinics.html" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>WhatsApp us</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* PROCESSING STATE (MoMo prompt) */
  if (processing) {
    return (
      <div className="checkout-shell">
        <CheckoutNav/>
        <div className="container-wide">
          <div className="momo-prompt">
            <div className="momo-prompt-icon" style={
              payment === "mtn" ? {background: "#FFCC00", color: "#000"} :
              payment === "voda" ? {background: "#E60000", color: "#fff"} :
              payment === "tigo" ? {background: "#0056A4", color: "#fff"} :
              payment === "card" ? {background: "linear-gradient(135deg, #1A1F71, #0EA5E9)", color: "#fff"} :
              {background: "var(--lumen-sage)", color: "#fff"}
            }>
              {payment === "mtn" ? "MTN" :
               payment === "voda" ? "VC" :
               payment === "tigo" ? "AT" :
               payment === "card" ? "💳" : "₵"}
            </div>
            <h2>
              {payment === "cash" ? "Confirming your order…" :
               payment === "card" ? "Processing your card payment…" :
               <>Check your phone — {paymentOpts.find(p => p.id === payment)?.logo} prompt sent</>}
            </h2>
            <p>
              {payment === "cash"
                ? "We're allocating a rider to your address. This takes about 20 seconds."
                : payment === "card"
                ? "Don't refresh this page. Your card will be charged ₵" + total.toLocaleString() + "."
                : `Approve the ${total.toLocaleString()} cedi charge from ${momoPhone}. You have 60 seconds.`}
            </p>
            <div className="momo-spinner"></div>
            <p style={{fontSize: 12.5, color: "var(--lumen-muted)"}}>
              Order ID will be generated once payment is confirmed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepNames = ["Delivery", "Payment", "Review"];

  return (
    <div className="checkout-shell">
      <CheckoutNav/>

      <div className="container-wide">
        <div className="breadcrumb" style={{paddingTop: 100}}>
          <a href="Lumen Eye Care.html">Home</a>
          <span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); window.openCart && window.openCart(); }}>Bag</a>
          <span className="sep">/</span>
          <span className="current">Checkout</span>
        </div>

        <div className="checkout-grid">
          <div className="checkout-left">
            {/* Stepper */}
            <div className="checkout-stepper">
              {stepNames.map((name, i) => (
                <React.Fragment key={name}>
                  <div className={`checkout-stepper-item ${step === i ? "active" : ""} ${step > i ? "done" : ""}`}
                       onClick={() => step > i && setStep(i)}
                       style={{cursor: step > i ? "pointer" : "default"}}>
                    <span className="checkout-stepper-num">{step > i ? <Icon name="check" size={12}/> : i + 1}</span>
                    {name}
                  </div>
                  {i < stepNames.length - 1 && <div className="checkout-stepper-line"></div>}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1: DELIVERY */}
            {step === 0 && (
              <>
                <div className="checkout-section">
                  <h3>How would you like it?</h3>
                  <p className="sub">Free delivery on orders over ₵500. Pickup is always free.</p>

                  <div className="delivery-opts">
                    <button className={`delivery-opt ${deliveryType === "delivery" ? "selected" : ""}`} onClick={() => setDeliveryType("delivery")}>
                      <div className="delivery-opt-icon"><Icon name="truck" size={18}/></div>
                      <div className="delivery-opt-name">Home delivery</div>
                      <div className="delivery-opt-desc">Accra & Kumasi · 2–4 working days</div>
                      <div className="delivery-opt-price">{subtotal >= 500 ? "Free" : "₵25"}</div>
                    </button>
                    <button className={`delivery-opt ${deliveryType === "pickup" ? "selected" : ""}`} onClick={() => setDeliveryType("pickup")}>
                      <div className="delivery-opt-icon"><Icon name="pin" size={18}/></div>
                      <div className="delivery-opt-name">Clinic pickup</div>
                      <div className="delivery-opt-desc">Ready in 1–3 days · Free fitting included</div>
                      <div className="delivery-opt-price">Free</div>
                    </button>
                  </div>
                </div>

                {deliveryType === "delivery" && (
                  <div className="checkout-section">
                    <h3 style={{fontSize: 20}}>Delivery address</h3>
                    <div className="address-card">
                      <div>
                        <div className="name">{addr.name}</div>
                        <div className="lines">
                          {addr.line1}<br/>{addr.line2}<br/>{addr.phone}
                        </div>
                      </div>
                      <button className="change">Change</button>
                    </div>
                  </div>
                )}

                {deliveryType === "pickup" && (
                  <div className="checkout-section">
                    <h3 style={{fontSize: 20}}>Pickup clinic</h3>
                    <div className="loc-list">
                      {clinics.map(c => (
                        <div key={c.id}
                          className={`loc-opt ${pickupClinic === c.id ? "selected" : ""}`}
                          onClick={() => setPickupClinic(c.id)}>
                          <div className="loc-icon"><Icon name="pin" size={18}/></div>
                          <div className="loc-info">
                            <div className="loc-name">{c.name}</div>
                            <div className="loc-addr">{c.addr}</div>
                          </div>
                          <div className="loc-meta">AVAILABLE</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="checkout-section">
                  <h3 style={{fontSize: 20}}>Contact details</h3>
                  <p className="sub">We'll send your receipt and tracking info here.</p>
                  <div className="form-row">
                    <div className="form-field">
                      <label>First name</label>
                      <input value={contact.first} onChange={(e) => setContact({...contact, first: e.target.value})}/>
                    </div>
                    <div className="form-field">
                      <label>Last name</label>
                      <input value={contact.last} onChange={(e) => setContact({...contact, last: e.target.value})}/>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Email</label>
                      <input type="email" value={contact.email} onChange={(e) => setContact({...contact, email: e.target.value})}/>
                    </div>
                    <div className="form-field">
                      <label>Phone (for delivery updates)</label>
                      <input type="tel" value={contact.phone} onChange={(e) => setContact({...contact, phone: e.target.value})}/>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" style={{width: "100%"}} onClick={() => setStep(1)}>
                  Continue to payment <Icon name="arrow" size={14}/>
                </button>
              </>
            )}

            {/* STEP 2: PAYMENT */}
            {step === 1 && (
              <>
                <div className="checkout-section">
                  <h3>How would you like to pay?</h3>
                  <p className="sub">All payments are processed securely. Mobile Money is most popular.</p>

                  <div className="payment-list">
                    {paymentOpts.map(p => (
                      <React.Fragment key={p.id}>
                        <div className={`payment-opt ${payment === p.id ? "selected" : ""}`} onClick={() => setPayment(p.id)}>
                          <div className={`payment-logo ${p.logoClass}`}>{p.logo}</div>
                          <div className="payment-main">
                            <div className="payment-name">{p.name}</div>
                            <div className="payment-desc">{p.desc}</div>
                          </div>
                          <span className="payment-radio"></span>
                        </div>

                        {payment === p.id && p.id === "card" && (
                          <div className="payment-details">
                            <div className="form-field">
                              <label>Card number</label>
                              <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}/>
                            </div>
                            <div className="form-row" style={{gridTemplateColumns: "1fr 1fr"}}>
                              <div className="form-field">
                                <label>Expiry</label>
                                <input type="text" placeholder="MM / YY"/>
                              </div>
                              <div className="form-field">
                                <label>CVV</label>
                                <input type="text" placeholder="123"/>
                              </div>
                            </div>
                          </div>
                        )}

                        {payment === p.id && (p.id === "mtn" || p.id === "voda" || p.id === "tigo") && (
                          <div className="payment-details">
                            <div className="form-field">
                              <label>Phone number registered with {p.logo}</label>
                              <input type="tel" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)}/>
                            </div>
                            <p style={{fontSize: 12, color: "var(--lumen-muted)", margin: 0}}>
                              <Icon name="info" size={12} style={{verticalAlign: "middle", marginRight: 4}}/>
                              You'll get a prompt on your phone to authorise.
                            </p>
                          </div>
                        )}

                        {payment === p.id && p.id === "cash" && (
                          <div className="payment-details">
                            <p style={{fontSize: 13, color: "var(--lumen-muted)", margin: 0}}>
                              Have exact change ready. Our rider will call when 5 minutes away.
                            </p>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" style={{width: "100%"}} onClick={() => setStep(2)}>
                  Review your order <Icon name="arrow" size={14}/>
                </button>
                <button className="checkout-back" onClick={() => setStep(0)}>
                  <Icon name="arrow" size={14} style={{transform: "rotate(180deg)"}}/> Back to delivery
                </button>
              </>
            )}

            {/* STEP 3: REVIEW */}
            {step === 2 && (
              <>
                <div className="checkout-section">
                  <h3>Quick review</h3>
                  <p className="sub">All good? Tap "Place order" to confirm.</p>

                  <div className="summary-card" style={{padding: 0, border: "none", background: "var(--lumen-cream)"}}>
                    <div style={{padding: 20, borderBottom: "1px solid var(--lumen-border)"}}>
                      <div className="dash-tile-label" style={{marginBottom: 6}}>{deliveryType === "delivery" ? "Delivery to" : "Pickup at"}</div>
                      {deliveryType === "delivery" ? (
                        <>
                          <div style={{fontSize: 14, fontWeight: 600}}>{addr.name}</div>
                          <div style={{fontSize: 13, color: "var(--lumen-muted)"}}>{addr.line1} · {addr.line2}</div>
                          <div style={{fontSize: 13, color: "var(--lumen-muted)"}}>{addr.phone}</div>
                        </>
                      ) : (
                        <>
                          <div style={{fontSize: 14, fontWeight: 600}}>{clinics.find(c => c.id === pickupClinic)?.name}</div>
                          <div style={{fontSize: 13, color: "var(--lumen-muted)"}}>{clinics.find(c => c.id === pickupClinic)?.addr}</div>
                        </>
                      )}
                      <button onClick={() => setStep(0)} style={{fontSize: 12.5, color: "var(--lumen-blue)", textDecoration: "underline", background: "none", border: "none", padding: 0, marginTop: 8, cursor: "pointer"}}>Edit</button>
                    </div>

                    <div style={{padding: 20, borderBottom: "1px solid var(--lumen-border)"}}>
                      <div className="dash-tile-label" style={{marginBottom: 6}}>Paying with</div>
                      <div style={{fontSize: 14, fontWeight: 600}}>{paymentOpts.find(p => p.id === payment)?.name}</div>
                      {payment !== "cash" && payment !== "card" && (
                        <div style={{fontSize: 13, color: "var(--lumen-muted)"}}>{momoPhone}</div>
                      )}
                      <button onClick={() => setStep(1)} style={{fontSize: 12.5, color: "var(--lumen-blue)", textDecoration: "underline", background: "none", border: "none", padding: 0, marginTop: 8, cursor: "pointer"}}>Edit</button>
                    </div>

                    <div style={{padding: 20}}>
                      <div className="dash-tile-label" style={{marginBottom: 6}}>Contact</div>
                      <div style={{fontSize: 14, fontWeight: 600}}>{contact.first} {contact.last}</div>
                      <div style={{fontSize: 13, color: "var(--lumen-muted)"}}>{contact.email} · {contact.phone}</div>
                    </div>
                  </div>
                </div>

                <button className="checkout-place" onClick={placeOrder}>
                  Place order · &#8373;{total.toLocaleString()}
                  <Icon name="arrow" size={16}/>
                </button>

                <p style={{fontSize: 12, color: "var(--lumen-muted)", textAlign: "center", marginTop: 16}}>
                  <Icon name="shield" size={11} style={{verticalAlign: "middle", marginRight: 4}}/>
                  Your details are encrypted and never sold. By placing this order you agree to Lumen's <a href="#" style={{color: "var(--lumen-blue)", textDecoration: "underline"}}>terms</a>.
                </p>

                <button className="checkout-back" onClick={() => setStep(1)}>
                  <Icon name="arrow" size={14} style={{transform: "rotate(180deg)"}}/> Back to payment
                </button>
              </>
            )}
          </div>

          {/* Right - summary */}
          <div className="checkout-right">
            <div className="summary-card">
              <h4>Order summary</h4>

              <div className="summary-items">
                {items.map(item => {
                  const frame = FRAMES.find(f => f.id === item.frameId);
                  if (!frame) return null;
                  const color = frame.colors.find(c => c.name === item.color) || frame.colors[0];
                  return (
                    <div key={item.id} className="summary-item">
                      <div className="summary-item-img"><FrameSVG shape={frame.shape} color={color.hex}/></div>
                      <div>
                        <div className="summary-item-name">{frame.name} <span style={{fontWeight: 400, color: "var(--lumen-muted)"}}>× {item.qty || 1}</span></div>
                        <div className="summary-item-meta">{item.color} · {item.lensLabel}</div>
                      </div>
                      <div className="summary-item-price">&#8373;{(item.price * (item.qty || 1)).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span className="label">Subtotal</span>
                  <span>&#8373;{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="label">{deliveryType === "delivery" ? "Delivery" : "Pickup"}</span>
                  <span>{delivery === 0 ? "Free" : `₵${delivery}`}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>&#8373;{total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{marginTop: 24, padding: 14, background: "var(--lumen-sage-soft)", borderRadius: "var(--r-md)", display: "flex", gap: 10, alignItems: "flex-start"}}>
                <Icon name="check" size={16} style={{color: "var(--lumen-sage)", flexShrink: 0, marginTop: 2}}/>
                <div style={{fontSize: 12.5, color: "var(--lumen-ink-2)", lineHeight: 1.5}}>
                  <strong>30-day vision guarantee.</strong> If anything's not right with the fit or your prescription, we'll fix it for free.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.Checkout = Checkout;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<Checkout/>);
}
