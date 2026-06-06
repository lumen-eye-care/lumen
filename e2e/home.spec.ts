import { test, expect } from "@playwright/test";

test("home page renders the Lumen hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Premium eyewear",
  );
});
