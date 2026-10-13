import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "/workspace/drafts/fleet-scripts/pip";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.setDefaultTimeout(45000);

async function shot(file, url, locatorText) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  for (const label of [/Accept all/i, /Accept Cookies/i, /I agree/i]) {
    const btn = page.getByRole("button", { name: label });
    if (await btn.count()) {
      try { await btn.first().click({ timeout: 1200 }); } catch {}
    }
  }
  const loc = page.getByText(locatorText, { exact: false }).first();
  try {
    await loc.scrollIntoViewIfNeeded({ timeout: 8000 });
    await page.waitForTimeout(500);
    const box = await loc.boundingBox();
    if (box) {
      // Capture a region around the cue heading
      await page.screenshot({
        path: path.join(OUT, file),
        clip: {
          x: Math.max(0, box.x - 40),
          y: Math.max(0, box.y - 40),
          width: Math.min(1320, Math.max(640, box.width + 520)),
          height: Math.min(720, Math.max(360, box.height + 420)),
        },
      });
      console.log("cropped", file);
      return;
    }
  } catch (e) {
    console.log("fallback full", file, e.message);
  }
  await page.screenshot({ path: path.join(OUT, file) });
  console.log("full", file);
}

await shot("03a-lex-fleet-fuel-card.png", "https://www.lovesfinancial.com/fuel-card-bundles", "Love’s Express Card");
await shot("03b-tvc-fuel-card.png", "https://www.lovesfinancial.com/fuel-card-bundles", "TVC Fuel Card");
await shot("13a-freight-factoring.png", "https://www.lovesfinancial.com/fuel-card-bundles", "Freight Factoring");
await shot("02b-lex-credit-card.png", "https://www.lovesfinancial.com/fuel-card-bundles", "Love’s Express Card");
await shot("11a-truck-wash.png", "https://www.loves.com/loves-truck-care-and-speedco", "Truck Wash");
await shot("01c-fleet-payment-networks.png", "https://www.loves.com/locations/ga/commerce/loves-travel-stop-commerce-765", "Accepted Payment Types");
await shot("08a-fastfill-cng.png", "https://www.loves.com/locations/tx/fort-worth/loves-travel-stop-fort-worth-281", "Fast Fill CNG");
await shot("06a-card-management.png", "https://www.loves.com/promo/lex-how-to", "Fuel Card Management");
await shot("05a-quikq.png", "https://www.loves.com/promo/lex-how-to", "QuikQ Portal Login");
await shot("14a-cdl-legal-protection.png", "https://www.lovesfinancial.com/service/legal-services-for-drivers", "Legal Protection for Commercial Drivers");

await browser.close();
console.log("done refine");
