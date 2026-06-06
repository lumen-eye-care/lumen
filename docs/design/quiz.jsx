/* global React, ReactDOM */
const { useState } = React;
const { Icon, LogoMark, FrameSVG } = window;

/* ============================================
   QUIZ DATA
   ============================================ */
const QUESTIONS = [
  {
    id: "use",
    eyebrow: "Question 1 of 5",
    question: <>What's your <span className="ital">main reason</span> for new glasses?</>,
    sub: "We'll tailor every following question to your answer.",
    cols: 2,
    options: [
      { id: "distance", icon: "eye", title: "I struggle to see far away", desc: "Driving, screens at a distance, signs" },
      { id: "reading", icon: "book", title: "I struggle to read up close", desc: "Books, menus, phone screens" },
      { id: "both", icon: "glasses", title: "Both — distance and reading", desc: "I switch glasses or get headaches", recommended: true },
      { id: "screen", icon: "monitor", title: "Just for screens", desc: "Computer or phone strain" },
    ],
  },
  {
    id: "lifestyle",
    eyebrow: "Question 2 of 5",
    question: <>Where do you <span className="ital">spend most</span> of your day?</>,
    sub: "Your environment shapes which coatings will help you most.",
    cols: 2,
    options: [
      { id: "office", icon: "monitor", title: "Office or screen-based work", desc: "Computer 6+ hours a day", recommended: true },
      { id: "outdoor", icon: "sun", title: "Mostly outdoors", desc: "Driving, field work, sport" },
      { id: "mixed", icon: "refresh", title: "A bit of everything", desc: "Indoors, outdoors, on the move" },
      { id: "home", icon: "home", title: "Mostly at home", desc: "Reading, hobbies, family" },
    ],
  },
  {
    id: "screens",
    eyebrow: "Question 3 of 5",
    question: <>How many <span className="ital">screen hours</span> a day?</>,
    sub: "Phone + laptop + TV combined. Be honest — most of us underestimate.",
    cols: 1,
    options: [
      { id: "low", icon: "clock", title: "Under 4 hours", desc: "I limit screens or rarely use them" },
      { id: "med", icon: "clock", title: "4–7 hours", desc: "Average screen use" },
      { id: "high", icon: "clock", title: "7–10 hours", desc: "Most of my work is on a screen", recommended: true },
      { id: "very-high", icon: "clock", title: "10+ hours", desc: "Screens dominate my day" },
    ],
  },
  {
    id: "outdoor",
    eyebrow: "Question 4 of 5",
    question: <>How often are you <span className="ital">in bright sunlight?</span></>,
    sub: "Ghana sun is intense. Light-reactive lenses save you swapping pairs.",
    cols: 2,
    options: [
      { id: "rare", icon: "moon", title: "Rarely", desc: "I'm mostly inside" },
      { id: "some", icon: "sun", title: "A bit each day", desc: "Walking to/from places" },
      { id: "lots", icon: "sun", title: "Quite a lot", desc: "I commute, drive or work outside", recommended: true },
      { id: "always", icon: "sun", title: "All day", desc: "I work or play outdoors" },
    ],
  },
  {
    id: "priority",
    eyebrow: "Question 5 of 5",
    question: <>What matters <span className="ital">most</span> to you in a lens?</>,
    sub: "Pick the one thing you'd never compromise on.",
    cols: 2,
    options: [
      { id: "clarity", icon: "sparkle", title: "Crystal-clear vision", desc: "I want premium optics, no compromise", recommended: true },
      { id: "comfort", icon: "shield", title: "Less eye strain", desc: "I want comfort over long days" },
      { id: "price", icon: "award", title: "Best value", desc: "Quality lenses that don't break the bank" },
      { id: "looks", icon: "palette", title: "Looks & lightness", desc: "Thinnest, lightest possible lens" },
    ],
  },
];

/* ============================================
   RESULT MAPPING (simple — biased toward the recommended path)
   ============================================ */
const RESULT_DEFAULT = {
  name: "Lumen Pro · Blue-light",
  shape: "round",
  desc: "A premium single-vision lens with anti-reflective coating, UV400 protection, and a blue-light filter — tuned for screen-heavy days under Ghana sun.",
  features: [
    "Blue-light filter (reduces digital eye strain)",
    "Anti-reflective coating (clearer night vision)",
    "UV400 protection (full UV-A & UV-B)",
    "Scratch-resistant hard coat",
    "Free fitting at any Lumen clinic",
  ],
  price: 260,
  total: "From ₵710 (frame + lenses)",
};

/* ============================================
   QUIZ PAGE
   ============================================ */
const QuizPage = () => {
  const [step, setStep] = useState(-1); // -1 = intro, 0..N-1 = questions, N = result
  const [answers, setAnswers] = useState({});

  const total = QUESTIONS.length;
  const progress = step < 0 ? 0 : Math.min(((step + 1) / (total + 1)) * 100, 100);

  const start = () => setStep(0);
  const select = (id) => setAnswers(a => ({ ...a, [QUESTIONS[step].id]: id }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(-1, s - 1));
  const restart = () => { setStep(-1); setAnswers({}); };

  /* INTRO */
  if (step === -1) {
    return (
      <div className="quiz-page">
        <div className="quiz-page-nav">
          <a href="Lumen Eye Care.html" className="logo">
            <span className="logo-mark"><LogoMark/></span>
            Lumen
          </a>
          <a href="Lumen Eye Care.html" className="quiz-page-close" aria-label="Close">
            <Icon name="x" size={14}/>
          </a>
        </div>

        <div className="quiz-page-body">
          <div className="quiz-page-inner quiz-intro">
            <div className="quiz-page-eyebrow"><span className="dot"></span>Lens recommendation</div>
            <h1 className="quiz-intro-title">
              Find your <span className="ital">perfect lens</span><br/>
              in five questions.
            </h1>
            <p className="quiz-intro-sub">
              The right lens matters as much as the right frame. Tell us about your life,
              and we'll match you to the lens technology that fits — no fluff, no upsell.
            </p>

            <button className="btn btn-primary btn-lg" onClick={start}>
              Start the quiz
              <Icon name="arrow" size={16}/>
            </button>

            <div className="quiz-intro-meta">
              <span className="meta-item"><Icon name="clock" size={14}/> Takes 60 seconds</span>
              <span className="meta-item"><Icon name="shield" size={14}/> Free & no signup</span>
              <span className="meta-item"><Icon name="sparkle" size={14}/> Tailored to Ghana sun</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* RESULT */
  if (step >= total) {
    return (
      <div className="quiz-page">
        <div className="quiz-page-nav">
          <a href="Lumen Eye Care.html" className="logo">
            <span className="logo-mark"><LogoMark/></span>
            Lumen
          </a>
          <div className="quiz-progress-wrap">
            <div className="quiz-progress-meta">
              <span>Complete</span>
              <span>100%</span>
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-bar-fill" style={{width: "100%"}}></div>
            </div>
          </div>
          <a href="Lumen Eye Care.html" className="quiz-page-close" aria-label="Close">
            <Icon name="x" size={14}/>
          </a>
        </div>

        <div className="quiz-page-body">
          <div className="quiz-result">
            <div className="quiz-result-eyebrow"><span className="dot"></span>Your recommendation</div>
            <h1 className="quiz-result-title">
              We recommend the <span className="ital">{RESULT_DEFAULT.name}.</span>
            </h1>
            <p className="quiz-result-sub">
              Based on your screen-heavy days and Ghana sun exposure, this is the lens
              that will serve you longest with the least eye strain.
            </p>

            <div className="quiz-result-card">
              <div className="quiz-result-card-visual">
                <FrameSVG shape={RESULT_DEFAULT.shape} color="#0F4C81"/>
              </div>
              <div className="quiz-result-card-info">
                <h3>{RESULT_DEFAULT.name}</h3>
                <p>{RESULT_DEFAULT.desc}</p>

                <div className="quiz-result-feats">
                  {RESULT_DEFAULT.features.map((f, i) => (
                    <div key={i} className="quiz-result-feat">
                      <span className="quiz-result-feat-tick"><Icon name="check" size={10}/></span>
                      {f}
                    </div>
                  ))}
                </div>

                <div className="quiz-result-price">
                  &#8373;{RESULT_DEFAULT.price}
                  <span className="meta">lens upgrade · or {RESULT_DEFAULT.total}</span>
                </div>

                <div className="quiz-result-ctas" style={{justifyContent: "flex-start"}}>
                  <a href="Frame Detail.html" className="btn btn-primary">
                    Pick a frame
                    <Icon name="arrow" size={14}/>
                  </a>
                  <a href="Lumen Eye Care.html" className="btn btn-ghost">
                    Book an eye test
                  </a>
                </div>
              </div>
            </div>

            <p className="quiz-result-foot">
              Not sure? <a href="#" onClick={(e) => { e.preventDefault(); restart(); }}>Retake the quiz</a> or
              {" "}<a href="Lumen Eye Care.html">talk to one of our optometrists</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* QUESTION */
  const q = QUESTIONS[step];
  const selected = answers[q.id];
  const canContinue = !!selected;

  return (
    <div className="quiz-page">
      <div className="quiz-page-nav">
        <a href="Lumen Eye Care.html" className="logo">
          <span className="logo-mark"><LogoMark/></span>
          Lumen
        </a>
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-meta">
            <span>Step {step + 1} of {total}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-bar-fill" style={{width: `${progress}%`}}></div>
          </div>
        </div>
        <a href="Lumen Eye Care.html" className="quiz-page-close" aria-label="Close">
          <Icon name="x" size={14}/>
        </a>
      </div>

      <div className="quiz-page-body">
        <div className="quiz-page-inner" key={step}>
          <div className="quiz-page-eyebrow"><span className="dot"></span>{q.eyebrow}</div>
          <h1 className="quiz-page-question">{q.question}</h1>
          <p className="quiz-page-sub">{q.sub}</p>

          <div className={`quiz-page-options ${q.cols === 2 ? "cols-2" : ""}`}>
            {q.options.map(opt => (
              <button
                key={opt.id}
                className={`quiz-page-option ${selected === opt.id ? "selected" : ""}`}
                onClick={() => select(opt.id)}
              >
                <div className="quiz-page-option-icon">
                  <Icon name={opt.icon} size={20}/>
                </div>
                <div className="quiz-page-option-main">
                  <div className="quiz-page-option-title">
                    {opt.title}
                    {opt.recommended && <span className="quiz-page-option-tag">Most chosen</span>}
                  </div>
                  <div className="quiz-page-option-desc">{opt.desc}</div>
                </div>
                <span className="quiz-page-radio"></span>
              </button>
            ))}
          </div>

          <div className="quiz-page-nav-row">
            <button className="quiz-skip" onClick={back}>
              {step === 0 ? "← Back to intro" : "← Previous"}
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={next}
              disabled={!canContinue}
              style={{opacity: canContinue ? 1 : 0.4, cursor: canContinue ? "pointer" : "not-allowed"}}
            >
              {step === total - 1 ? "See my recommendation" : "Continue"}
              <Icon name="arrow" size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.LumenPages = window.LumenPages || {};
window.LumenPages.LensQuiz = QuizPage;
if (!window.__lumen_no_auto) {
  ReactDOM.createRoot(document.getElementById("root")).render(<QuizPage/>);
}
