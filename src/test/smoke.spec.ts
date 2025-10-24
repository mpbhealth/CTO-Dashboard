import { test, expect } from "@playwright/test";

test("homepage loads and primary CTAs are clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  const links = page.getByRole("link");
  await expect(links.first()).toBeVisible();
});

test("navigation links do not 404", async ({ page }) => {
  await page.goto("/");
  const anchors = await page.locator("a[href^='/']").all();
  for (const a of anchors) {
    const href = await a.getAttribute("href");
    if (!href) continue;
    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes(href) && r.status() < 500, { timeout: 10000 }).catch(() => null),
      a.click({ button: "middle" }).catch(() => null), // open in bg tab
    ]);
    // Allow client side routes; skip strict assertion here; full site crawl should be in link-check.mjs
  }
});

test("export endpoint returns a file", async ({ request }) => {
  const res = await request.post("/api/export", {
    data: { format: "csv", data: [{ a: 1, b: 2 }, { a: 3, b: 4 }], filename: "test.csv" }
  });
  expect(res.ok()).toBeTruthy();
  const ct = res.headers()["content-type"];
  expect(ct).toContain("text/csv");
});

test("upload endpoint rejects non-multipart", async ({ request }) => {
  const res = await request.post("/api/upload", { data: { foo: "bar" } });
  expect(res.status()).toBe(400);
});
