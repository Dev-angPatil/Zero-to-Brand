import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Login & Onboarding Flow", () => {
  const dbTestPath = path.resolve(process.cwd(), "src/data/db.test.json");

  test.beforeEach(async () => {
    // Clean test database before each test
    if (fs.existsSync(dbTestPath)) {
      try {
        fs.unlinkSync(dbTestPath);
      } catch (e) {
        console.error("Failed to delete test database", e);
      }
    }
  });

  test.afterAll(async () => {
    // Clean up test database after all tests complete
    if (fs.existsSync(dbTestPath)) {
      try {
        fs.unlinkSync(dbTestPath);
      } catch (e) {
        console.error("Failed to delete test database", e);
      }
    }
  });

  test("should render the landing page, complete the 3-step wizard, upload a craft image, and redirect to brand reveal dashboard", async ({ page }) => {
    // 1. Navigate to the landing page
    await page.goto("/");

    // 2. Assert page header is visible
    await expect(page.locator("h1")).toHaveText("Your Brand, Handcrafted");

    // 3. Complete Step 1: Brand Info
    await page.fill("#brandName", "Varnam Crafted");
    await page.fill("#productType", "Terracotta Clay Pot");
    await page.click("text=Next Step");

    // 4. Complete Step 2: Vibe & Style Selection
    await page.click("text=Next Step");

    // 5. Complete Step 3: Photo Upload
    const mockImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    // Get the hidden input file element and upload the file
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "test-craft.png",
      mimeType: "image/png",
      buffer: mockImageBuffer,
    });

    // 6. Assert that it shows progress state, then redirects to /brand with a draftId
    await page.waitForURL(/\/brand\?draftId=.+/, { timeout: 15000 });

    // Verify brand page elements
    expect(page.url()).toContain("/brand");
    expect(page.url()).toContain("draftId=");
  });
});
