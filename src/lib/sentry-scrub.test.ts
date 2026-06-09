import { describe, it, expect } from "vitest";
import type { Event } from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

describe("scrubEvent", () => {
  it("drops user identity entirely", () => {
    const out = scrubEvent({
      user: { id: "u1", email: "charity@example.com", ip_address: "10.0.0.1" },
    } as Event);
    expect(out.user).toBeUndefined();
  });

  it("strips request body, cookies, query string, and sensitive headers", () => {
    const out = scrubEvent({
      request: {
        url: "https://lumenframes.com/checkout/callback?reference=lmn_secret_ref",
        method: "GET",
        data: { phone: "+233241234567", address: "12 Oxford St" },
        cookies: { "sb-access-token": "abc" },
        query_string: "reference=lmn_secret_ref",
        headers: {
          authorization: "Bearer sk_live_xxx",
          cookie: "sb-access-token=abc",
          "x-paystack-signature": "deadbeef",
          "user-agent": "Mozilla/5.0",
        },
      },
    } as Event);

    expect(out.request?.data).toBeUndefined();
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.query_string).toBeUndefined();
    expect(out.request?.url).toBe("https://lumenframes.com/checkout/callback");
    expect(out.request?.headers?.authorization).toBe("[redacted]");
    expect(out.request?.headers?.cookie).toBe("[redacted]");
    expect(out.request?.headers?.["x-paystack-signature"]).toBe("[redacted]");
    // Non-sensitive headers are preserved.
    expect(out.request?.headers?.["user-agent"]).toBe("Mozilla/5.0");
  });

  it("redacts email + phone from messages and exception values", () => {
    const out = scrubEvent({
      message: "init failed for buyer@gmail.com",
      exception: {
        values: [{ type: "Error", value: "Invalid Email charity@example.com / +233241234567" }],
      },
    } as Event);
    expect(out.message).toBe("init failed for [redacted]");
    expect(out.exception?.values?.[0].value).not.toContain("charity@example.com");
    expect(out.exception?.values?.[0].value).not.toContain("+233241234567");
  });

  it("redacts PII-shaped breadcrumb data by key name and value", () => {
    const out = scrubEvent({
      breadcrumbs: [
        {
          message: "submitting checkout for 0241234567",
          data: { reference: "lmn_ref_123", quantity: 2, email: "x@y.com" },
        },
      ],
    } as Event);
    expect(out.breadcrumbs?.[0].message).not.toContain("0241234567");
    const data = out.breadcrumbs?.[0].data as Record<string, unknown>;
    expect(data.reference).toBe("[redacted]");
    expect(data.email).toBe("[redacted]");
    expect(data.quantity).toBe(2); // non-sensitive preserved
  });

  it("preserves our intentional safe context (order id + numeric codes)", () => {
    const out = scrubEvent({
      tags: { area: "paystack-webhook" },
      extra: { orderId: "ord_abc", expected: 58000, got: 1000, currencyOk: true },
    } as Event);
    expect(out.extra?.orderId).toBe("ord_abc");
    expect(out.extra?.expected).toBe(58000);
    expect(out.extra?.got).toBe(1000);
    expect(out.tags?.area).toBe("paystack-webhook");
  });

  it("passes a benign event through unchanged", () => {
    const out = scrubEvent({
      message: "shop page rendered",
      level: "info",
    } as Event);
    expect(out.message).toBe("shop page rendered");
    expect(out.level).toBe("info");
  });
});
