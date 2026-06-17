import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

const ink = "#0A1F35";
const blue = "#0F4C81";
const cream = "#FAF7F2";
const muted = "#6B7280";
const white = "#FFFFFF";

interface LumenEmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function LumenEmailLayout({ preview, children }: LumenEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: cream,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px 32px",
          }}
        >
          {/* Wordmark */}
          <Section style={{ textAlign: "center", paddingBottom: "20px" }}>
            <Text
              style={{
                color: blue,
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                margin: 0,
                fontFamily:
                  "'Instrument Serif', Georgia, 'Times New Roman', serif",
              }}
            >
              LUMEN
            </Text>
            <Text
              style={{
                color: muted,
                fontSize: "10px",
                margin: "2px 0 0",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Eye Care
            </Text>
          </Section>

          {/* Blue top rule */}
          <Hr style={{ borderColor: blue, borderTopWidth: "2px", margin: 0 }} />

          {/* White card */}
          <Section
            style={{
              backgroundColor: white,
              borderRadius: "0 0 8px 8px",
              padding: "36px 40px 40px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ padding: "20px 0 0", textAlign: "center" }}>
            <Text style={{ color: muted, fontSize: "11px", margin: "0 0 6px" }}>
              Lumen Eye Care · Accra, Ghana
            </Text>
            <Text style={{ color: muted, fontSize: "11px", margin: 0 }}>
              <Link
                href="https://www.lumeneye.org"
                style={{ color: muted, textDecoration: "underline" }}
              >
                lumeneye.org
              </Link>
              {"  ·  "}
              <Link
                href="https://www.lumeneye.org/book"
                style={{ color: muted, textDecoration: "underline" }}
              >
                Book an appointment
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Shared style tokens ──────────────────────────────────────────────────────

export const emailStyles = {
  h1: {
    color: ink,
    fontSize: "24px",
    fontWeight: "400",
    fontFamily:
      "'Instrument Serif', Georgia, 'Times New Roman', serif",
    margin: "0 0 16px",
    lineHeight: "1.3",
  } as const,

  body: {
    color: ink,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  } as const,

  muted: {
    color: muted,
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 12px",
  } as const,

  label: {
    color: muted,
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    margin: "0 0 2px",
  },

  value: {
    color: ink,
    fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 12px",
  } as const,

  divider: {
    borderColor: "#E5E7EB",
    borderTopWidth: "1px",
    margin: "24px 0",
  } as const,

  button: {
    backgroundColor: blue,
    borderRadius: "8px",
    color: white,
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.02em",
    padding: "12px 28px",
    textDecoration: "none",
  } as const,

  ghostButton: {
    backgroundColor: "transparent",
    border: `1px solid ${blue}`,
    borderRadius: "8px",
    color: blue,
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "600",
    padding: "11px 28px",
    textDecoration: "none",
  } as const,
} as const;
