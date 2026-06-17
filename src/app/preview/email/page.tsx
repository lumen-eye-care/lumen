import { notFound } from "next/navigation";
import Link from "next/link";

const TEMPLATES = [
  { name: "order-confirmed-card", label: "Order confirmed (MoMo / card payment)" },
  { name: "order-confirmed-cod", label: "Order confirmed (cash on delivery)" },
  { name: "order-shipped", label: "Order shipped" },
  { name: "appointment-received", label: "Appointment request received (customer)" },
  { name: "appointment-alert", label: "New booking alert (rep / ops inbox)" },
  { name: "appointment-confirmed", label: "Appointment confirmed (customer)" },
  { name: "appointment-cancelled", label: "Appointment cancelled (customer)" },
  { name: "appointment-completed", label: "Appointment completed / thank you (customer)" },
  { name: "prescription-verified", label: "Prescription verified (customer)" },
  { name: "prescription-rejected", label: "Prescription rejected (customer)" },
];

export default function EmailPreviewIndex() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        maxWidth: 640,
        margin: "48px auto",
        padding: "0 24px",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Email previews</h1>
      <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 32 }}>
        Dev only — opens each template in a new tab rendered as real HTML mail.
        Check on mobile width too (resize to ~375 px).
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {TEMPLATES.map(({ name, label }) => (
          <li key={name} style={{ marginBottom: 12 }}>
            <Link
              href={`/preview/email/${name}`}
              target="_blank"
              rel="noopener"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                textDecoration: "none",
                color: "#0A1F35",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#0F4C81", fontWeight: 600, minWidth: 220, fontSize: 12, fontFamily: "monospace" }}>
                {name}
              </span>
              <span style={{ color: "#6B7280" }}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
