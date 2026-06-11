import { test, expect } from "@playwright/test";

// These render checks need no backend — the hero + home-visit banner render
// regardless of clinic data, and the proxy skips Supabase when its env vars
// are unset (matches auth.spec.ts). Card content is data-driven and guarded
// behind SUPABASE_LINKED below.
test.describe("clinics page renders", () => {
  test("hero shows the heading and breadcrumb", async ({ page }) => {
    await page.goto("/clinics");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Care, close to",
    );
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toContainText("Clinics");
  });

  test("home-visit banner is present", async ({ page }) => {
    await page.goto("/clinics");
    await expect(
      page.getByRole("heading", { name: /We'll come to you/i }),
    ).toBeVisible();
    await expect(page.getByText("₵250")).toBeVisible();
  });

  // Placeholder social links (bare instagram.com / x.com / facebook.com)
  // were removed in the 2026-06-10 audit 2.1 fix. This guards against them
  // creeping back — when Charity supplies real profile URLs, replace this
  // with assertions on the actual handles (and never the old twitter.com).
  test("footer has no placeholder or twitter.com social links", async ({
    page,
  }) => {
    await page.goto("/clinics");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    for (const placeholder of [
      "https://twitter.com",
      "https://x.com",
      "https://instagram.com",
      "https://facebook.com",
    ]) {
      await expect(
        footer.locator(`a[href="${placeholder}"]`),
      ).toHaveCount(0);
    }
  });
});

// Card content comes from the clinics table. Needs a linked/local Supabase
// with seeded clinics (pnpm seed). Guarded so CI stays green until cloud
// setup lands (PROGRESS.md). Run with SUPABASE_LINKED=1.
test.describe("clinic cards (needs Supabase)", () => {
  test.skip(
    !process.env.SUPABASE_LINKED,
    "Set SUPABASE_LINKED=1 with a linked/local Supabase + seeded clinics to run.",
  );

  test("renders seeded clinics with hours, flagship badge and CTAs", async ({
    page,
  }) => {
    await page.goto("/clinics");

    // Flagship clinic from the seed (src/lib/seed.ts).
    const flagship = page.getByRole("article").filter({
      hasText: "East Legon clinic",
    });
    await expect(flagship).toContainText("Flagship");

    // 7-day hours table, including the closed Sunday from stdHours.
    await expect(flagship.getByText("Sun")).toBeVisible();
    await expect(flagship.getByText("Closed")).toBeVisible();

    // Booking now routes to /book (US-P1-01).
    await expect(
      flagship.getByRole("link", { name: /Book here/i }),
    ).toHaveAttribute("href", /^\/book\?clinic=/);
    await expect(
      flagship.getByRole("link", { name: /^Call$/ }),
    ).toHaveAttribute("href", /^tel:\+233/);
  });
});
