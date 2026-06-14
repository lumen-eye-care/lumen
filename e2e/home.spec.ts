import { test, expect } from "@playwright/test";

test("home page renders the Lumen hero", async ({ page }) => {
  await page.goto("/");
  // Immersive hero H1 reads "Vision, brought into focus." (split over a <br>).
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vision");
});
