import { chromium } from "playwright";

const base = process.env.SMOKE_URL || "http://127.0.0.1:43123/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("WebSocket")) {
    errors.push(msg.text());
  }
});

await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("text=Step 1: Add your video", { timeout: 15000 });

const practice = page.getByRole("button", { name: /Try a practice video/i });
await practice.scrollIntoViewIfNeeded();
await practice.click();
await page.waitForSelector("text=sample-intro", { timeout: 20000 });

await page.getByRole("button", { name: /Continue to Team Photos/i }).click();
await page.waitForSelector("text=Step 2: Add your team", { timeout: 10000 });

await page.getByRole("button", { name: /Load practice team/i }).click();
await page.waitForSelector('input[placeholder="Example: Jared"]', {
  timeout: 15000,
});

await page.getByRole("button", { name: /Continue to next step/i }).click();
await page.waitForSelector("text=Export to MP4", { timeout: 10000 });
await page.waitForSelector("text=Steady Focus", { timeout: 5000 });

console.log(
  JSON.stringify(
    {
      ok: true,
      pageErrors: errors.slice(0, 8),
    },
    null,
    2,
  ),
);

await browser.close();
