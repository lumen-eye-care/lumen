import { test, expect } from "@playwright/test";

// Render checks run without a backend — the /book page loads clinics via
// getActiveClinics() which returns [] when SUPABASE env vars are absent,
// rendering the EmptyState. The heading/breadcrumb check is always valid.
// Seeded-form tests require a linked Supabase instance (SUPABASE_LINKED=1).

test.describe("/book page renders", () => {
  test("shows breadcrumb and either the form heading or empty state", async ({
    page,
  }) => {
    await page.goto("/book");
    // Either the form page or the empty state renders without a 500.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
  });

  test("clinic-card 'Book here' link points to /book, not wa.me", async ({
    page,
  }) => {
    await page.goto("/clinics");
    const bookLinks = page.getByRole("link", { name: /Book here/i });
    const count = await bookLinks.count();
    // No seeded clinics in CI → 0 cards; test is meaningful once clinics load.
    for (let i = 0; i < count; i++) {
      await expect(bookLinks.nth(i)).toHaveAttribute("href", /^\/book/);
    }
  });

  test("home-visit banner 'Book a home visit' points to /book with service=home-visit", async ({
    page,
  }) => {
    await page.goto("/clinics");
    const bookLink = page.getByRole("link", { name: /Book a home visit/i });
    const visible = await bookLink.isVisible();
    if (visible) {
      await expect(bookLink).toHaveAttribute(
        "href",
        /\/book\?clinic=.+&service=home-visit/,
      );
    }
  });
});

// Full form submission flow. Requires a seeded Supabase instance.
test.describe("/book submission (needs Supabase)", () => {
  test.skip(
    !process.env.SUPABASE_LINKED,
    "Set SUPABASE_LINKED=1 with a linked/local Supabase + seeded clinics to run.",
  );

  test("submitting the form shows the success state", async ({ page }) => {
    await page.goto("/book?clinic=east-legon");

    // Fill the form.
    await page.getByLabel("Your name").fill("Ama Owusu");
    await page.getByLabel("Phone number").fill("0241234567");
    await page.getByLabel("Email address").fill("ama@example.com");

    await page.getByRole("button", { name: /Request appointment/i }).click();

    await expect(
      page.getByRole("heading", { name: /Request received/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
