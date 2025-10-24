/**
 * Simple internal link checker for Next.js exported routes.
 * Usage: node scripts/link-check.mjs http://localhost:3000
 */
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const base = process.argv[2] || "http://localhost:3000";
const seen = new Set();
const broken = [];

async function crawl(url) {
  if (seen.has(url)) return;
  seen.add(url);
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status >= 400) {
      broken.push({ url, status: res.status });
      return;
    }
    const html = await res.text();
    const dom = new JSDOM(html);
    const links = [...dom.window.document.querySelectorAll("a[href]")]
      .map(a => a.getAttribute("href"))
      .filter(href => href && href.startsWith("/"))
      .map(href => new URL(href, base).toString());
    await Promise.all(links.map(crawl));
  } catch (e) {
    broken.push({ url, status: -1, error: String(e) });
  }
}

(async () => {
  await crawl(base);
  if (broken.length) {
    console.error("Broken links:");
    broken.forEach(b => console.error(b));
    process.exit(1);
  } else {
    console.log("No broken internal links found.");
  }
})();
