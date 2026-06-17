import { Hr, Link, Section, Text } from "@react-email/components";
import { LumenEmailLayout, emailStyles } from "./layout";
import { formatGhs } from "@/lib/format-money";

// ── Order Confirmed ──────────────────────────────────────────────────────────

interface OrderConfirmedEmailProps {
  name: string | null;
  reference: string;
  totalPesewa: number;
  method: string;
  siteUrl: string;
}

export function OrderConfirmedEmail({
  name,
  reference,
  totalPesewa,
  method,
  siteUrl,
}: OrderConfirmedEmailProps) {
  const isCod = method === "cod";
  const greeting = name ? `Hi ${name}` : "Hi there";

  return (
    <LumenEmailLayout
      preview={`Order confirmed — ${reference} · ${formatGhs(totalPesewa)}`}
    >
      <Text style={emailStyles.h1}>
        {isCod ? "Order received" : "Order confirmed"}
      </Text>
      <Text style={emailStyles.body}>
        {greeting}, thank you for your order.
      </Text>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={emailStyles.label}>Order reference</Text>
        <Text style={emailStyles.value}>{reference}</Text>

        <Text style={emailStyles.label}>Total</Text>
        <Text style={emailStyles.value}>{formatGhs(totalPesewa)}</Text>

        <Text style={emailStyles.label}>Payment</Text>
        <Text style={emailStyles.value}>
          {isCod ? "Cash on delivery" : method === "momo" ? "MTN MoMo / Mobile Money" : "Card payment"}
        </Text>
      </Section>

      <Hr style={emailStyles.divider} />

      {isCod ? (
        <Text style={emailStyles.body}>
          You&apos;ve chosen to pay on delivery. We&apos;ll be in touch to arrange delivery and collect payment.
        </Text>
      ) : (
        <Text style={emailStyles.body}>
          Your payment is confirmed and we&apos;re preparing your frames.
        </Text>
      )}

      <Text style={emailStyles.body}>
        You can track your order status in your account at any time.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={`${siteUrl}/account/orders`} style={emailStyles.button}>
          View your order
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Questions? Reply to this email or message us on{" "}
        <Link href="https://wa.me/233245628432" style={{ color: "#0F4C81" }}>
          WhatsApp
        </Link>
        .
      </Text>
    </LumenEmailLayout>
  );
}

// ── Order Shipped ────────────────────────────────────────────────────────────

interface OrderShippedEmailProps {
  name: string | null;
  reference: string;
  totalPesewa: number;
  siteUrl: string;
}

export function OrderShippedEmail({
  name,
  reference,
  totalPesewa,
  siteUrl,
}: OrderShippedEmailProps) {
  const greeting = name ? `Hi ${name}` : "Hi there";

  return (
    <LumenEmailLayout preview={`Your order is on its way — ${reference}`}>
      <Text style={emailStyles.h1}>Your order is on its way</Text>
      <Text style={emailStyles.body}>
        {greeting}, good news — your Lumen order is on its way to you.
      </Text>

      <Hr style={emailStyles.divider} />

      <Section>
        <Text style={emailStyles.label}>Order reference</Text>
        <Text style={emailStyles.value}>{reference}</Text>

        <Text style={emailStyles.label}>Total</Text>
        <Text style={emailStyles.value}>{formatGhs(totalPesewa)}</Text>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.body}>
        We&apos;ll be in touch with delivery details. You can also track your order in your account.
      </Text>

      <Section style={{ paddingTop: "8px" }}>
        <Link href={`${siteUrl}/account/orders`} style={emailStyles.button}>
          Track your order
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.muted}>
        Any questions about delivery? Reply to this email or message us on{" "}
        <Link href="https://wa.me/233245628432" style={{ color: "#0F4C81" }}>
          WhatsApp
        </Link>
        .
      </Text>
    </LumenEmailLayout>
  );
}
