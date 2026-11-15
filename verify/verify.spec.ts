/**
 * Design + interaction check in a real browser (Playwright / Chromium).
 * Runs the core task as a new person, and at every screen:
 *   - screenshots at 390px (mobile) and 1440px (desktop)
 *   - axe accessibility scan (WCAG 2 A/AA, incl. color contrast)
 *   - keyboard pass: Tab through, note anything without a visible focus style
 * Output: verify/screenshots/*.png and verify/report.md (both git-ignored).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "verify/screenshots";
const TEST_EMAIL = "labbook-tester+clerk_test@example.com";
// Unique per run, so leftovers from a failed run never match this run's checks.
const RUN = new Date().toISOString().slice(5, 16).replace("T", " ");
const IDEA = `Caramelized onion crunch (verify ${RUN})`;
// Constant, so the dev-only AI cache can reuse responses (the dish name is part of the prompt).
const DISH = "Yogurt (verify run)";
const YOGURT =
  "Yogurt is a very simple dish you need about 1/2 gallon jug of milk and then one of these small 10 in yogurt container that is not flavored at all uh you heat up the milk make sure it doesn't boil uh just until it steams a little bit and then from there you add 1/3 a cup of sugar maybe less if you like it less sweet and then you mix in the yogurt with the milk you stir it into everything blends and then you put it into these little jars and then you put all these little jars into this incubator and you let it sit for about 8 hours if you don't like it too tangy but I like it at 12 hours super tangy and then from there you can either keep it in the fridge or freeze it and then serve";

const report: string[] = ["# Verify report", "", `Run: ${new Date().toISOString()}`, ""];
let n = 0;

async function check(page: Page, name: string, opts: { keyboard?: boolean } = {}) {
  n += 1;
  const id = `${String(n).padStart(2, "0")}-${name}`;
  report.push(`## ${id}`, `URL: ${new URL(page.url()).pathname}${new URL(page.url()).search}`);

  for (const [label, size] of [
    ["mobile", { width: 390, height: 844 }],
    ["desktop", { width: 1440, height: 900 }],
  ] as const) {
    await page.setViewportSize(size);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) report.push(`- ⚠️ ${label}: page scrolls sideways (horizontal overflow)`);
    await page.screenshot({ path: `${SHOTS}/${id}-${label}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  if (axe.violations.length === 0) report.push("- axe: no violations");
  for (const v of axe.violations) {
    report.push(`- ⚠️ axe ${v.impact}: ${v.id}: ${v.help} (${v.nodes.length}×)`);
    for (const node of v.nodes.slice(0, 3)) report.push(`  - \`${node.target.join(" ")}\` ${node.failureSummary?.split("\n")[1] ?? ""}`);
  }

  if (opts.keyboard) {
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    const seen: string[] = [];
    const noFocusStyle: string[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const visible =
          (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
        const text = (el.getAttribute("aria-label") || el.textContent || (el as HTMLInputElement).placeholder || el.tagName)
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 40);
        return { key: `${el.tagName.toLowerCase()}:${text}`, visible };
      });
      if (!info) continue;
      if (seen.includes(info.key)) break;
      seen.push(info.key);
      if (!info.visible) noFocusStyle.push(info.key);
    }
    report.push(`- keyboard: ${seen.length} stops: ${seen.join(" → ")}`);
    if (noFocusStyle.length) report.push(`- ⚠️ no visible focus style: ${noFocusStyle.join(", ")}`);
    await page.keyboard.press("Tab");
    await page.screenshot({ path: `${SHOTS}/${id}-focus.png` });
  }
  report.push("");
}


/** Wait for an AI step to finish, or fail fast if the app shows its error state. */
async function waitForAi(page: Page, done: () => Promise<unknown>) {
  const alert = page.locator("main [role=alert]").filter({ visible: true });
  const result = await Promise.race([
    done().then(() => "done" as const),
    alert.waitFor({ timeout: 4 * 60_000 }).then(() => "error" as const),
  ]);
  if (result === "error") {
    throw new Error(`App showed its AI error state: "${(await alert.innerText()).trim()}" (likely the Gemini free-tier rate limit).`);
  }
}

test.beforeAll(async () => {
  mkdirSync(SHOTS, { recursive: true });
  await clerkSetup();
  // Make sure the test user exists (Clerk test emails never send real mail).
  const clerkApi = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const { data } = await clerkApi.users.getUserList({ emailAddress: [TEST_EMAIL] });
  if (data.length === 0) await clerkApi.users.createUser({ emailAddress: [TEST_EMAIL], skipPasswordRequirement: true });
});

test.afterAll(() => {
  writeFileSync("verify/report.md", report.join("\n"));
});

test("served CSS matches app/globals.css (dev server not stale)", async ({ page }) => {
  // The dev server has served stale Tailwind CSS before. Compare every color token.
  const src = readFileSync("app/globals.css", "utf8");
  const tokens = [...src.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]);
  await page.goto("/", { timeout: 60_000 });
  const served = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .map((s) => {
        try {
          return Array.from(s.cssRules).map((r) => r.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n")
  );
  const stale = tokens.filter(([name, hex]) => served.includes(name) && !served.includes(`${name}: ${hex}`));
  expect(stale, `Stale CSS. Restart the dev server (rm -rf .next). Mismatched: ${stale.map((t) => t.join(" ")).join(", ")}`).toEqual([]);
});

test("core task as a new person, every screen at 390 and 1440", async ({ page, browser }) => {
  // ---- Signed out ----
  await page.goto("/");
  // First load after an edit can take a while in dev while the page recompiles.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
  await check(page, "landing-signed-out", { keyboard: true });

  await page.goto("/s/11111111-1111-1111-1111-111111111111");
  await expect(page.getByRole("heading", { name: /isn.t shared anymore/ })).toBeVisible();
  await check(page, "share-link-off");

  // ---- Sign in ----
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your lab book" })).toBeVisible();
  await check(page, "home", { keyboard: true });

  // ---- Ideas: create, validate, move, delete ----
  // "New" menu: keyboard first (Enter opens, Tab reaches the options, Escape closes).
  const newBtn = page.getByRole("button", { name: "New" });
  await newBtn.focus();
  await page.keyboard.press("Enter");
  await expect(newBtn).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /^Idea A note/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(newBtn).toHaveAttribute("aria-expanded", "false");
  await expect(newBtn).toBeFocused();
  report.push("## New menu keyboard", "- Enter opens ✓ · Tab reaches “Idea” ✓ · Escape closes and returns focus ✓", "");
  await newBtn.click();
  await check(page, "home-new-menu-open");
  await page.getByRole("link", { name: /^Idea A note/ }).click();
  await page.waitForURL(/\/ideas\/new/);
  await page.getByRole("button", { name: "Save idea" }).click();
  await expect(page.getByText(/Give the idea a short name/)).toBeVisible();
  await page.getByLabel("Idea", { exact: true }).fill(IDEA);
  await page.getByLabel(/Note/).fill("Had it on pho. Crunchy and sweet. Try drying in a low oven?");
  await page.getByLabel(/Link/).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save idea" }).click();
  await expect(page.getByText(/doesn't look like a web link/)).toBeVisible();
  await check(page, "idea-new-errors", { keyboard: true });
  await page.getByLabel(/Link/).fill("example.com/onions");
  await page.getByRole("button", { name: "Save idea" }).click();
  await page.waitForURL(/\/i\//);
  const ideaUrl = page.url();
  await expect(page.getByRole("link", { name: /example\.com\/onions/ })).toBeVisible();
  await check(page, "idea", { keyboard: true });

  await page.goto("/?tab=ideas");
  const ideaRow = page.getByRole("listitem").filter({ hasText: IDEA, visible: true });
  await expect(ideaRow).toBeVisible();
  await check(page, "home-ideas-with-idea");
  await ideaRow.getByRole("button", { name: "Development" }).click();
  await expect(ideaRow).toHaveCount(0); // it leaves the Ideas tab once moved
  await page.goto("/?tab=development");
  await expect(page.getByRole("listitem").filter({ hasText: IDEA, visible: true })).toBeVisible();
  await check(page, "home-development-moved-idea");

  await page.goto(ideaUrl);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete this idea" }).click();
  await page.waitForURL(/tab=ideas/);
  // Scope to <main>: Next keeps hidden copies of past pages, and its screen-reader
  // route announcer still holds the old title.
  await expect(page.locator("main").getByText(IDEA).filter({ visible: true })).toHaveCount(0);

  // ---- Capture ----
  await page.goto("/");
  await page.getByRole("button", { name: "New" }).click();
  await page.getByRole("link", { name: /^Dictation/ }).click();
  await page.getByRole("button", { name: /Save their words/ }).click();
  await expect(page.getByText(/Paste or dictate/)).toBeVisible();
  await check(page, "new-empty-error", { keyboard: true });

  await page.getByLabel("The cook's words").fill(YOGURT);
  await page.getByLabel(/Dish name/).fill(DISH);
  await page.getByLabel(/Whose words/).fill("Grandma");
  await page.getByRole("button", { name: /Save their words/ }).click();
  await page.waitForURL(/\/d\//);
  await check(page, "dictation", { keyboard: true });

  await page.goto("/?tab=ideas");
  await expect(page.getByText(DISH).first()).toBeVisible();
  await check(page, "home-ideas-tab");
  await page.getByText(DISH).first().click();
  await page.waitForURL(/\/d\//);

  // ---- Create recipe (pass 1) ----
  await page.getByRole("button", { name: "Create recipe" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await check(page, "creating-loading");
  await waitForAi(page, () => page.waitForURL(/\/r\//, { timeout: 4 * 60_000 }));
  const recipeUrl = page.url();
  await expect(page.getByRole("heading", { name: /questions/i })).toBeVisible();
  await check(page, "questions", { keyboard: true });

  await page.goto("/?tab=development");
  await check(page, "home-development-tab");
  await page.goto(recipeUrl);

  // ---- Answer: one suggestion, one typed, rest blank ----
  await page.getByRole("button", { name: "Use suggestion" }).first().click();
  await check(page, "questions-suggestion-used");
  const boxes = page.getByPlaceholder("Your answer");
  if ((await boxes.count()) > 1) await boxes.nth(1).fill("Plain Dannon, the small single cup.");
  await page.getByRole("button", { name: /Make the recipe/ }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await check(page, "finishing-loading");
  await waitForAi(page, () =>
    page.getByRole("heading", { name: "Ingredients" }).waitFor({ timeout: 4 * 60_000 })
  );
  await check(page, "recipe-finished", { keyboard: true });

  // ---- Send ----
  await page.getByRole("button", { name: "Make a link" }).click();
  const shareUrl = await page.getByLabel("Private link").inputValue({ timeout: 15_000 });
  expect(shareUrl).toMatch(/\/s\/[0-9a-f-]{36}$/);
  await check(page, "recipe-shared");

  const stranger = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const sp = await stranger.newPage();
  await sp.goto(new URL(new URL(shareUrl).pathname, page.url()).toString());
  await expect(sp.getByRole("heading", { name: "Ingredients" })).toBeVisible();
  await expect(sp.getByRole("button", { name: /Sign in to save/ })).toBeVisible();
  await check(sp, "shared-signed-out", { keyboard: true });

  await page.getByRole("button", { name: "Turn off link" }).click();
  await expect(page.getByRole("button", { name: "Make a link" })).toBeVisible();
  await sp.reload();
  await expect(sp.getByRole("heading", { name: /isn.t shared anymore/ })).toBeVisible();
  await stranger.close();

  // ---- Move a finished recipe back to Development and back again ----
  await page.goto(recipeUrl);
  await page.getByRole("button", { name: "Development" }).click();
  await expect(page.getByRole("button", { name: "Finished" })).toBeVisible(); // now offers "Finished"
  await expect(page.getByRole("button", { name: "Development" })).toHaveCount(0);
  await page.reload();
  await expect(page.locator("main").getByRole("link", { name: "Development" })).toBeVisible(); // breadcrumb follows the move
  await page.getByRole("button", { name: "Finished" }).click();
  await expect(page.getByRole("button", { name: "Development" })).toBeVisible();

  await page.goto("/?tab=finished");
  await check(page, "home-finished-tab");

  // ---- Not found / someone else's ----
  await page.goto("/r/00000000-0000-0000-0000-000000000000");
  await check(page, "not-found");

  // ---- Clean up: delete this run's recipe (exercises the confirm dialog) ----
  await page.goto(recipeUrl);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete this recipe" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto(recipeUrl);
  await expect(page.getByRole("heading", { name: "Not in your lab book" })).toBeVisible();
});
