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

  test("footer links to X, not Twitter", async ({ page }) => {
    await page.goto("/clinics");
    const x = page.getByRole("link", { name: "X", exact: true });
    await expect(x).toHaveAttribute("href", "https://x.com");
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
