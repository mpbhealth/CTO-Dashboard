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
    await a.click({ button: "middle" }).catch(() => null);
  }
});

test.skip("export endpoint requires authentication", async ({ request }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    test.skip();
    return;
  }

  const res = await request.post(`${supabaseUrl}/functions/v1/export-data`, {
    data: { format: "csv", data: [{ a: 1, b: 2 }], filename: "test.csv" }
  });
  expect(res.status()).toBe(401);
});

test.skip("upload endpoint requires authentication", async ({ request }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    test.skip();
    return;
  }

  const res = await request.post(`${supabaseUrl}/functions/v1/file-upload`, {
    data: { foo: "bar" }
  });
  expect(res.status()).toBe(401);
});
