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

  test("should render the login page, upload a craft image, and redirect to config onboarding", async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto("/login");

    // 2. Assert page header is visible
    await expect(page.locator("h1")).toHaveText("Your Brand, Handcrafted");

    // 3. Upload a mock craft image file
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

    // 4. Assert that it shows progress state, then redirects to /config with a draftId
    await page.waitForURL(/\/config\?draftId=.+/, { timeout: 15000 });

    // Verify config page elements
    expect(page.url()).toContain("/config");
    expect(page.url()).toContain("draftId=");
  });
});
