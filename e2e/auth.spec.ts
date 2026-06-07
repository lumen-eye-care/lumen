import { test, expect } from "@playwright/test";

// These render checks need no backend — the (auth) pages are static SSR and the
// proxy skips Supabase when its env vars are unset (Sprint-0 pre-link state).
test.describe("auth pages render", () => {
  test("sign-in shows the form and links", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Welcome back",
    );
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create an account" }),
    ).toBeVisible();
  });

  test("sign-up shows name, email and password fields", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("reset-password shows the email field", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("sign-in carries an invalid-link notice", async ({ page }) => {
    await page.goto("/sign-in?error=link_invalid");
    await expect(page.getByRole("alert")).toContainText("invalid or has expired");
  });
});

// Full sign-up → confirm → sign-in flow. Needs a linked/local Supabase (auth.users
// + handle_new_user trigger) and, ideally, email confirmation OFF in dev so the
// session is returned without an inbox round-trip. Guarded so CI stays green until
// Sprint-0 cloud setup lands (PROGRESS.md). Run with SUPABASE_LINKED=1.
test.describe("auth flow (needs Supabase)", () => {
  test.skip(
    !process.env.SUPABASE_LINKED,
    "Set SUPABASE_LINKED=1 with a linked/local Supabase to run.",
  );

  test("sign up then reach account or the check-email panel", async ({
    page,
  }) => {
    const email = `e2e+${Date.now()}@lumen.test`;
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("supersecret123");
    await page.getByRole("button", { name: /create account/i }).click();

    // Either confirmation is OFF (redirected into the app) or ON (check-email panel).
    await expect
      .poll(async () => {
        if (page.url().includes("/account")) return "account";
        const status = page.getByRole("status");
        return (await status.count()) > 0 ? "check-email" : "pending";
      })
      .not.toBe("pending");
  });
});
