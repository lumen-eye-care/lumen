import { Hr, Link, Section, Text } from "@react-email/components";
import { LumenEmailLayout, emailStyles } from "./layout";

// ── Prescription Verified (customer) ─────────────────────────────────────────

interface PrescriptionVerifiedEmailProps {
  name: string | null;
  reviewNotes: string | null;
  shopUrl: string;
}

export function PrescriptionVerifiedEmail({
  name,
  reviewNotes,
  shopUrl,
}: PrescriptionVerifiedEmailProps) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  return (
    <LumenEmailLayout preview="Your prescription has been verified — you're ready to shop">
      <Text style={emailStyles.h1}>Your prescription is verified</Text>
      <Text style={emailStyles.body}>
        {greeting}, our team has reviewed your prescription and everything looks good.
        You&apos;re all set to choose your frames.
      </Text>

      {reviewNotes && (
        <>
          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.label}>Note from our team</Text>
          <Text style={emailStyles.value}>{reviewNotes}</Text>
        </>
      )}

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.body}>
        Browse the Lumen collection and find a pair that suits you.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={shopUrl} style={emailStyles.button}>
          Browse frames
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Questions about your prescription or our lenses? Reply to this email or{" "}
        <Link href="https://www.lumeneye.org/book" style={{ color: "#0F4C81" }}>
          book an eye test
        </Link>{" "}
        at one of our clinics.
      </Text>
    </LumenEmailLayout>
  );
}

// ── Prescription Rejected (customer) ─────────────────────────────────────────

interface PrescriptionRejectedEmailProps {
  name: string | null;
  reviewNotes: string | null;
  bookUrl: string;
}

export function PrescriptionRejectedEmail({
  name,
  reviewNotes,
  bookUrl,
}: PrescriptionRejectedEmailProps) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  return (
    <LumenEmailLayout preview="About your prescription upload — we need a little more from you">
      <Text style={emailStyles.h1}>We couldn&apos;t verify your prescription</Text>
      <Text style={emailStyles.body}>
        {greeting}, our team reviewed your prescription upload but we weren&apos;t able to
        verify it. This sometimes happens if the image is unclear, expired, or the
        details are incomplete.
      </Text>

      {reviewNotes && (
        <>
          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.label}>What our team found</Text>
          <Text style={emailStyles.value}>{reviewNotes}</Text>
        </>
      )}

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.body}>
        The easiest next step is to book an eye test at one of our clinics. Our
        optometrists will issue a fresh prescription on the spot — usually takes about 30 minutes.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={bookUrl} style={emailStyles.button}>
          Book an eye test
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        You can also upload a new prescription from your{" "}
        <Link href="https://www.lumeneye.org/account/prescriptions" style={{ color: "#0F4C81" }}>
          account page
        </Link>
        . Reply to this email if you have any questions.
      </Text>
    </LumenEmailLayout>
  );
}
