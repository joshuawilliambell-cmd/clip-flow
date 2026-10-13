/**
 * Capture Love's website screenshots for draft fleet-script PIP cues.
 * Review-only assets — not wired into the live studio.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "/workspace/drafts/fleet-scripts/pip";
fs.mkdirSync(OUT, { recursive: true });

/** @type {Array<{ file: string, url: string, wait?: string, scroll?: number, fullPage?: boolean, clipNote?: string }>} */
const SHOTS = [
  {
    file: "02a-lex-billing.png",
    url: "https://www.loves.com/promo/lex-how-to",
    wait: "text=Express",
  },
  {
    file: "02b-lex-credit-card.png",
    url: "https://www.lovesfinancial.com/fuel-card-bundles",
    wait: "text=Express",
  },
  {
    file: "03a-lex-fleet-fuel-card.png",
    url: "https://www.lovesfinancial.com/fuel-card-bundles",
    wait: "text=Express Card",
  },
  {
    file: "03b-tvc-fuel-card.png",
    url: "https://www.lovesfinancial.com/fuel-card-bundles",
    wait: "text=TVC Fuel Card",
  },
  {
    file: "04a-connect-portal.png",
    url: "https://www.loves.com/promo/lex-how-to",
    wait: "text=QuikQ",
  },
  {
    file: "04b-fuel-dashboard.png",
    url: "https://www.loves.com/fleetsolutions",
    wait: "text=Fleet Solutions",
  },
  {
    file: "05a-quikq.png",
    url: "https://www.loves.com/promo/lex-how-to",
    wait: "text=QuikQ",
  },
  {
    file: "06a-card-management.png",
    url: "https://www.loves.com/promo/lex-how-to",
    wait: "text=Fuel Card Management",
  },
  {
    file: "07a-rfid-cardless.png",
    url: "https://www.loves.com/promo/l-a-fleet-solutions",
    wait: "text=Express",
  },
  {
    file: "08a-fastfill-cng.png",
    url: "https://www.loves.com/locations/tx/fort-worth/loves-travel-stop-fort-worth-281",
    wait: "text=CNG",
  },
  {
    file: "09a-fleet-solutions.png",
    url: "https://www.loves.com/fleetsolutions",
    wait: "text=Fleet Solutions",
  },
  {
    file: "10a-truck-care-speedco.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco",
    wait: "text=Truck Care",
  },
  {
    file: "10b-commercial-tires.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco/commercial-truck-tires",
    wait: "text=Tire",
  },
  {
    file: "10c-oil-pm.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco/commercial-truck-oil-and-pm-services",
    wait: "text=Preventative",
  },
  {
    file: "10d-roadside-assistance.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco/roadside-assistance",
    wait: "text=Roadside",
  },
  {
    file: "11a-truck-wash.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco",
    wait: "text=Truck Wash",
  },
  {
    file: "12a-fleet-view.png",
    url: "https://www.loves.com/loves-truck-care-and-speedco/loves-fleet-view",
    wait: "text=Fleet V.I.E.W",
  },
  {
    file: "13a-freight-factoring.png",
    url: "https://www.lovesfinancial.com/fuel-card-bundles",
    wait: "text=Freight Factoring",
  },
  {
    file: "14a-cdl-legal-protection.png",
    url: "https://www.lovesfinancial.com/service/legal-services-for-drivers",
    wait: "text=Legal",
  },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
});
const page = await context.newPage();
page.setDefaultTimeout(45000);

const results = [];

for (const shot of SHOTS) {
  const outPath = path.join(OUT, shot.file);
  try {
    await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1800);
    // Dismiss common cookie banners if present
    for (const label of [/Accept all/i, /Accept Cookies/i, /I agree/i, /Got it/i]) {
      const btn = page.getByRole("button", { name: label });
      if (await btn.count()) {
        try {
          await btn.first().click({ timeout: 1500 });
          await page.waitForTimeout(400);
        } catch {
          /* ignore */
        }
      }
    }
    if (shot.wait) {
      try {
        await page.locator(shot.wait).first().scrollIntoViewIfNeeded({ timeout: 8000 });
        await page.waitForTimeout(600);
      } catch {
        /* page may still be useful */
      }
    }
    if (shot.scroll) {
      await page.evaluate((y) => window.scrollBy(0, y), shot.scroll);
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: outPath,
      fullPage: Boolean(shot.fullPage),
      type: "png",
    });
    const ok = fs.existsSync(outPath) && fs.statSync(outPath).size > 5000;
    results.push({ file: shot.file, ok, bytes: ok ? fs.statSync(outPath).size : 0, url: shot.url });
    console.log(ok ? "OK" : "SMALL", shot.file, results.at(-1).bytes);
  } catch (e) {
    results.push({ file: shot.file, ok: false, error: String(e), url: shot.url });
    console.log("FAIL", shot.file, e.message);
  }
}

await browser.close();
fs.writeFileSync(
  path.join(OUT, "capture-log.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify(
    {
      saved: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    null,
    2,
  ),
);
