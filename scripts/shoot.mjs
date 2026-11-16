// Playwright screenshot + console check for Observatory v2.
// Uses system Google Chrome (channel: 'chrome') — no playwright chromium download needed.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const URL = process.env.OBS_URL || "http://127.0.0.1:5180/";
const OUT = process.env.OBS_OUT || "docs/stage.png";

mkdirSync(join(dirname(import.meta.dirname), "docs"), { recursive: true });

const errors = [];
const warnings = [];
const logs = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (msg) => {
  const t = msg.type();
  if (t === "error") errors.push(msg.text());
  else if (t === "warning") warnings.push(msg.text());
  else logs.push(`[${t}] ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
page.on("requestfailed", (req) =>
  errors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText || ""}`)
);

await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
// wait for the stage sprites to paint
await page.waitForSelector("text=HERMES OBSERVATORY", { timeout: 15000 });
await page.waitForTimeout(2500);

// click through tabs to verify each view renders (kanban/tokens/delegations/logs)
for (const tab of ["KANBAN", "TOKENS", "DELEGATIONS", "LOGS", "STAGE"]) {
  const trigger = page.getByText(tab, { exact: true }).first();
  if (await trigger.count()) {
    await trigger.click();
    await page.waitForTimeout(700);
  }
}

// back to stage for the hero screenshot
const stage = page.getByText("STAGE", { exact: true }).first();
if (await stage.count()) await stage.click();
await page.waitForTimeout(1500);

await page.screenshot({ path: OUT, fullPage: false });
await browser.close();

console.log("=== SCREENSHOT === " + OUT);
console.log("=== CONSOLE ERRORS (" + errors.length + ") ===");
console.log(errors.length ? errors.join("\n") : "(none)");
console.log("=== CONSOLE WARNINGS (" + warnings.length + ") ===");
console.log(warnings.length ? warnings.join("\n") : "(none)");
