# Lumen Eye Care — App Flow & Validation Diagrams v1

**Purpose:** Visual map of every flow in the v1 build. For the junior dev to see how the pieces connect before writing code; for the experienced dev to sanity-check the system before implementing. Diagrams render natively on GitHub and in most Markdown editors.

**Companion docs:** `Outputs/Lumen_Handoff_v1.docx` (full spec), `Outputs/Lumen_CLAUDE.md` (repo rules).

**Conventions used in diagrams:**
- 🟢 Solid arrows = primary path
- 🔴 Dashed arrows = error / fallback path
- Rectangles = pages or actions
- Diamonds = decisions / validation gates
- Cylinders = persisted data (DB / storage)
- Hexagons = external services (Paystack, Resend, WhatsApp)

---

## 1. High-level customer journey

End-to-end, what a Ghanaian customer does from first social link click to wearing the frames.

```mermaid
flowchart TD
    Start([Customer sees Lumen on Instagram or shared link]) --> Home["/ — Home page"]
    Home --> Shop["/shop — browse collection"]
    Shop --> Detail["/shop/[slug] — Frame Detail"]
    Detail --> Quiz{Wants lens advice?}
    Quiz -->|Yes| LensQuiz["/lens-quiz — 5 questions"]
    LensQuiz --> Detail
    Quiz -->|No| TryOn{Wants try-on?<br/>Tier 3}
    TryOn -->|Yes| VTO["/try-on — virtual try-on"]
    VTO --> Detail
    TryOn -->|No| Add[Add to bag]
    Detail --> Add
    Add --> Cart[Cart drawer]
    Cart --> SignIn{Signed in?}
    SignIn -->|No| Auth["/sign-in OR guest checkout"]
    SignIn -->|Yes| Checkout["/checkout"]
    Auth --> Checkout
    Checkout --> Pay[Pay via MoMo / Card / COD]
    Pay --> Validate{Payment validated?}
    Validate -->|Yes| Success["/checkout/success"]
    Validate -->|No| Retry[Retry or contact support]
    Success --> Track[Order tracking in /account]
    Track --> Delivery[Yango delivers frames]
    Delivery --> Done([Customer wears Lumen 🎉])
```

**Captions:**
- The customer never has to sign in to buy (guest checkout is allowed); but signing in unlocks order tracking, address re-use, and the prescription history.
- Lens Quiz and Try-On are optional side-paths off the Frame Detail page — they enrich the experience but never block a purchase.
- The post-payment "validate" gate is the Paystack webhook (see Section 5 for the sequence).

---

## 2. Authentication flow (with email validation)

```mermaid
flowchart TD
    Start([User hits /sign-in]) --> Choice{New or existing?}
    Choice -->|New| SignUp[Enter email + password + name]
    SignUp --> CreateAuth[(Supabase Auth.users)]
    CreateAuth --> CreateRow[(public.users<br/>via trigger)]
    CreateRow --> SendEmail[Resend → verification email]
    SendEmail --> WaitVerify{User clicks link?}
    WaitVerify -->|Yes| Verified[Account verified;<br/>session cookie set]
    WaitVerify -->|No, expired| ResendBtn[Resend verification button]
    ResendBtn --> SendEmail
    Verified --> Redirect[Redirect to /account or original page]

    Choice -->|Existing| SignIn[Enter email + password]
    SignIn --> CheckAuth{Credentials valid?}
    CheckAuth -->|Yes| Session[Session cookie set]
    Session --> Redirect
    CheckAuth -->|No| Error[Show generic 'Invalid email or password']
    Error --> RateLimit{>10 fails in 10 min?}
    RateLimit -->|Yes| Locked[Supabase lockout — wait or reset]
    RateLimit -->|No| SignIn

    Choice -->|Forgot password| Reset["/reset-password"]
    Reset --> EnterEmail[Enter email]
    EnterEmail --> SendReset[Resend → reset link, 1h expiry]
    SendReset --> ClickReset{User clicks link?}
    ClickReset -->|Yes, in time| NewPwd[Set new password]
    ClickReset -->|Expired| ResetExpired[Show 'Link expired, request new']
    NewPwd --> Session
    ResetExpired --> EnterEmail
```

**Validation specifics:**
- **Generic error messages on signin** — never reveal "this email exists" via differing error text (account enumeration risk).
- **Email verification optional in dev, required in production** — toggle via Supabase project setting.
- **Lockout uses Supabase built-in** — no DIY rate limiting needed.
- **Password reset link expires in 1 hour** — Supabase default; reasonable for Ghana mobile-data scenarios where users may not check email immediately.

---

## 3. Browse → Frame Detail → Cart

```mermaid
flowchart LR
    Browse["/shop"] --> FilterSort{Apply filters / sort?}
    FilterSort -->|Yes| FilteredGrid[Filtered ProductCard grid]
    FilterSort -->|No| AllGrid[All frames grid]
    FilteredGrid --> Click[Click a frame]
    AllGrid --> Click
    Click --> Detail["/shop/frame-slug"]
    Detail --> LoadFrame[(SELECT * FROM frames<br/>WHERE slug = ?)]
    LoadFrame --> Stock{In stock?}
    Stock -->|No| Disabled[Disable Add to Bag<br/>Show 'Restocking']
    Stock -->|Yes| ColorPick[Customer picks color]
    ColorPick --> LensOpt{Wants lens customization?<br/>Tier 3}
    LensOpt -->|Yes| LensBuilder[4-step lens builder<br/>see Section 7]
    LensOpt -->|No| AddBag[Add to bag with default lens]
    LensBuilder --> AddBag
    AddBag --> CartDrawer[Cart drawer slides in]
    CartDrawer --> CartActions{Edit quantity? Remove?}
    CartActions -->|Continue| ProceedCheckout[Proceed to /checkout]
    CartActions -->|Keep shopping| Browse
```

**Notes:**
- Cart persists in `localStorage` AND syncs to DB for signed-in users (so cart follows them across devices).
- Out-of-stock frames stay on the catalogue (good for SEO + email signups) — only the Add-to-Bag CTA disables.
- Frame slug is the URL-safe lower-kebab of the name (`accra` not `Accra`).

---

## 4. Checkout — multi-step with payment branching

```mermaid
flowchart TD
    Start["/checkout"] --> Step1[Step 1: Delivery info]
    Step1 --> AddrChoice{Existing address?}
    AddrChoice -->|Yes, signed in| LoadAddr[Prefill from address book]
    AddrChoice -->|No or guest| EnterAddr[Enter delivery details]
    LoadAddr --> ValidateAddr{Phone +233 valid?<br/>City + GPS or freeform OK?}
    EnterAddr --> ValidateAddr
    ValidateAddr -->|Invalid| InlineError[Show inline errors]
    InlineError --> EnterAddr
    ValidateAddr -->|Valid| Step2[Step 2: Payment method]

    Step2 --> Method{Which method?}
    Method -->|MoMo| MoMoSelect[Pick provider<br/>MTN / Telecel / AT]
    Method -->|Card| CardFlow
    Method -->|COD| CODFlow

    MoMoSelect --> MoMoPhone[Enter MoMo phone]
    MoMoPhone --> InitiateP[POST /api/checkout/initiate]
    CardFlow --> InitiateP
    InitiateP --> CreateOrder[(INSERT orders<br/>status: 'pending')]
    CreateOrder --> PaystackCall[Call Paystack API]
    PaystackCall --> WaitWebhook[Show pending UI<br/>+ E-Levy disclosure]
    WaitWebhook --> WebhookResult{Webhook arrives?<br/>see Section 5}
    WebhookResult -->|Success| Step3Success[Step 3: Success]
    WebhookResult -->|Failure| Step3Fail[Step 3: Failure]
    WebhookResult -->|Timeout >5 min| Step3Timeout[Step 3: Pending — check phone]

    CODFlow --> CODConfirm[Confirm address + COD acceptance]
    CODConfirm --> CreateCOD[(INSERT orders<br/>status: 'cod_pending')]
    CreateCOD --> Step3COD[Step 3: COD confirmed]

    Step3Success --> Email[Resend → order confirmation email]
    Step3COD --> Email
    Email --> Track[Link to /account/orders/order-id]
```

**Validation gates:**
- **Phone**: `libphonenumber-js` normalises `0XX...` → `+233XX...`; reject non-Ghana numbers in v1.
- **GhanaPostGPS code (optional)**: validate format `GA-123-4567` if provided; do not require.
- **Address**: at minimum need name + phone + city + freeform line — landmark optional but recommended.
- **MoMo phone**: same E.164 normalisation; can differ from delivery contact phone.
- **E-Levy disclosure**: required by GRA, displayed inline before the customer submits MoMo payment.

---

## 5. Payment validation — Paystack sequence + webhook verification

This is the highest-stakes flow. Get the webhook signature verification right and idempotency right; the rest follows.

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant N as Next.js client
    participant A as /api/checkout/initiate
    participant DB as Supabase
    participant P as Paystack
    participant WH as /api/paystack/webhook
    participant R as Resend

    C->>N: Submits checkout (MoMo, card, or COD)
    N->>A: POST /api/checkout/initiate<br/>{ orderId, method, momoProvider?, momoPhone? }
    A->>DB: INSERT orders (status='pending')<br/>RETURNING id
    A->>P: Create transaction<br/>(amount, channel, callback URL)
    P-->>A: { reference, authorization_url }
    A-->>N: { reference, redirect_url? }
    N-->>C: Show pending UI + E-Levy notice<br/>(or redirect to card form)

    Note over C,P: For MoMo: customer receives push prompt on phone<br/>For Card: customer enters card on Paystack hosted form

    C->>P: Confirms payment on phone or card form
    P->>WH: POST webhook with payload<br/>+ x-paystack-signature header

    WH->>WH: Verify HMAC SHA-512 signature<br/>against PAYSTACK_SECRET_KEY
    alt Signature invalid
        WH-->>P: 401 Unauthorized
        WH-->>WH: Log security event
    else Signature valid
        WH->>WH: Check idempotency key<br/>(reference + event)
        alt Already processed
            WH-->>P: 200 OK (no-op)
        else New event
            WH->>DB: UPDATE orders SET status='paid'<br/>WHERE reference = ?
            WH->>DB: INSERT webhook_events<br/>(reference, event, payload)
            WH->>R: Send order confirmation email
            R-->>C: Email arrives
            WH-->>P: 200 OK
        end
    end

    Note over N,DB: Meanwhile, client polls<br/>GET /api/orders/[id] every 3s up to 5 min

    N->>DB: Poll order status
    DB-->>N: status='paid'
    N-->>C: Redirect to /checkout/success
```

**Validation hardening:**
- **HMAC verification** uses the raw request body (NOT the parsed JSON) — common bug source.
- **Idempotency key** = `paystack_event_id`. Stored in `webhook_events` table; reject duplicates with `200 OK no-op` (Paystack retries on non-200).
- **Order state transitions** are append-only: `pending → paid` or `pending → failed`, never `paid → pending`. Enforce via Postgres CHECK constraint or trigger.
- **Polling**: client polls for up to 5 minutes (longer than MoMo's typical confirmation window); past that, show "still processing, we'll email you" state.
- **COD path** skips this entire flow — order is `cod_pending` until Charity marks `cod_collected` in admin.

---

## 6. Prescription flow — with feature flag and WhatsApp fallback

This is the most regulatory-sensitive flow. Treat the feature flag and the DPC consent as non-negotiable.

```mermaid
flowchart TD
    Start[Customer wants prescription lenses] --> Flag{LUMEN_PRESCRIPTION_UPLOAD_ENABLED?}
    Flag -->|false<br/>default at launch| WhatsAppOnly[Show 'Message us on WhatsApp' button]
    WhatsAppOnly --> WAClick[Deep-link wa.me/233XXXX<br/>with order context prefilled]
    WAClick --> Charity[Charity handles off-platform]
    Charity --> ManualLens[Manual lens cutting via partner lab]
    ManualLens --> Ship[Ship with order]

    Flag -->|true<br/>after lens partner contracted| UploadUI[Show upload UI]
    UploadUI --> Consent[Required: explicit consent checkbox<br/>+ retention policy display]
    Consent --> ConsentCheck{Consent given?}
    ConsentCheck -->|No| WhatsAppOnly
    ConsentCheck -->|Yes| Upload[Customer uploads PDF or image]
    Upload --> Validate{File valid?<br/>< 5MB, jpg/png/pdf}
    Validate -->|No| FileError[Show file error]
    FileError --> Upload
    Validate -->|Yes| Encrypt[(Supabase Storage<br/>private bucket<br/>encrypted at rest)]
    Encrypt --> Insert[(INSERT prescriptions<br/>file_url=signed,<br/>consent_at=now)]
    Insert --> AuditLog[(INSERT prescription_access_log<br/>actor=user, action='upload')]
    AuditLog --> Notify[Notify lens-fulfillment partner<br/>via secure channel TBD]
    Notify --> Review{Partner optometrist reviews<br/>and validates Rx}
    Review -->|Valid| ApprovedQueue[Queue for lens cutting]
    Review -->|Invalid / unclear| RxIssue[Email customer for clarification<br/>via Resend]
    RxIssue --> Resolve{Customer responds with fix?}
    Resolve -->|Yes| Review
    Resolve -->|No after 7 days| Refund[Refund order, archive prescription]
    ApprovedQueue --> Cut[Lens lab cuts lenses]
    Cut --> Ship
    Ship --> CustomerWears[Customer wears prescription Lumen]
```

**Why this is feature-flagged at launch:**
1. Storing prescriptions = sensitive health data under Ghana DPA 2012 → triggers DPC registration as data controller (Charity's workstream, not the agency's).
2. Needs a named, contracted lens-fulfillment partner (optical lab) before public exposure.
3. Until both are in place, the flag stays `false` and the WhatsApp path is the only customer-visible option. Charity manages prescriptions off-platform manually.

**Online validation steps shown above:**
- File-level validation: MIME type, file size, page count.
- Consent validation: must be given explicitly before upload completes.
- Clinical validation: licensed optometrist (partner clinic) reviews the prescription before lens cutting — that's the human-in-the-loop. The system does not interpret prescriptions clinically — that would require regulatory approval Lumen doesn't have.
- Audit logging: every signed-URL generation logged with actor + timestamp.

---

## 7. Virtual Try-On (Tier 3)

The Tier 3 stretch feature. Ships only if Week-5 checkpoint is green.

```mermaid
flowchart TD
    Start["/try-on or click 'Try this on' from Frame Detail"] --> CheckPhoto{Photo previously uploaded?<br/>localStorage check}
    CheckPhoto -->|Yes| LoadPhoto[Load existing photo + transforms]
    CheckPhoto -->|No| UploadUI[Upload photo prompt]
    UploadUI --> PickPhoto[Customer picks portrait photo]
    PickPhoto --> ValidatePhoto{File valid?<br/>image, < 10MB}
    ValidatePhoto -->|No| PhotoError[Show error]
    PhotoError --> PickPhoto
    ValidatePhoto -->|Yes| StorePhoto[(localStorage:<br/>image-slot:tryon-face<br/>base64 encoded)]
    StorePhoto --> LoadPhoto
    LoadPhoto --> SelectFrame[Show frame overlay on photo]
    SelectFrame --> Transform[Customer drags/resizes overlay]
    Transform --> SaveTransform[(localStorage:<br/>lumen-tryon-frame-id<br/>{x, y, scale})]
    SaveTransform --> Compare{Wants to compare<br/>2 frames side by side?}
    Compare -->|Yes| PickSecond[Pick second frame]
    PickSecond --> SideBySide[Render two photos side by side]
    SideBySide --> Decide[Customer decides]
    Compare -->|No| Decide
    Decide --> Buy[Click 'Buy this one']
    Buy --> Cart[Add to cart with this frame + color]
    Cart --> Detail["Frame Detail with selection prefilled"]
```

**Validation specifics for try-on:**
- **Photo never leaves the device** in v1 — stored in `localStorage` as base64. Privacy by design.
- **No backend upload for try-on photos** — keeps storage cost zero and privacy footprint tiny.
- **Transforms per frame** — different frames may need different positioning; each gets its own localStorage key.
- **Tier 3 fallback**: if Try-On isn't shipped, the link silently doesn't render in the nav and Frame Detail; no broken UI.

---

## 8. Lens Quiz (Tier 2)

```mermaid
flowchart LR
    Start["/lens-quiz"] --> Q1[Q1: Vision type?<br/>Distance / Reading / Progressive]
    Q1 --> Q2[Q2: Screen time per day?<br/>< 4h / 4-8h / 8h+]
    Q2 --> Q3[Q3: Outdoor activity?<br/>Indoor / Mixed / Outdoor]
    Q3 --> Q4[Q4: Lens priority?<br/>Comfort / Style / Price]
    Q4 --> Q5[Q5: Driving / sports?<br/>Yes / No]
    Q5 --> Score[Score answers → match weights]
    Score --> Recommend[Recommend 2-3 frames + lens config]
    Recommend --> CTA[Buttons:<br/>'View frames' or 'Restart quiz']
    CTA --> Browse[/shop with filter prefilled/]
```

**Validation:**
- Each question requires an answer before advancing (button disabled until selected).
- Score → recommendation logic is a pure function in `src/lib/quiz-engine.ts` — unit tested with Vitest. Snapshot tests on the recommendation outputs.

---

## 9. Appointment request (Tier 2) — partner clinic consultation

```mermaid
flowchart TD
    Start[Customer on /clinics] --> ClinicList[Browse partner clinics]
    ClinicList --> Select[Click 'Request consultation' on a clinic]
    Select --> Auth{Signed in?}
    Auth -->|No| Prompt[Prompt sign-in or guest with phone]
    Auth -->|Yes| Form
    Prompt --> Form[Request form:<br/>reason, date preference, time window, phone]
    Form --> Validate{Form valid?<br/>phone in +233, date in future}
    Validate -->|No| Inline[Inline errors]
    Inline --> Form
    Validate -->|Yes| Submit[POST /api/appointments]
    Submit --> Save[(INSERT appointments<br/>status='requested')]
    Save --> NotifyClinic[Resend → email partner clinic<br/>with customer details]
    Save --> NotifyCust[Resend → email customer confirmation]
    NotifyClinic --> Clinic[Clinic confirms or reschedules]
    Clinic --> StatusUpdate{Confirmed?}
    StatusUpdate -->|Yes| Confirmed[Status='confirmed'<br/>Email customer]
    StatusUpdate -->|No| Reschedule[Email customer alternative time]
    Reschedule --> Customer[Customer accepts or declines]
```

**Important framing**: the request is for a **consultation** (commercial term), not a **medical exam** (clinical term). This is the linguistic guardrail per Handoff Section 9 — protects Charity given the informal optometrist arrangement.

---

## 10. Admin flow — orders + catalogue (Tier 2)

```mermaid
flowchart TD
    Start[Charity signs in] --> CheckRole{role == 'admin'?}
    CheckRole -->|No| Redirect[Redirect to /account with flash]
    CheckRole -->|Yes| Dashboard["/admin"]
    Dashboard --> Orders["/admin/orders"]
    Orders --> List[Orders list,<br/>newest first, filter by status]
    List --> ClickOrder[Click an order]
    ClickOrder --> OrderDetail[Order detail + items]
    OrderDetail --> Actions{Action?}
    Actions -->|Mark shipped| Ship[(UPDATE orders<br/>status='shipped')]
    Ship --> ShipEmail[Resend → 'Your order has shipped' email]
    Actions -->|Mark COD collected| Collect[(UPDATE orders<br/>status='cod_collected')]
    Actions -->|Refund| Refund[Trigger Paystack refund]

    Dashboard --> Frames["/admin/frames"]
    Frames --> FrameList[Catalogue list]
    FrameList --> EditFrame[Edit: price, stock, photos, badge]
    EditFrame --> SaveFrame[(UPDATE frames)]
    SaveFrame --> Revalidate[revalidatePath /shop, /shop/slug]
```

**Validation:**
- Admin role check via Supabase Auth JWT claim — middleware on `/admin/*`.
- Price changes log to an audit table so retroactive accusations of "you sold me at the wrong price" can be checked.
- Stock decrements happen at order completion (Paystack webhook `paid` event), not at add-to-cart — prevents holding stock for abandoned carts.

---

## 11. Edge case flows

### 11.1 Payment timeout — MoMo prompt never confirmed

```mermaid
sequenceDiagram
    actor C as Customer
    participant N as Client
    participant DB as Supabase
    participant Cron as Daily cron job
    Note over C,N: 5 minutes after MoMo initiated, no webhook received

    N->>DB: Poll status — still 'pending'
    N-->>C: Show 'Still processing'<br/>+ 'Check WhatsApp' + 'Try again'
    Note over C,DB: 2 hours later, still no webhook

    Cron->>DB: SELECT orders WHERE status='pending'<br/>AND created_at < now() - interval '2 hours'
    Cron->>DB: UPDATE status='failed_timeout'
    Cron->>C: Resend email: 'Your order didn't complete'
```

### 11.2 Network failure during checkout submit

```mermaid
flowchart TD
    Submit[Customer clicks Pay] --> Fetch{Network up?}
    Fetch -->|No| LocalSave[Save checkout state to localStorage]
    LocalSave --> Banner['Connection lost' banner with Retry]
    Banner --> Retry{Customer hits Retry}
    Retry --> Fetch
    Fetch -->|Yes| InitiateP[POST /api/checkout/initiate<br/>with idempotency key]
    InitiateP --> Continue[Continue normal flow]
```

### 11.3 Duplicate submit (double-click on Pay)

```mermaid
sequenceDiagram
    actor C
    participant N
    participant A as /api/checkout/initiate
    C->>N: Click Pay (first time)
    N->>A: POST with idempotency-key: abc-123
    Note over N: Button disables immediately
    C->>N: Click Pay (second time, before disable kicks in)
    N->>A: POST with idempotency-key: abc-123 (same)
    A->>A: Check idempotency table<br/>for abc-123
    A-->>N: Returns existing reference (200 OK)
    Note over A: No duplicate order created
```

### 11.4 Expired prescription

```mermaid
flowchart LR
    View[Customer views their prescriptions] --> Check{valid_until > now?}
    Check -->|Valid| Display[Show normally]
    Check -->|Expired| Grey[Display greyed out with<br/>'Expired DATE' badge]
    Grey --> CTA['Replace prescription' button]
    CTA --> NewUpload[Back to upload flow Section 6]
```

---

## 12. What this diagram set does NOT cover

Intentionally out of scope of this doc (covered elsewhere or not in v1):

- **Tax calculations** beyond E-Levy disclosure — Charity is under the GHS 50,000 threshold, all-taxes-inclusive pricing applies. No display.
- **Currency conversion** — GHS only. No USD or other.
- **SMS notifications** — deferred to v1.5 per Out of Scope.
- **Push notifications** — out of scope (web-only, no service worker / web push in v1).
- **Inventory forecasting / restock alerts** — out of scope.
- **Customer reviews / ratings** — out of scope.
- **Wishlist** — out of scope.
- **Multi-currency or multi-language** — out of scope.

---

## How to use this doc during the build

1. **At the start of each Sprint**, the dev reads the relevant flow before coding. Don't build a flow from memory.
2. **When implementing**, link the user story to the flow (e.g., "implements US-P0-05 (MoMo checkout) per app-flow.md Section 5").
3. **When the flow changes during build** (and it will), update this doc in the same PR. Don't let docs drift from code.
4. **For Claude Code**: in the project repo, commit this file as `docs/app-flow.md`. When prompting Claude Code for a new feature, reference the relevant section: "Implement the prescription upload flow per `docs/app-flow.md` Section 6, with the feature flag default `false`."

---

**Last updated:** 5 June 2026 — Bryan & Etornam
**Companion files:** `Outputs/Lumen_Handoff_v1.docx`, `Outputs/Lumen_CLAUDE.md`, `Outputs/Lumen_Proposal_v3.docx`
