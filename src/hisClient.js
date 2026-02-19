import { chromium } from "playwright";
import { parsePeriod, parsePlanName, parseUsageMb } from "./parser.js";

function normalizePhone(text) {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 10 ? digits : "";
}

async function waitDashboard(page, timeoutMs) {
  await page
    .locator("text=ステータス情報")
    .first()
    .waitFor({ timeout: timeoutMs });
}

export async function fetchAllUsage(config) {
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(config.timeoutMs);

  const results = [];
  try {
    await page.goto(config.hisLoginUrl, { waitUntil: "domcontentloaded" });

    await page.locator(config.selectors.loginId).first().fill(config.hisId);
    await page.locator(config.selectors.loginPassword).first().fill(config.hisPassword);
    await page.locator(config.selectors.loginSubmit).first().click();

    await waitDashboard(page, config.timeoutMs);

    const simSelect = page.locator(config.selectors.simSelect).first();
    const options = await simSelect.locator("option").allTextContents();
    const values = await simSelect.locator("option").evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("value") ?? "")
    );

    const candidates = options
      .map((text, idx) => ({ text, value: values[idx] }))
      .map((x) => ({
        ...x,
        phone: normalizePhone(x.text)
      }))
      .filter((x) => x.phone);

    if (candidates.length === 0) {
      throw new Error("No phone numbers found in SIM dropdown.");
    }

    for (const item of candidates) {
      try {
        try {
          await simSelect.selectOption({ value: item.value });
        } catch {
          await simSelect.selectOption({ label: item.text });
        }

        await page.waitForTimeout(700);
        const bodyText = await page.locator("body").innerText();

        const usageMb = parseUsageMb(bodyText);
        const period = parsePeriod(bodyText);
        const planName = parsePlanName(bodyText);

        if (usageMb === null) {
          throw new Error("Failed to parse usage MB from page.");
        }

        results.push({
          phone: item.phone,
          usageMb,
          periodStart: period.start,
          periodEnd: period.end,
          planName,
          status: "ok",
          errorMessage: ""
        });
      } catch (err) {
        results.push({
          phone: item.phone,
          usageMb: "",
          periodStart: "",
          periodEnd: "",
          planName: "",
          status: "failed",
          errorMessage: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return results;
  } finally {
    await context.close();
    await browser.close();
  }
}
