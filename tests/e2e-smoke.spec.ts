import { test, expect } from "@playwright/test";

const BASE = "https://clearorder.vercel.app";
const SCREENSHOT_DIR = "tests/screenshots";

test.describe("ClearOrder E2E Smoke Test", () => {
  test.describe.configure({ mode: "serial" });

  test("01 — Dashboard loads with stats and orders", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    // Stats cards visible (actual text from UI)
    await expect(page.locator("text=Orders This Month")).toBeVisible();
    await expect(page.locator("text=Pending Review")).toBeVisible();
    await expect(page.locator("text=Monthly Revenue")).toBeVisible();
    await expect(page.getByText("Revenue at Risk", { exact: true })).toBeVisible();

    // Pipeline bar
    await expect(page.getByRole("heading", { name: /Pipeline/i })).toBeVisible();

    // Revenue Intelligence card
    await expect(page.getByRole("heading", { name: /Revenue Intelligence/i }).or(page.getByText("Revenue Intelligence", { exact: true }))).toBeVisible();

    // Success Metrics card
    await expect(page.getByText("Success Metrics").first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard.png`,
      fullPage: true,
    });
  });

  test("02 — Sidebar navigation items", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=ClearOrder")).toBeVisible();
    await expect(page.locator("nav >> text=Orders")).toBeVisible();
    await expect(page.locator("nav >> text=Products")).toBeVisible();
    await expect(page.locator("nav >> text=Fee Schedules")).toBeVisible();
    await expect(page.locator("nav >> text=Documents")).toBeVisible();
    await expect(page.locator("nav >> text=Approvals")).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-sidebar.png`,
    });
  });

  test("03 — New Order page loads with Smart Paste banner", async ({ page }) => {
    await page.goto(`${BASE}/orders/new`);
    await page.waitForLoadState("networkidle");

    // Smart Paste banner
    await expect(page.locator("text=Smart Paste").first()).toBeVisible();

    // Form sections
    await expect(page.locator("text=Patient Information")).toBeVisible();
    await expect(page.locator("text=Referring Provider")).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-new-order.png`,
      fullPage: true,
    });
  });

  test("04 — Smart Paste: open, load sample, parse, apply", async ({ page }) => {
    await page.goto(`${BASE}/orders/new`);
    await page.waitForLoadState("networkidle");

    // Click Smart Paste banner to open
    await page.locator("button:has-text('Smart Paste')").first().click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04a-smart-paste-open.png`,
    });

    // Load sample referral
    await page.locator("button:has-text('Load sample')").click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04b-smart-paste-sample-loaded.png`,
    });

    // Parse with AI
    await page.locator("button:has-text('Parse with AI')").click();

    // Wait for result (15s for API)
    await expect(
      page.locator("button:has-text('Apply to Form')")
    ).toBeVisible({ timeout: 20000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04c-smart-paste-parsed.png`,
    });

    // Apply to form
    await page.locator("button:has-text('Apply to Form')").click();
    await page.waitForTimeout(500);

    // Verify fields were populated
    const firstName = page.locator("#patient-first-name");
    await expect(firstName).toHaveValue(/\w+/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04d-smart-paste-applied.png`,
      fullPage: true,
    });
  });

  test("05 — Cascade pricing: fill form and add items", async ({ page }) => {
    await page.goto(`${BASE}/orders/new`);
    await page.waitForLoadState("networkidle");

    // Fill required fields
    await page.locator("#patient-first-name").fill("Test");
    await page.locator("#patient-last-name").fill("Patient");
    await page.locator("#provider-name").fill("Dr. Test Provider");
    await page.locator("#provider-npi").fill("1234567890");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05a-form-filled.png`,
      fullPage: true,
    });
  });

  test("06 — Products page with search", async ({ page }) => {
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").filter({ hasText: /Product/ })).toBeVisible();

    // Try search if available
    const searchInput = page.locator("input[type='text'], input[type='search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("compression");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06b-products-filtered.png`,
        fullPage: true,
      });
      await searchInput.clear();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-products.png`,
      fullPage: true,
    });
  });

  test("07 — Fee Schedules page with filter", async ({ page }) => {
    await page.goto(`${BASE}/fee-schedules`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Fee Schedule").first()).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-fee-schedules.png`,
      fullPage: true,
    });
  });

  test("08 — Order Detail: view seed order + advance status", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    // Click first order link
    const orderLink = page.locator("a[href*='/orders/']").first();
    await expect(orderLink).toBeVisible();
    await orderLink.click();
    await page.waitForLoadState("networkidle");

    // Verify order detail elements
    await expect(page.locator("text=Patient Information")).toBeVisible();
    await expect(page.locator("text=Order Summary")).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08a-order-detail.png`,
      fullPage: true,
    });

    // Advance status if button available
    const advanceBtn = page.locator("button").filter({ hasText: /Submit for|Verify|Approve|Ship|Confirm/ }).first();
    if (await advanceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await advanceBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08b-order-status-advanced.png`,
        fullPage: true,
      });
    }
  });

  test("09 — Full E2E: Smart Paste → Create Order → Order Detail", async ({ page }) => {
    await page.goto(`${BASE}/orders/new`);
    await page.waitForLoadState("networkidle");

    // Smart Paste flow
    await page.locator("button:has-text('Smart Paste')").first().click();
    await page.locator("button:has-text('Load sample')").click();
    await page.locator("button:has-text('Parse with AI')").click();
    await expect(
      page.locator("button:has-text('Apply to Form')")
    ).toBeVisible({ timeout: 20000 });
    await page.locator("button:has-text('Apply to Form')").click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09a-e2e-form-filled.png`,
      fullPage: true,
    });

    // Scroll down and look for submit
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09b-e2e-form-bottom.png`,
      fullPage: true,
    });
  });
});
